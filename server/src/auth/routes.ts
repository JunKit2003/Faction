import { Router } from 'express';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { Config } from '../config.js';
import type { DB } from '../db/types.js';
import { nowIso } from '../db/ids.js';
import { HttpError, clientIp, parseBody } from '../http.js';
import { writeAudit } from '../audit/write.js';
import { burnVerify, hashPassword, passwordSchema, verifyPassword } from './passwords.js';
import { clearFailures, isLimited, recordFailure } from './ratelimit.js';
import { createSession, deleteSessionByToken, SESSION_COOKIE } from './sessions.js';
import { requireAdmin, setSessionCookie } from './middleware.js';

const loginSchema = z.object({ email: z.string().trim().toLowerCase().max(254), password: z.string().max(200) });

export function authRoutes(db: Kysely<DB>, cfg: Config): Router {
  const r = Router();

  r.post('/login', async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body);
    const ip = clientIp(req);
    const key = `${ip}|${email}`;
    if (isLimited(key)) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
    const user = await db.selectFrom('users').selectAll().where('email', '=', email).executeTakeFirst();
    const ok = user && !user.disabled_at ? await verifyPassword(user.password_hash, password) : (await burnVerify(password), false);
    if (!ok || !user) {
      recordFailure(key);
      await writeAudit(db, { user: { id: user?.id ?? null, email }, action: 'auth.login_failed', targetType: 'user', targetKey: user?.id ?? '', ip });
      throw new HttpError(401, 'Email or password is incorrect.');
    }
    clearFailures(key);
    const token = await createSession(db, user.id, ip, req.get('user-agent') ?? '');
    await db.updateTable('users').set({ last_login_at: nowIso() }).where('id', '=', user.id).execute();
    await writeAudit(db, { user: { id: user.id, email: user.email }, action: 'auth.login', targetType: 'user', targetKey: user.id, ip });
    setSessionCookie(res, token, cfg);
    res.json({ id: user.id, email: user.email, name: user.name });
  });

  r.post('/logout', requireAdmin(db, cfg), async (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE] as string;
    await deleteSessionByToken(db, token);
    await writeAudit(db, { user: { id: req.admin!.id, email: req.admin!.email }, action: 'auth.logout', targetType: 'user', targetKey: req.admin!.id, ip: clientIp(req) });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(204).end();
  });

  r.get('/me', requireAdmin(db, cfg), (req, res) => {
    const { id, email, name } = req.admin!;
    res.json({ id, email, name });
  });

  return r;
}

export function mePasswordRoute(db: Kysely<DB>): Router {
  const r = Router();
  const schema = z.object({ currentPassword: z.string().max(200), newPassword: passwordSchema });
  r.put('/password', async (req, res) => {
    const body = parseBody(schema, req.body);
    const me = req.admin!;
    const user = await db.selectFrom('users').select('password_hash').where('id', '=', me.id).executeTakeFirstOrThrow();
    if (!(await verifyPassword(user.password_hash, body.currentPassword))) throw new HttpError(400, 'Current password is incorrect.');
    const password_hash = await hashPassword(body.newPassword);
    await db.transaction().execute(async (trx) => {
      await trx.updateTable('users').set({ password_hash }).where('id', '=', me.id).execute();
      await trx.deleteFrom('sessions').where('user_id', '=', me.id).where('id', '!=', me.sessionId).execute();
      await writeAudit(trx, { user: me, action: 'me.password_change', targetType: 'user', targetKey: me.id, ip: clientIp(req) });
    });
    res.status(204).end();
  });
  return r;
}
