import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupTestApp, createAdmin, signIn, auditRows, type TestCtx } from './helpers.js';
import { resetRateLimits } from '../src/auth/ratelimit.js';
import { seedIfEmpty } from '../src/seed/run.js';

let ctx: TestCtx;
beforeAll(async () => { ctx = await setupTestApp(); });
afterAll(async () => { await ctx.close(); });
beforeEach(async () => {
  await ctx.reset();
  resetRateLimits();
  await seedIfEmpty(ctx.db, ctx.cfg);
  await createAdmin(ctx.db, 'owner@faction.my');
  await createAdmin(ctx.db, 'staff@faction.my');
}, 120_000);

type S = Awaited<ReturnType<typeof signIn>>;
async function setStat(s: S, value: string) {
  const cur = (await s.get('/api/admin/sections/home.stats')).body;
  const data = structuredClone(cur.data);
  data.items[0].value = value;
  expect((await s.put('/api/admin/sections/home.stats').send({ data, version: cur.version })).status).toBe(200);
}
const publicStat = async () => (await request(ctx.app).get('/api/content')).body.sections['home.stats'].items[0].value;

describe('GET /api/admin/audit', () => {
  it('lists newest first with parsed before/after and filters', async () => {
    const staff = await signIn(ctx.app, 'staff@faction.my');
    await setStat(staff, '2,000+');
    const owner = await signIn(ctx.app, 'owner@faction.my');
    const all = await owner.get('/api/admin/audit');
    expect(all.status).toBe(200);
    expect(all.body.items[0]).toMatchObject({ action: 'auth.login', userEmail: 'owner@faction.my' });
    expect(all.body.total).toBe(3);
    const bySection = await owner.get('/api/admin/audit?targetKey=home.stats');
    expect(bySection.body.total).toBe(1);
    expect(bySection.body.items[0]).toMatchObject({ action: 'section.update', userEmail: 'staff@faction.my', targetKey: 'home.stats' });
    expect(bySection.body.items[0].before.items[0].value).toBe('1,800+');
    expect(bySection.body.items[0].after.items[0].value).toBe('2,000+');
    const byAction = await owner.get('/api/admin/audit?action=auth.login');
    expect(byAction.body.total).toBe(2);
    const staffId = bySection.body.items[0].userId;
    expect((await owner.get(`/api/admin/audit?userId=${staffId}`)).body.total).toBe(2);
    const future = await owner.get('/api/admin/audit?from=2999-01-01T00:00:00.000Z');
    expect(future.body.total).toBe(0);
    const paged = await owner.get('/api/admin/audit?page=2&pageSize=2');
    expect(paged.body.items).toHaveLength(1);
  });

  it('rejects bad filters', async () => {
    const owner = await signIn(ctx.app, 'owner@faction.my');
    expect((await owner.get('/api/admin/audit?pageSize=1000')).status).toBe(422);
  });
});

describe('restore', () => {
  it('restores the earlier version, goes live and is itself audited', async () => {
    const staff = await signIn(ctx.app, 'staff@faction.my');
    await setStat(staff, '2,000+');
    const owner = await signIn(ctx.app, 'owner@faction.my');
    const entry = (await owner.get('/api/admin/audit?targetKey=home.stats')).body.items[0];
    const res = await owner.post(`/api/admin/audit/${entry.id}/restore`).send({ which: 'before' });
    expect(res.status).toBe(200);
    expect(await publicStat()).toBe('1,800+');
    const row = (await auditRows(ctx.db))[0]!;
    expect(row).toMatchObject({ action: 'section.restore', user_email: 'owner@faction.my', target_key: 'home.stats' });
    expect(JSON.parse(row.before!).items[0].value).toBe('2,000+');
    expect(JSON.parse(row.after!).items[0].value).toBe('1,800+');
    // and back again with "after"
    expect((await owner.post(`/api/admin/audit/${entry.id}/restore`).send({ which: 'after' })).status).toBe(200);
    expect(await publicStat()).toBe('2,000+');
  });

  it('un-deletes images the restored version uses', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const png = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#123' } }).png().toBuffer();
    const upload = async (name: string) => (await s.post('/api/admin/media').attach('file', png, name).field('alt', name)).body as { id: string };
    const a = await upload('a.png');
    const b = await upload('b.png');
    const setAbout = async (imageId: string) => {
      const cur = (await s.get('/api/admin/sections/about')).body;
      expect((await s.put('/api/admin/sections/about').send({ data: { ...cur.data, imageId }, version: cur.version })).status).toBe(200);
    };
    await setAbout(a.id);
    await setAbout(b.id);
    const oldImage = a.id;
    expect((await s.del(`/api/admin/media/${oldImage}`)).status).toBe(204);
    const entry = (await s.get('/api/admin/audit?targetKey=about&action=section.update')).body.items[0];
    expect((await s.post(`/api/admin/audit/${entry.id}/restore`).send({ which: 'before' })).status).toBe(200);
    const lib = (await s.get('/api/admin/media')).body.map((m: { id: string }) => m.id);
    expect(lib).toContain(oldImage);
    const pub = (await request(ctx.app).get('/api/content')).body;
    expect(pub.sections.about.imageId).toBe(oldImage);
    expect(pub.media[oldImage]).toBeTruthy();
  });

  it('refuses a version that no longer passes validation', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    await setStat(s, '3,000+');
    const entry = (await s.get('/api/admin/audit?targetKey=home.stats')).body.items[0];
    await ctx.db.updateTable('audit_log').set({ before: JSON.stringify({ items: 'broken' }) }).where('id', '=', entry.id).execute();
    const res = await s.post(`/api/admin/audit/${entry.id}/restore`).send({ which: 'before' });
    expect(res.status).toBe(422);
    expect(await publicStat()).toBe('3,000+');
  });

  it('only restores section entries that have that version', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const login = (await s.get('/api/admin/audit?action=auth.login')).body.items[0];
    expect((await s.post(`/api/admin/audit/${login.id}/restore`).send({ which: 'before' })).status).toBe(400);
    expect((await s.post('/api/admin/audit/NOPE/restore').send({ which: 'before' })).status).toBe(404);
  });
});
