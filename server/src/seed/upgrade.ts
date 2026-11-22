import type { Kysely } from 'kysely';
import { SECTION_KEYS, type SectionKey } from '@faction/shared';
import type { DB } from '../db/types.js';
import { nowIso } from '../db/ids.js';
import { seedSections } from './content.js';

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);

/** Adds keys present in `defaults` but missing from `current` (objects only, recursively). Arrays and set values are never touched. */
export function fillMissing(current: unknown, defaults: unknown): { value: unknown; changed: boolean } {
  if (!isObj(current) || !isObj(defaults)) return { value: current, changed: false };
  let changed = false;
  const out: Json = { ...current };
  for (const [k, d] of Object.entries(defaults)) {
    if (!(k in out)) { out[k] = structuredClone(d); changed = true; continue; }
    const r = fillMissing(out[k], d);
    if (r.changed) { out[k] = r.value; changed = true; }
  }
  return { value: out, changed };
}

/**
 * Brings content saved by an older release up to today's shape: inserts missing sections and fills
 * missing fields with the shipped defaults. Never overwrites a value an admin has set.
 * New image fields default to empty (no image). Returns the section keys it changed.
 */
/** Defaults are built with blank image ids; image lists in them must start empty, not as ['', ''] . */
function withoutBlankIds(v: unknown, key = ''): unknown {
  if (Array.isArray(v)) return /Ids$/.test(key) ? v.filter((x) => x !== '') : v.map((x) => withoutBlankIds(x));
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withoutBlankIds(x, k)]));
  return v;
}

export async function upgradeContent(db: Kysely<DB>): Promise<SectionKey[]> {
  const rows = await db.selectFrom('content_sections').select(['key', 'data', 'version']).execute();
  if (!rows.length) return [];
  const defaults = withoutBlankIds(seedSections(() => '')) as ReturnType<typeof seedSections>;
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const changed: SectionKey[] = [];
  const t = nowIso();
  await db.transaction().execute(async (trx) => {
    for (const key of SECTION_KEYS) {
      const row = byKey.get(key);
      if (!row) {
        await trx.insertInto('content_sections').values({ key, data: JSON.stringify(defaults[key]), version: 1, updated_at: t, updated_by: null }).execute();
        changed.push(key);
        continue;
      }
      const r = fillMissing(JSON.parse(row.data), defaults[key]);
      if (!r.changed) continue;
      await trx.updateTable('content_sections').set({ data: JSON.stringify(r.value), version: Number(row.version) + 1, updated_at: t })
        .where('key', '=', key).where('version', '=', row.version).execute();
      changed.push(key);
    }
  });
  return changed;
}
