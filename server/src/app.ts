import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import { sql, type Kysely } from 'kysely';
import type { Config } from './config.js';
import type { DB } from './db/types.js';
import { errorHandler } from './http.js';
import { originCheck, requireAdmin } from './auth/middleware.js';
import { authRoutes, mePasswordRoute } from './auth/routes.js';
import { userRoutes } from './users/routes.js';
import { mediaRoutes, uploadsStatic } from './media/routes.js';
import { publicContentRoute, sectionRoutes } from './content/routes.js';
import { auditRoutes } from './audit/routes.js';
import { seoRoutes, spaRoutes } from './web/serve.js';

export interface AppDeps {
  db: Kysely<DB>;
  cfg: Config;
}

export function createApp({ db, cfg }: AppDeps): Express {
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

  app.use('/uploads', uploadsStatic(cfg));

  const api = express.Router();
  api.use(express.json({ limit: '2mb' }), cookieParser(), originCheck(cfg));
  api.use('/auth', authRoutes(db, cfg));
  api.use('/content', publicContentRoute(db));

  const admin = express.Router();
  admin.use(requireAdmin(db, cfg));
  admin.use('/users', userRoutes(db));
  admin.use('/me', mePasswordRoute(db));
  admin.use('/media', mediaRoutes(db, cfg));
  admin.use('/sections', sectionRoutes(db));
  admin.use('/audit', auditRoutes(db));
  api.use('/admin', admin);

  api.use((_req, res) => { res.status(404).json({ error: 'Not found.' }); });
  app.use('/api', api);
  app.use(seoRoutes(cfg));
  app.use(spaRoutes(db, cfg));
  app.use(errorHandler);
  return app;
}
