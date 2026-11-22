import express, { type Express } from 'express';
import { sql, type Kysely } from 'kysely';
import type { Config } from './config.js';
import type { DB } from './db/types.js';

export interface AppDeps {
  db: Kysely<DB>;
  cfg: Config;
}

export function createApp({ db }: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');

  app.get('/healthz', async (_req, res) => {
    try {
      await db.selectNoFrom(sql<number>`1`.as('one')).execute();
      res.json({ ok: true, db: true });
    } catch {
      res.status(503).json({ ok: false, db: false });
    }
  });

  return app;
}
