import { Router } from 'express';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import { isSectionKey } from '@faction/shared';
import type { AuditLogTable, DB } from '../db/types.js';
import { HttpError, clientIp, parseBody } from '../http.js';
import { saveSection } from '../content/repo.js';

const iso = z.string().datetime({ offset: true });
const query = z.object({
  userId: z.string().max(26).optional(),
  targetKey: z.string().max(64).optional(),
  action: z.string().max(64).optional(),
  from: iso.optional(),
  to: iso.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const parse = (s: string | null) => (s === null ? null : (JSON.parse(s) as unknown));
const view = (r: AuditLogTable) => ({
  id: r.id, at: r.at, userId: r.user_id, userEmail: r.user_email, action: r.action,
  targetType: r.target_type, targetKey: r.target_key, before: parse(r.before), after: parse(r.after), ip: r.ip,
});

export function auditRoutes(db: Kysely<DB>): Router {
  const r = Router();

  r.get('/', async (req, res) => {
    const q = parseBody(query, req.query);
    let base = db.selectFrom('audit_log');
    if (q.userId) base = base.where('user_id', '=', q.userId);
    if (q.targetKey) base = base.where('target_key', '=', q.targetKey);
    if (q.action) base = base.where('action', '=', q.action);
    if (q.from) base = base.where('at', '>=', new Date(q.from).toISOString());
    if (q.to) base = base.where('at', '<=', new Date(q.to).toISOString());
    const [items, count] = await Promise.all([
      base.selectAll().orderBy('id', 'desc').limit(q.pageSize).offset((q.page - 1) * q.pageSize).execute(),
      base.select((eb) => eb.fn.countAll().as('n')).executeTakeFirstOrThrow(),
    ]);
    res.json({ items: items.map(view), total: Number(count.n) });
  });

  r.post('/:id/restore', async (req, res) => {
    const { which } = parseBody(z.object({ which: z.enum(['before', 'after']) }), req.body);
    const entry = await db.selectFrom('audit_log').selectAll().where('id', '=', req.params.id).executeTakeFirst();
    if (!entry) throw new HttpError(404, 'Audit entry not found.');
    const snapshot = entry[which];
    if (entry.target_type !== 'section' || !isSectionKey(entry.target_key) || snapshot === null) {
      throw new HttpError(400, 'Only content changes can be restored.');
    }
    const result = await saveSection(db, {
      key: entry.target_key, data: JSON.parse(snapshot), expectedVersion: null, action: 'section.restore',
      user: req.admin!, ip: clientIp(req), undeleteMedia: true,
    });
    res.json(result);
  });

  return r;
}
