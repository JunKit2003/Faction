import { Router } from 'express';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import { isSectionKey } from '@faction/shared';
import type { DB } from '../db/types.js';
import { HttpError, clientIp, parseBody } from '../http.js';
import { getSection, saveSection } from './repo.js';
import { loadPublicContent } from './public.js';

export function publicContentRoute(db: Kysely<DB>): Router {
  const r = Router();
  r.get('/', async (req, res) => {
    const content = await loadPublicContent(db);
    const etag = `"${content.version}"`;
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', etag);
    if (req.get('if-none-match') === etag) {
      res.status(304).end();
      return;
    }
    res.json(content);
  });
  return r;
}

const keyOf = (k: string) => {
  if (!isSectionKey(k)) throw new HttpError(404, 'Section not found.');
  return k;
};

export function sectionRoutes(db: Kysely<DB>): Router {
  const r = Router();
  r.get('/:key', async (req, res) => {
    res.json(await getSection(db, keyOf(req.params.key)));
  });
  r.put('/:key', async (req, res) => {
    const key = keyOf(req.params.key);
    const body = parseBody(z.object({ data: z.unknown(), version: z.number().int() }), req.body);
    res.json(await saveSection(db, { key, data: body.data, expectedVersion: body.version, action: 'section.update', user: req.admin!, ip: clientIp(req) }));
  });
  return r;
}
