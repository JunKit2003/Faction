import { createHash, randomBytes } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { DB } from '../db/types.js';
import { nowIso } from '../db/ids.js';

export const SESSION_COOKIE = 'fsid';
export const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const SLIDE_AFTER_MS = 24 * 60 * 60 * 1000; // re-extend at most once a day

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export interface SessionAdmin { id: string; email: string; name: string; sessionId: string; refreshed: boolean }

export async function createSession(db: Kysely<DB>, userId: string, ip: string, userAgent: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await db.insertInto('sessions').values({
    id: hashToken(token), user_id: userId, expires_at: nowIso(new Date(Date.now() + SESSION_MS)), ip, user_agent: userAgent.slice(0, 512),
  }).execute();
  return token;
}

/** Valid, unexpired session of an active admin, sliding the expiry forward. */
export async function getSessionAdmin(db: Kysely<DB>, token: string | undefined): Promise<SessionAdmin | null> {
  if (!token || token.length > 100) return null;
  const id = hashToken(token);
  const row = await db.selectFrom('sessions').innerJoin('users', 'users.id', 'sessions.user_id')
    .select(['sessions.id as sid', 'sessions.expires_at', 'users.id', 'users.email', 'users.name', 'users.disabled_at'])
    .where('sessions.id', '=', id).executeTakeFirst();
  if (!row || row.disabled_at) return null;
  const now = Date.now();
  if (row.expires_at <= nowIso(new Date(now))) {
    await db.deleteFrom('sessions').where('id', '=', id).execute();
    return null;
  }
  let refreshed = false;
  if (Date.parse(row.expires_at) - now < SESSION_MS - SLIDE_AFTER_MS) {
    await db.updateTable('sessions').set({ expires_at: nowIso(new Date(now + SESSION_MS)) }).where('id', '=', id).execute();
    refreshed = true;
  }
  return { id: row.id, email: row.email, name: row.name, sessionId: id, refreshed };
}

export async function deleteSessionByToken(db: Kysely<DB>, token: string) {
  await db.deleteFrom('sessions').where('id', '=', hashToken(token)).execute();
}
