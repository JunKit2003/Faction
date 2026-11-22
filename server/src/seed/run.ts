import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type { Kysely } from 'kysely';
import { SECTION_KEYS } from '@faction/shared';
import type { Config } from '../config.js';
import type { DB, MediaTable } from '../db/types.js';
import { newId, nowIso } from '../db/ids.js';
import { processImage } from '../media/process.js';
import { SEED_IMAGES, seedSections, type SeedImage } from './content.js';

/** server/seed/assets, whether running from src/ (tsx) or the bundled dist/. */
export function seedAssetsDir(): string {
  const candidates = [
    process.env.SEED_ASSETS_DIR,
    path.resolve(import.meta.dirname, '../../seed/assets'),
    path.resolve(import.meta.dirname, '../seed/assets'),
  ].filter(Boolean) as string[];
  const found = candidates.find((d) => fs.existsSync(path.join(d, 'hero1.jpeg')));
  if (!found) throw new Error(`Seed assets not found (looked in ${candidates.join(', ')})`);
  return found;
}

/** Fills an empty database with the original site's content and images. Returns false if content already exists. */
export async function seedIfEmpty(db: Kysely<DB>, cfg: Pick<Config, 'uploadDir'>): Promise<boolean> {
  const existing = await db.selectFrom('content_sections').select('key').limit(1).executeTakeFirst();
  if (existing) return false;

  const dir = seedAssetsDir();
  const ids = {} as Record<SeedImage, string>;
  const rows: MediaTable[] = [];
  for (const [key, img] of Object.entries(SEED_IMAGES) as [SeedImage, (typeof SEED_IMAGES)[SeedImage]][]) {
    const id = newId();
    const processed = await processImage(await fsp.readFile(path.join(dir, img.file)), id, { allowSvg: false, uploadDir: cfg.uploadDir });
    ids[key] = id;
    rows.push({ id, ...processed, original_name: img.file, alt: img.alt, created_at: nowIso(), created_by: null, deleted_at: null });
  }
  const sections = seedSections((k) => ids[k]);
  const t = nowIso();
  await db.transaction().execute(async (trx) => {
    await trx.insertInto('media').values(rows).execute();
    for (const key of SECTION_KEYS) {
      await trx.insertInto('content_sections').values({ key, data: JSON.stringify(sections[key]), version: 1, updated_at: t, updated_by: null }).execute();
    }
  });
  return true;
}
