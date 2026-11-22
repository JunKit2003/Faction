import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupTestApp, createAdmin, signIn, auditRows, ORIGIN, PASSWORD, type TestCtx } from './helpers.js';
import { resetRateLimits } from '../src/auth/ratelimit.js';
import { bootstrapAdmin } from '../src/auth/bootstrap.js';

let ctx: TestCtx;
beforeAll(async () => { ctx = await setupTestApp(); });
afterAll(async () => { await ctx.close(); });
beforeEach(async () => {
  await ctx.reset();
  resetRateLimits();
  await createAdmin(ctx.db, 'owner@faction.my', { name: 'Owner' });
});

const login = (body: object, ip = '10.0.0.1') =>
  request(ctx.app).post('/api/auth/login').set('Origin', ORIGIN).set('X-Forwarded-For', ip).send(body);

describe('sign in', () => {
  it('sets an httpOnly fsid cookie and returns the admin', async () => {
    const res = await login({ email: 'Owner@Faction.my ', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: expect.any(String), email: 'owner@faction.my', name: 'Owner' });
    const cookie = res.headers['set-cookie']![0]!;
    expect(cookie).toMatch(/^fsid=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Max-Age=604800/);
  });

  it('wrong password and unknown email give the same message', async () => {
    const a = await login({ email: 'owner@faction.my', password: 'nope-nope-nope' });
    const b = await login({ email: 'ghost@faction.my', password: 'nope-nope-nope' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error).toBe('Email or password is incorrect.');
    expect(b.body.error).toBe('Email or password is incorrect.');
  });

  it('refuses the 6th attempt within 15 minutes even with the right password', async () => {
    for (let i = 0; i < 5; i++) expect((await login({ email: 'owner@faction.my', password: 'wrong-wrong' })).status).toBe(401);
    const res = await login({ email: 'owner@faction.my', password: PASSWORD });
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many attempts. Try again in 15 minutes.');
  });

  it('rate limit is per IP + email', async () => {
    for (let i = 0; i < 5; i++) await login({ email: 'owner@faction.my', password: 'wrong-wrong' }, '10.0.0.1');
    expect((await login({ email: 'owner@faction.my', password: PASSWORD }, '10.0.0.2')).status).toBe(200);
  });

  it('disabled admins cannot sign in', async () => {
    await createAdmin(ctx.db, 'gone@faction.my', { disabled: true });
    expect((await login({ email: 'gone@faction.my', password: PASSWORD })).status).toBe(401);
  });

  it('audits login, failed login and logout without any password text', async () => {
    await login({ email: 'owner@faction.my', password: 'secret-wrong-pw' });
    const s = await signIn(ctx.app, 'owner@faction.my');
    await s.post('/api/auth/logout');
    const rows = await auditRows(ctx.db);
    expect(rows.map((r) => r.action)).toEqual(['auth.logout', 'auth.login', 'auth.login_failed']);
    expect(rows[2]!.user_email).toBe('owner@faction.my');
    const blob = JSON.stringify(rows);
    expect(blob).not.toContain('secret-wrong-pw');
    expect(blob).not.toContain(PASSWORD);
    expect(blob).not.toContain('$argon2');
  });
});

describe('protection', () => {
  it('admin API needs a session', async () => {
    expect((await request(ctx.app).get('/api/auth/me')).status).toBe(401);
    expect((await request(ctx.app).get('/api/admin/users')).status).toBe(401);
  });

  it('mutating requests need a matching Origin', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    const res = await s.agent.post('/api/admin/users').set('Origin', 'https://evil.example').send({});
    expect(res.status).toBe(403);
    const none = await s.agent.post('/api/admin/users').send({});
    expect(none.status).toBe(403);
  });

  it('logout ends the session', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    expect((await s.get('/api/auth/me')).status).toBe(200);
    await s.post('/api/auth/logout');
    expect((await s.get('/api/auth/me')).status).toBe(401);
  });

  it('a disabled admin loses their session on the next request', async () => {
    const id = await createAdmin(ctx.db, 'staff@faction.my');
    const staff = await signIn(ctx.app, 'staff@faction.my');
    expect((await staff.get('/api/auth/me')).status).toBe(200);
    await ctx.db.updateTable('users').set({ disabled_at: new Date().toISOString() }).where('id', '=', id).execute();
    expect((await staff.get('/api/auth/me')).status).toBe(401);
  });

  it('an expired session is rejected', async () => {
    const s = await signIn(ctx.app, 'owner@faction.my');
    await ctx.db.updateTable('sessions').set({ expires_at: '2000-01-01T00:00:00.000Z' }).execute();
    expect((await s.get('/api/auth/me')).status).toBe(401);
  });
});

describe('secure cookie', () => {
  it('is Secure when the public URL is https, even outside production', async () => {
    const https = await setupTestApp({ publicBaseUrl: 'https://faction.my', secureCookies: true });
    await createAdmin(https.db, 'owner@faction.my');
    const res = await request(https.app).post('/api/auth/login').set('Origin', 'https://faction.my').send({ email: 'owner@faction.my', password: PASSWORD });
    expect(res.headers['set-cookie']![0]).toMatch(/;\s*Secure/i);
    await https.close();
  });
  it('is not Secure on a plain http URL so sign-in still works', async () => {
    const res = await login({ email: 'owner@faction.my', password: PASSWORD });
    expect(res.headers['set-cookie']![0]).not.toMatch(/;\s*Secure/i);
  });
  it('is derived from PUBLIC_BASE_URL', async () => {
    const { loadConfig } = await import('../src/config.js');
    expect(loadConfig({ DB_CLIENT: 'pg', DATABASE_URL: 'x', PUBLIC_BASE_URL: 'https://faction.my', NODE_ENV: 'production' }).secureCookies).toBe(true);
    expect(loadConfig({ DB_CLIENT: 'pg', DATABASE_URL: 'x', PUBLIC_BASE_URL: 'http://10.0.0.5:3000', NODE_ENV: 'production' }).secureCookies).toBe(false);
  });
});

describe('bootstrapAdmin', () => {
  it('creates the first admin only when there are none', async () => {
    await ctx.reset();
    const env = { email: 'First@Faction.my', password: 'first-admin-pass', name: 'First' };
    expect(await bootstrapAdmin(ctx.db, env)).toBe(true);
    expect(await bootstrapAdmin(ctx.db, { ...env, email: 'second@faction.my' })).toBe(false);
    const users = await ctx.db.selectFrom('users').select('email').execute();
    expect(users).toEqual([{ email: 'first@faction.my' }]);
  });
  it('does nothing without email and password', async () => {
    await ctx.reset();
    expect(await bootstrapAdmin(ctx.db, { name: 'x' })).toBe(false);
  });
});
