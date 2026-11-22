import type { Kysely } from 'kysely';
import { collectMediaIds, isSectionKey, type SectionKey } from '@faction/shared';
import type { DB } from '../db/types.js';

/** mediaId → section keys that currently reference it. */
export async function mediaUsage(db: Kysely<DB>): Promise<Map<string, SectionKey[]>> {
  const rows = await db.selectFrom('content_sections').select(['key', 'data']).execute();
  const usage = new Map<string, SectionKey[]>();
  for (const r of rows) {
    if (!isSectionKey(r.key)) continue;
    let data: unknown;
    try { data = JSON.parse(r.data); } catch { continue; }
    for (const id of collectMediaIds(data)) usage.set(id, [...(usage.get(id) ?? []), r.key]);
  }
  return usage;
}
