import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { loadConfig, type Config } from '../src/config.js';
import { createDb } from '../src/db/index.js';
import { migrateToLatest } from '../src/db/migrations.js';
import type { DB } from '../src/db/types.js';
import { createApp } from '../src/app.js';

export const TABLES = ['audit_log', 'sessions', 'content_sections', 'media', 'users'] as const;
export const ORIGIN = 'http://localhost:3000';

export async function setupTestApp(overrides: Partial<Config> = {}) {
  const client = process.env.TEST_DB_CLIENT;
  const url = process.env.TEST_DATABASE_URL;
  if (!client || !url) throw new Error('Set TEST_DB_CLIENT and TEST_DATABASE_URL (use npm run test:pg / test:mysql)');
  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faction-uploads-'));
  const cfg: Config = {
    ...loadConfig({ DB_CLIENT: client, DATABASE_URL: url, UPLOAD_DIR: uploadDir, PUBLIC_BASE_URL: ORIGIN }),
    ...overrides,
  };
  const db = createDb(cfg);
  await migrateToLatest(db);
  const app = createApp({ db, cfg });
  const reset = async () => {
    for (const t of TABLES) await sql`DELETE FROM ${sql.table(t)}`.execute(db);
  };
  await reset();
  return { app, db, cfg, reset, close: () => db.destroy() };
}

export type TestCtx = Awaited<ReturnType<typeof setupTestApp>>;
export type TestDb = Kysely<DB>;

import request from 'supertest';
import { hashPassword } from '../src/auth/passwords.js';
import { newId as _newId, nowIso as _nowIso } from '../src/db/ids.js';

export const PASSWORD = 'correct-horse-battery';

export async function createAdmin(db: TestDb, email: string, opts: { name?: string; password?: string; disabled?: boolean } = {}) {
  const id = _newId();
  await db.insertInto('users').values({
    id, email, name: opts.name ?? email.split('@')[0]!, password_hash: await hashPassword(opts.password ?? PASSWORD),
    created_at: _nowIso(), last_login_at: null, disabled_at: opts.disabled ? _nowIso() : null,
  }).execute();
  return id;
}

/** Supertest agent signed in as `email`, sending a same-origin Origin header on every request. */
export async function signIn(app: TestCtx['app'], email: string, password = PASSWORD) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').set('Origin', ORIGIN).send({ email, password });
  if (res.status !== 200) throw new Error(`login failed ${res.status} ${JSON.stringify(res.body)}`);
  return {
    agent,
    get: (url: string) => agent.get(url),
    post: (url: string) => agent.post(url).set('Origin', ORIGIN),
    put: (url: string) => agent.put(url).set('Origin', ORIGIN),
    patch: (url: string) => agent.patch(url).set('Origin', ORIGIN),
    del: (url: string) => agent.delete(url).set('Origin', ORIGIN),
  };
}

export async function auditRows(db: TestDb) {
  return db.selectFrom('audit_log').selectAll().orderBy('id', 'desc').execute();
}
