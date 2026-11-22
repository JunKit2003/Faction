import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupTestApp, createAdmin, signIn, auditRows, type TestCtx } from './helpers.js';
import { resetRateLimits } from '../src/auth/ratelimit.js';
import { nowIso } from '../src/db/ids.js';

let ctx: TestCtx;
let photo: Buffer;
beforeAll(async () => {
  ctx = await setupTestApp();
  photo = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#2a6' } })
    .jpeg().withExif({ IFD0: { Copyright: 'secret-gps-owner' } }).toBuffer();
});
afterAll(async () => { await ctx.close(); });
beforeEach(async () => {
  await ctx.reset();
  resetRateLimits();
  await createAdmin(ctx.db, 'owner@faction.my');
});

const UPLOAD_COPY = 'Only JPG, PNG or WebP images up to 15 MB.';
const goodSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80"><rect width="200" height="80" fill="#000"/></svg>');

async function upload(s: Awaited<ReturnType<typeof signIn>>, buf: Buffer, name: string, query = '') {
  return s.post(`/api/admin/media${query}`).attach('file', buf, name).field('alt', 'A bike');
}

describe('upload', () => {
  it('stores a resized webp set without EXIF and audits it', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const res = await upload(s, photo, 'trail.jpg');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ width: 2400, height: 1600, alt: 'A bike', mime: 'image/webp' });
    expect(res.body.url).toBe(`/uploads/${res.body.id}-2400.webp`);
    expect(res.body.srcset).toBe([480, 960, 1600, 2400].map((w) => `/uploads/${res.body.id}-${w}.webp ${w}w`).join(', '));
    for (const w of [480, 960, 1600, 2400]) expect(fs.existsSync(path.join(ctx.cfg.uploadDir, `${res.body.id}-${w}.webp`))).toBe(true);
    const meta = await sharp(path.join(ctx.cfg.uploadDir, `${res.body.id}-2400.webp`)).metadata();
    expect(meta.exif).toBeUndefined();
    const file = await request(ctx.app).get(res.body.url);
    expect(file.status).toBe(200);
    expect(file.headers['cache-control']).toContain('immutable');
    expect(file.headers['x-content-type-options']).toBe('nosniff');
    const row = (await auditRows(ctx.db))[0]!;
    expect(row.action).toBe('media.upload');
    expect(JSON.parse(row.after!)).toEqual({ originalName: 'trail.jpg', alt: 'A bike' });
  });

  it('does not upscale small images', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const small = await sharp({ create: { width: 700, height: 500, channels: 3, background: '#000' } }).png().toBuffer();
    const res = await upload(s, small, 'small.png');
    expect(res.body.width).toBe(700);
    expect(res.body.srcset).toBe(`/uploads/${res.body.id}-480.webp 480w, /uploads/${res.body.id}-700.webp 700w`);
  });

  it('refuses a PDF renamed to .jpg', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const res = await upload(s, Buffer.from('%PDF-1.4 fake pdf'), 'price-list.jpg');
    expect(res.status).toBe(415);
    expect(res.body.error).toBe(UPLOAD_COPY);
  });

  it('refuses files over 15 MB', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const res = await upload(s, Buffer.alloc(16 * 1024 * 1024, 1), 'huge.jpg');
    expect(res.status).toBe(413);
    expect(res.body.error).toBe(UPLOAD_COPY);
  });

  it('accepts a clean SVG only for logos', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    expect((await upload(s, goodSvg, 'logo.svg')).status).toBe(415);
    const ok = await upload(s, goodSvg, 'logo.svg', '?purpose=logo');
    expect(ok.status).toBe(201);
    expect(ok.body).toMatchObject({ mime: 'image/svg+xml', width: 200, height: 80, srcset: '' });
    const file = await request(ctx.app).get(ok.body.url);
    expect(file.headers['content-security-policy']).toContain("default-src 'none'");
  });

  it.each([
    ['script', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    ['handler', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>'],
    ['js link', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="javascript:alert(1)"><rect/></a></svg>'],
    ['foreignObject', '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div/></foreignObject></svg>'],
  ])('refuses an SVG with %s', async (_n, svg) => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    expect((await upload(s, Buffer.from(svg), 'evil.svg', '?purpose=logo')).status).toBe(415);
  });

  it('requires sign-in', async () => {
    expect((await request(ctx.app).get('/api/admin/media')).status).toBe(401);
  });
});

describe('library', () => {
  it('lists, edits alt text (audited) and soft-deletes unused images', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const up = await upload(s, photo, 'trail.jpg');
    const list = await s.get('/api/admin/media');
    expect(list.body).toEqual([expect.objectContaining({ id: up.body.id, originalName: 'trail.jpg', usedIn: [] })]);
    const patched = await s.patch(`/api/admin/media/${up.body.id}`).send({ alt: 'Rider mid-air' });
    expect(patched.status).toBe(200);
    expect(patched.body.alt).toBe('Rider mid-air');
    const upd = (await auditRows(ctx.db))[0]!;
    expect(upd.action).toBe('media.update');
    expect(JSON.parse(upd.before!)).toEqual({ alt: 'A bike' });
    expect(JSON.parse(upd.after!)).toEqual({ alt: 'Rider mid-air' });
    expect((await s.del(`/api/admin/media/${up.body.id}`)).status).toBe(204);
    expect((await s.get('/api/admin/media')).body).toEqual([]);
    const row = await ctx.db.selectFrom('media').selectAll().where('id', '=', up.body.id).executeTakeFirstOrThrow();
    expect(row.deleted_at).not.toBeNull();
    expect(fs.existsSync(path.join(ctx.cfg.uploadDir, `${up.body.id}-2400.webp`))).toBe(true);
    expect((await auditRows(ctx.db))[0]!.action).toBe('media.delete');
  });

  it('refuses to delete an image used by a section and says where', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const up = await upload(s, photo, 'hero1.jpg');
    await ctx.db.insertInto('content_sections').values({ key: 'home.hero', data: JSON.stringify({ slideIds: [up.body.id] }), version: 1, updated_at: nowIso(), updated_by: null }).execute();
    const res = await s.del(`/api/admin/media/${up.body.id}`);
    expect(res.status).toBe(409);
    expect(res.body.usedIn).toEqual(['home.hero']);
    expect((await s.get('/api/admin/media')).body[0].usedIn).toEqual(['home.hero']);
  });

  it('404s for unknown or deleted media', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    expect((await s.patch('/api/admin/media/NOPE').send({ alt: 'x' })).status).toBe(404);
  });
});
