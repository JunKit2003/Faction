import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupTestApp, createAdmin, signIn, auditRows, type TestCtx } from './helpers.js';
import { resetRateLimits } from '../src/auth/ratelimit.js';
import { seedIfEmpty } from '../src/seed/run.js';

let ctx: TestCtx;
beforeAll(async () => {
  ctx = await setupTestApp();
  await seedIfEmpty(ctx.db, ctx.cfg);
});
afterAll(async () => { await ctx.close(); });
beforeEach(async () => {
  resetRateLimits();
  await ctx.db.deleteFrom('audit_log').execute();
  await ctx.db.deleteFrom('sessions').execute();
  await ctx.db.deleteFrom('users').execute();
  await createAdmin(ctx.db, 'owner@faction.my');
  await createAdmin(ctx.db, 'staff@faction.my');
});

describe('GET /api/content', () => {
  it('returns every section and the media they use', async () => {
    const res = await request(ctx.app).get('/api/content');
    expect(res.status).toBe(200);
    expect(res.body.sections['home.hero'].title).toBe('Ride _hard._ We’ll keep you *rolling.*');
    const slide = res.body.sections['home.hero'].slideIds[0];
    expect(res.body.media[slide]).toMatchObject({ id: slide, url: expect.stringMatching(/^\/uploads\//), alt: 'Mountain biking backdrop' });
    expect(res.headers['cache-control']).toBe('no-cache');
    const again = await request(ctx.app).get('/api/content').set('If-None-Match', res.headers.etag!);
    expect(again.status).toBe(304);
  });
});

describe('admin sections', () => {
  it('reads a section with its version', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const res = await s.get('/api/admin/sections/home.stats');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ key: 'home.stats', version: expect.any(Number) });
    expect(res.body.data.items[0].value).toBe('1,800+');
    expect((await s.get('/api/admin/sections/nope')).status).toBe(404);
  });

  it('saves, goes live, bumps version and audits before/after', async () => {
    const s = await signIn(ctx.app, 'staff@faction.my');
    const cur = (await s.get('/api/admin/sections/home.stats')).body;
    const data = structuredClone(cur.data);
    data.items[0].value = '2,000+';
    const res = await s.put('/api/admin/sections/home.stats').send({ data, version: cur.version });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(cur.version + 1);
    const pub = await request(ctx.app).get('/api/content');
    expect(pub.body.sections['home.stats'].items[0].value).toBe('2,000+');
    const row = (await auditRows(ctx.db))[0]!;
    expect(row).toMatchObject({ action: 'section.update', target_type: 'section', target_key: 'home.stats', user_email: 'staff@faction.my' });
    expect(JSON.parse(row.before!).items[0].value).toBe(cur.data.items[0].value);
    expect(JSON.parse(row.after!).items[0].value).toBe('2,000+');
  });

  it('refuses a stale version with the conflict copy', async () => {
    const owner = await signIn(ctx.app, 'owner@faction.my');
    const staff = await signIn(ctx.app, 'staff@faction.my');
    const a = (await owner.get('/api/admin/sections/home.map')).body;
    const b = (await staff.get('/api/admin/sections/home.map')).body;
    expect((await owner.put('/api/admin/sections/home.map').send({ data: { ...a.data, title: 'Owner' }, version: a.version })).status).toBe(200);
    const res = await staff.put('/api/admin/sections/home.map').send({ data: { ...b.data, title: 'Staff' }, version: b.version });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Someone else changed this, reload to see their version.');
    expect((await request(ctx.app).get('/api/content')).body.sections['home.map'].title).toBe('Owner');
  });

  it('rejects invalid data with field issues', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const cur = (await s.get('/api/admin/sections/site')).body;
    const res = await s.put('/api/admin/sections/site').send({ data: { ...cur.data, mapEmbedUrl: 'https://example.com/map' }, version: cur.version });
    expect(res.status).toBe(422);
    expect(res.body.issues).toEqual([{ path: 'mapEmbedUrl', message: 'Paste the embed link from Google Maps → Share → Embed a map.' }]);
  });

  it('rejects references to images that do not exist', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const cur = (await s.get('/api/admin/sections/about')).body;
    const res = await s.put('/api/admin/sections/about').send({ data: { ...cur.data, imageId: 'MISSING' }, version: cur.version });
    expect(res.status).toBe(422);
    expect(res.body.issues).toEqual([{ path: 'imageId', message: 'That image no longer exists. Choose another.' }]);
  });

  it('requires sign-in', async () => {
    expect((await request(ctx.app).get('/api/admin/sections/site')).status).toBe(401);
  });
});
