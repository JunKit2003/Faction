import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupTestApp, createAdmin, signIn, auditRows, PASSWORD, type TestCtx } from './helpers.js';
import { resetRateLimits } from '../src/auth/ratelimit.js';

let ctx: TestCtx;
let ownerId: string;
beforeAll(async () => { ctx = await setupTestApp(); });
afterAll(async () => { await ctx.close(); });
beforeEach(async () => {
  await ctx.reset();
  resetRateLimits();
  ownerId = await createAdmin(ctx.db, 'owner@faction.my', { name: 'Owner' });
});

describe('managing admins', () => {
  it('lists admins without password hashes', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const res = await s.get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ id: ownerId, email: 'owner@faction.my', name: 'Owner', disabledAt: null });
    expect(JSON.stringify(res.body)).not.toMatch(/password|argon/i);
  });

  it('creates an admin who can then sign in, and audits it without the password', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const res = await s.post('/api/admin/users').send({ email: 'Staff@Faction.my', name: 'Staff', password: 'staff-password-1' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'staff@faction.my', name: 'Staff' });
    await signIn(ctx.app, 'staff@faction.my', 'staff-password-1');
    const row = (await auditRows(ctx.db)).find((r) => r.action === 'user.create')!;
    expect(row.user_email).toBe('owner@faction.my');
    expect(JSON.parse(row.after!)).toEqual({ email: 'staff@faction.my', name: 'Staff', disabled: false });
    expect(JSON.stringify(row)).not.toContain('staff-password-1');
  });

  it('rejects duplicate email and short passwords', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    expect((await s.post('/api/admin/users').send({ email: 'owner@faction.my', name: 'X', password: 'long-enough-pw' })).status).toBe(409);
    const short = await s.post('/api/admin/users').send({ email: 'x@faction.my', name: 'X', password: 'short' });
    expect(short.status).toBe(422);
    expect(short.body.issues[0]).toEqual({ path: 'password', message: 'Use at least 10 characters' });
  });

  it('cannot disable or delete yourself', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const dis = await s.patch(`/api/admin/users/${ownerId}`).send({ disabled: true });
    expect(dis.status).toBe(400);
    expect(dis.body.error).toBe("You can't disable your own account.");
    const del = await s.del(`/api/admin/users/${ownerId}`);
    expect(del.status).toBe(400);
    expect(del.body.error).toBe("You can't delete your own account.");
  });

  it('disabling another admin ends their sessions; enabling restores sign-in', async () => {
    const staffId = await createAdmin(ctx.db, 'staff@faction.my');
    const staff = await signIn(ctx.app, 'staff@faction.my');
    const s = await signIn(ctx.app, 'owner@faction.my');
    expect((await s.patch(`/api/admin/users/${staffId}`).send({ disabled: true })).status).toBe(200);
    expect((await staff.get('/api/auth/me')).status).toBe(401);
    expect((await s.patch(`/api/admin/users/${staffId}`).send({ disabled: false })).status).toBe(200);
    await signIn(ctx.app, 'staff@faction.my');
    const actions = (await auditRows(ctx.db)).map((r) => r.action);
    expect(actions).toContain('user.disable');
    expect(actions).toContain('user.enable');
  });

  it('deletes another admin and keeps their audit history', async () => {
    const staffId = await createAdmin(ctx.db, 'staff@faction.my');
    await signIn(ctx.app, 'staff@faction.my');
    const s = await signIn(ctx.app, 'owner@faction.my');
    expect((await s.del(`/api/admin/users/${staffId}`)).status).toBe(204);
    const rows = await auditRows(ctx.db);
    expect(rows.find((r) => r.action === 'auth.login' && r.user_email === 'staff@faction.my')).toBeTruthy();
    expect(rows[0]!.action).toBe('user.delete');
  });

  it('resets another admin password and audits it without the password', async () => {
    const staffId = await createAdmin(ctx.db, 'staff@faction.my');
    const s = await signIn(ctx.app, 'owner@faction.my');
    expect((await s.post(`/api/admin/users/${staffId}/password`).send({ password: 'brand-new-password' })).status).toBe(204);
    await signIn(ctx.app, 'staff@faction.my', 'brand-new-password');
    const row = (await auditRows(ctx.db)).find((r) => r.action === 'user.password_reset')!;
    expect(row.target_key).toBe(staffId);
    expect(row.before).toBeNull();
    expect(row.after).toBeNull();
    expect(JSON.stringify(row)).not.toContain('brand-new-password');
  });

  it('404s for unknown admins', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    expect((await s.patch('/api/admin/users/NOPE').send({ name: 'x' })).status).toBe(404);
  });
});

describe('own password', () => {
  it('requires the current password', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const bad = await s.put('/api/admin/me/password').send({ currentPassword: 'wrong-wrong', newPassword: 'another-password' });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('Current password is incorrect.');
    const ok = await s.put('/api/admin/me/password').send({ currentPassword: PASSWORD, newPassword: 'another-password' });
    expect(ok.status).toBe(204);
    expect((await s.get('/api/auth/me')).status).toBe(200); // current session kept
    await signIn(ctx.app, 'owner@faction.my', 'another-password');
    expect((await auditRows(ctx.db)).some((r) => r.action === 'me.password_change')).toBe(true);
  });
});
