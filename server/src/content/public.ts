import { createHash } from 'node:crypto';
import type { Kysely } from 'kysely';
import { collectMediaIds, isSectionKey, type MediaView, type PublicContent } from '@faction/shared';
import type { DB } from '../db/types.js';
import { mediaView } from '../media/process.js';

/** Everything the public site needs in one payload. */
export async function loadPublicContent(db: Kysely<DB>): Promise<PublicContent> {
  const rows = await db.selectFrom('content_sections').select(['key', 'data']).execute();
  const sections: Record<string, unknown> = {};
  for (const r of rows) if (isSectionKey(r.key)) sections[r.key] = JSON.parse(r.data);
  const ids = collectMediaIds(sections);
  const media: Record<string, MediaView> = {};
  if (ids.length) {
    const found = await db.selectFrom('media').select(['id', 'filename', 'mime', 'width', 'height', 'alt']).where('id', 'in', ids).execute();
    for (const m of found) media[m.id] = mediaView({ ...m, width: Number(m.width), height: Number(m.height) });
  }
  const body = { sections, media } as Omit<PublicContent, 'version'>;
  const version = createHash('sha1').update(JSON.stringify(body)).digest('base64url').slice(0, 20);
  return { ...(body as PublicContent), version };
}
