import { Router } from 'express';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { DB, UsersTable } from '../db/types.js';
import { newId, nowIso } from '../db/ids.js';
import { HttpError, clientIp, parseBody } from '../http.js';
import { writeAudit } from '../audit/write.js';
import { hashPassword, passwordSchema } from '../auth/passwords.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);
const name = z.string().trim().min(1, 'Name is required').max(120);

const view = (u: UsersTable) => ({ id: u.id, email: u.email, name: u.name, createdAt: u.created_at, lastLoginAt: u.last_login_at, disabledAt: u.disabled_at });
const snapshot = (u: Pick<UsersTable, 'email' | 'name' | 'disabled_at'>) => ({ email: u.email, name: u.name, disabled: !!u.disabled_at });

export function userRoutes(db: Kysely<DB>): Router {
  const r = Router();

  const load = async (id: string) => {
    const u = await db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
    if (!u) throw new HttpError(404, 'Admin not found.');
    return u;
  };
  const activeCount = async () =>
    Number((await db.selectFrom('users').select((eb) => eb.fn.countAll().as('n')).where('disabled_at', 'is', null).executeTakeFirstOrThrow()).n);
  const emailTaken = async (e: string, exceptId?: string) => {
    let q = db.selectFrom('users').select('id').where('email', '=', e);
    if (exceptId) q = q.where('id', '!=', exceptId);
    return !!(await q.executeTakeFirst());
  };

  r.get('/', async (_req, res) => {
    const users = await db.selectFrom('users').selectAll().orderBy('created_at').execute();
    res.json(users.map(view));
  });

  r.post('/', async (req, res) => {
    const body = parseBody(z.object({ email, name, password: passwordSchema }), req.body);
    if (await emailTaken(body.email)) throw new HttpError(409, 'An admin with that email already exists.');
    const row: UsersTable = { id: newId(), email: body.email, name: body.name, password_hash: await hashPassword(body.password), created_at: nowIso(), last_login_at: null, disabled_at: null };
    await db.transaction().execute(async (trx) => {
      await trx.insertInto('users').values(row).execute();
      await writeAudit(trx, { user: req.admin!, action: 'user.create', targetType: 'user', targetKey: row.id, after: snapshot(row), ip: clientIp(req) });
    });
    res.status(201).json(view(row));
  });

  r.patch('/:id', async (req, res) => {
    const body = parseBody(z.object({ email: email.optional(), name: name.optional(), disabled: z.boolean().optional() }), req.body);
    const u = await load(req.params.id);
    const me = req.admin!;
    if (body.disabled === true && u.id === me.id) throw new HttpError(400, "You can't disable your own account.");
    if (body.disabled === true && !u.disabled_at && (await activeCount()) <= 1) throw new HttpError(400, 'There must be at least one active admin.');
    if (body.email && (await emailTaken(body.email, u.id))) throw new HttpError(409, 'An admin with that email already exists.');
    const next = {
      email: body.email ?? u.email,
      name: body.name ?? u.name,
      disabled_at: body.disabled === undefined ? u.disabled_at : body.disabled ? (u.disabled_at ?? nowIso()) : null,
    };
    const action = body.disabled !== undefined && !!u.disabled_at !== body.disabled ? (body.disabled ? 'user.disable' : 'user.enable') : 'user.update';
    await db.transaction().execute(async (trx) => {
      await trx.updateTable('users').set(next).where('id', '=', u.id).execute();
      if (next.disabled_at) await trx.deleteFrom('sessions').where('user_id', '=', u.id).execute();
      await writeAudit(trx, { user: me, action, targetType: 'user', targetKey: u.id, before: snapshot(u), after: snapshot(next), ip: clientIp(req) });
    });
    res.json(view({ ...u, ...next }));
  });

  r.delete('/:id', async (req, res) => {
    const u = await load(req.params.id);
    const me = req.admin!;
    if (u.id === me.id) throw new HttpError(400, "You can't delete your own account.");
    if (!u.disabled_at && (await activeCount()) <= 1) throw new HttpError(400, 'There must be at least one active admin.');
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom('sessions').where('user_id', '=', u.id).execute();
      await trx.deleteFrom('users').where('id', '=', u.id).execute();
      await writeAudit(trx, { user: me, action: 'user.delete', targetType: 'user', targetKey: u.id, before: snapshot(u), ip: clientIp(req) });
    });
    res.status(204).end();
  });

  r.post('/:id/password', async (req, res) => {
    const body = parseBody(z.object({ password: passwordSchema }), req.body);
    const u = await load(req.params.id);
    const password_hash = await hashPassword(body.password);
    await db.transaction().execute(async (trx) => {
      await trx.updateTable('users').set({ password_hash }).where('id', '=', u.id).execute();
      if (u.id !== req.admin!.id) await trx.deleteFrom('sessions').where('user_id', '=', u.id).execute();
      await writeAudit(trx, { user: req.admin!, action: 'user.password_reset', targetType: 'user', targetKey: u.id, ip: clientIp(req) });
    });
    res.status(204).end();
  });

  return r;
}
