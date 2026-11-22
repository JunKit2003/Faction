// Resets a throwaway e2e database and upload folder, then boots the built server.
// E2E_DB=pg (default) or mysql. Never point this at a real database.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';
import mysql from 'mysql2/promise';

const which = process.env.E2E_DB ?? 'pg';
const NAME = 'faction_e2e';
let url;
if (which === 'pg') {
  const admin = new pg.Client({ connectionString: 'postgres://faction:faction@localhost:54321/faction' });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${NAME} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${NAME}`);
  await admin.end();
  url = `postgres://faction:faction@localhost:54321/${NAME}`;
} else {
  const admin = await mysql.createConnection('mysql://root:faction-root@localhost:33061');
  await admin.query(`DROP DATABASE IF EXISTS ${NAME}`);
  await admin.query(`CREATE DATABASE ${NAME} CHARACTER SET utf8mb4`);
  await admin.end();
  url = `mysql://root:faction-root@localhost:33061/${NAME}`;
}
const uploads = fs.mkdtempSync(path.join(os.tmpdir(), 'faction-e2e-uploads-'));
const child = spawn(process.execPath, ['server/dist/main.js'], {
  stdio: 'inherit',
  env: {
    ...process.env, DB_CLIENT: which, DATABASE_URL: url, PORT: '3100', PUBLIC_BASE_URL: 'http://localhost:3100', UPLOAD_DIR: uploads,
    ADMIN_BOOTSTRAP_EMAIL: 'owner@faction.my', ADMIN_BOOTSTRAP_PASSWORD: 'e2e-owner-password', ADMIN_BOOTSTRAP_NAME: 'Owner', NODE_ENV: 'test',
  },
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code) => process.exit(code ?? 0));
