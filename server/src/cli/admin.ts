// Usage: npm run admin:create -w server -- --email you@shop.my --name "You" [--reset]
// Password comes from ADMIN_PASSWORD or an interactive prompt.
import { parseArgs } from 'node:util';
import readline from 'node:readline/promises';
import { loadConfig } from '../config.js';
import { createDb } from '../db/index.js';
import { migrateToLatest } from '../db/migrations.js';
import { newId, nowIso } from '../db/ids.js';
import { hashPassword, passwordSchema } from '../auth/passwords.js';

const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' }, reset: { type: 'boolean', default: false } } });
const email = values.email?.trim().toLowerCase();
if (!email) {
  console.error('Usage: admin:create -- --email you@shop.my --name "Your Name" [--reset]');
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD;
if (!password) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question('Password (min 10 chars): ');
  rl.close();
}
const ok = passwordSchema.safeParse(password);
if (!ok.success) {
  console.error(ok.error.issues[0]!.message);
  process.exit(1);
}

const db = createDb(loadConfig());
await migrateToLatest(db);
const existing = await db.selectFrom('users').select('id').where('email', '=', email).executeTakeFirst();
const password_hash = await hashPassword(password);
if (existing && values.reset) {
  await db.updateTable('users').set({ password_hash, disabled_at: null }).where('id', '=', existing.id).execute();
  await db.deleteFrom('sessions').where('user_id', '=', existing.id).execute();
  console.log(`Password reset for ${email}.`);
} else if (existing) {
  console.error(`${email} already exists. Use --reset to set a new password.`);
  process.exitCode = 1;
} else {
  await db.insertInto('users').values({ id: newId(), email, name: values.name?.trim() || email, password_hash, created_at: nowIso(), last_login_at: null, disabled_at: null }).execute();
  console.log(`Admin ${email} created.`);
}
await db.destroy();
