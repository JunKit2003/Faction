import type { Kysely, Transaction } from 'kysely';
import type { DB } from '../db/types.js';
import { newId, nowIso } from '../db/ids.js';

export type AuditAction =
  | 'section.update' | 'section.restore'
  | 'media.upload' | 'media.update' | 'media.delete'
  | 'user.create' | 'user.update' | 'user.disable' | 'user.enable' | 'user.delete' | 'user.password_reset'
  | 'me.password_change'
  | 'auth.login' | 'auth.login_failed' | 'auth.logout';

export interface AuditInput {
  user: { id: string | null; email: string };
  action: AuditAction;
  targetType: 'section' | 'media' | 'user';
  targetKey: string;
  before?: unknown;
  after?: unknown;
  ip: string;
}

const json = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));

/** Append-only. Call inside the same transaction as the change it records. */
export async function writeAudit(db: Kysely<DB> | Transaction<DB>, a: AuditInput): Promise<void> {
  await db.insertInto('audit_log').values({
    id: newId(), at: nowIso(), user_id: a.user.id, user_email: a.user.email.slice(0, 254), action: a.action,
    target_type: a.targetType, target_key: a.targetKey.slice(0, 64), before: json(a.before), after: json(a.after), ip: a.ip,
  }).execute();
}
