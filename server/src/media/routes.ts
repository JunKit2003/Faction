import express, { Router, type ErrorRequestHandler } from 'express';
import multer from 'multer';
import type { Kysely } from 'kysely';
import { z } from 'zod';
import type { Config } from '../config.js';
import type { DB, MediaTable } from '../db/types.js';
import { newId, nowIso } from '../db/ids.js';
import { HttpError, clientIp, parseBody } from '../http.js';
import { writeAudit } from '../audit/write.js';
import { mediaUsage } from '../content/usage.js';
import { MAX_UPLOAD_BYTES, UPLOAD_COPY, mediaView, processImage } from './process.js';

const alt = z.string().trim().max(500, 'Keep alt text under 500 characters');

export function mediaRoutes(db: Kysely<DB>, cfg: Config): Router {
  const r = Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

  const load = async (id: string) => {
    const row = await db.selectFrom('media').selectAll().where('id', '=', id).where('deleted_at', 'is', null).executeTakeFirst();
    if (!row) throw new HttpError(404, 'Image not found.');
    return row;
  };
  const libraryView = (row: MediaTable, usedIn: string[]) => ({ ...mediaView(row), originalName: row.original_name, createdAt: row.created_at, usedIn });

  r.get('/', async (_req, res) => {
    const [rows, usage] = await Promise.all([
      db.selectFrom('media').selectAll().where('deleted_at', 'is', null).orderBy('id', 'desc').execute(),
      mediaUsage(db),
    ]);
    res.json(rows.map((m) => libraryView(m, usage.get(m.id) ?? [])));
  });

  r.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) throw new HttpError(415, UPLOAD_COPY);
    const id = newId();
    const altText = parseBody(alt, req.body?.alt ?? '');
    const processed = await processImage(req.file.buffer, id, { allowSvg: req.query.purpose === 'logo', uploadDir: cfg.uploadDir });
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8').slice(0, 255);
    const row: MediaTable = { id, ...processed, original_name: originalName, alt: altText, created_at: nowIso(), created_by: req.admin!.id, deleted_at: null };
    await db.transaction().execute(async (trx) => {
      await trx.insertInto('media').values(row).execute();
      await writeAudit(trx, { user: req.admin!, action: 'media.upload', targetType: 'media', targetKey: id, after: { originalName, alt: altText }, ip: clientIp(req) });
    });
    res.status(201).json(libraryView(row, []));
  });

  r.patch('/:id', express.json(), async (req, res) => {
    const body = parseBody(z.object({ alt }), req.body);
    const row = await load(req.params.id);
    await db.transaction().execute(async (trx) => {
      await trx.updateTable('media').set({ alt: body.alt }).where('id', '=', row.id).execute();
      await writeAudit(trx, { user: req.admin!, action: 'media.update', targetType: 'media', targetKey: row.id, before: { alt: row.alt }, after: { alt: body.alt }, ip: clientIp(req) });
    });
    res.json(libraryView({ ...row, alt: body.alt }, (await mediaUsage(db)).get(row.id) ?? []));
  });

  r.delete('/:id', async (req, res) => {
    const row = await load(req.params.id);
    const usedIn = (await mediaUsage(db)).get(row.id) ?? [];
    if (usedIn.length) throw new HttpError(409, 'This image is in use. Remove it from these sections first.', { usedIn });
    await db.transaction().execute(async (trx) => {
      await trx.updateTable('media').set({ deleted_at: nowIso() }).where('id', '=', row.id).execute();
      await writeAudit(trx, { user: req.admin!, action: 'media.delete', targetType: 'media', targetKey: row.id, before: { originalName: row.original_name, alt: row.alt }, ip: clientIp(req) });
    });
    res.status(204).end();
  });

  const multerErrors: ErrorRequestHandler = (err, _req, _res, next) => {
    if (err instanceof multer.MulterError) {
      next(new HttpError(err.code === 'LIMIT_FILE_SIZE' ? 413 : 415, UPLOAD_COPY));
      return;
    }
    next(err);
  };
  r.use(multerErrors);
  return r;
}

export function uploadsStatic(cfg: Config) {
  return express.static(cfg.uploadDir, {
    immutable: true,
    maxAge: '365d',
    index: false,
    fallthrough: false,
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    },
  });
}
