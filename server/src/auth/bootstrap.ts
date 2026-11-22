import type { Kysely } from 'kysely';
import type { DB } from '../db/types.js';
import { newId, nowIso } from '../db/ids.js';
import { hashPassword } from './passwords.js';

/** Creates the first admin from settings, only when there are no admins at all. */
export async function bootstrapAdmin(db: Kysely<DB>, b: { email?: string; password?: string; name: string }): Promise<boolean> {
  if (!b.email || !b.password) return false;
  const any = await db.selectFrom('users').select('id').limit(1).executeTakeFirst();
  if (any) return false;
  await db.insertInto('users').values({
    id: newId(), email: b.email.trim().toLowerCase(), name: b.name, password_hash: await hashPassword(b.password),
    created_at: nowIso(), last_login_at: null, disabled_at: null,
  }).execute();
  return true;
}
