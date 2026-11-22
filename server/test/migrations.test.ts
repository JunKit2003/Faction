import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupTestApp, type TestCtx } from './helpers.js';
import { newId, nowIso } from '../src/db/ids.js';
import { migrateToLatest } from '../src/db/migrations.js';

let ctx: TestCtx;
beforeAll(async () => { ctx = await setupTestApp(); });
afterAll(async () => { await ctx.close(); });

describe('migrations', () => {
  it('are idempotent', async () => {
    await expect(migrateToLatest(ctx.db)).resolves.toBeUndefined();
  });

  it('create all five tables with the expected columns', async () => {
    const { db } = ctx;
    const t = nowIso();
    const userId = newId();
    await db.insertInto('users').values({ id: userId, email: 'a@b.c', name: 'A', password_hash: 'x', created_at: t, last_login_at: null, disabled_at: null }).execute();
    await db.insertInto('sessions').values({ id: 'h', user_id: userId, expires_at: t, ip: '1', user_agent: 'ua' }).execute();
    const big = 'x'.repeat(200_000);
    await db.insertInto('content_sections').values({ key: 'faq', data: big, version: 1, updated_at: t, updated_by: userId }).execute();
    await db.insertInto('media').values({ id: newId(), filename: 'f.webp', original_name: 'f.jpg', mime: 'image/webp', width: 1, height: 1, alt: '', created_at: t, created_by: userId, deleted_at: null }).execute();
    await db.insertInto('audit_log').values({ id: newId(), at: t, user_id: userId, user_email: 'a@b.c', action: 'auth.login', target_type: 'user', target_key: userId, before: null, after: big, ip: '1' }).execute();
    const row = await db.selectFrom('content_sections').selectAll().executeTakeFirstOrThrow();
    expect(row.data.length).toBe(200_000);
    expect(Number(row.version)).toBe(1);
    const audit = await db.selectFrom('audit_log').selectAll().executeTakeFirstOrThrow();
    expect(audit.after?.length).toBe(200_000);
  });
});

describe('ids', () => {
  it('newId is 26 chars and sorts by creation time', async () => {
    const a = newId();
    await new Promise((r) => setTimeout(r, 2));
    const b = newId();
    expect(a).toHaveLength(26);
    expect(a < b).toBe(true);
  });
  it('newId is monotonic within the same millisecond', () => {
    const ids = Array.from({ length: 50 }, () => newId());
    expect([...ids].sort()).toEqual(ids);
  });
  it('nowIso is a 24-char UTC ISO string', () => {
    expect(nowIso()).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  });
});
