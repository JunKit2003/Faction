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
