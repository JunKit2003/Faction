import type { Kysely, Transaction } from 'kysely';
import { sectionSchemas, type SectionKey } from '@faction/shared';
import type { DB } from '../db/types.js';
import { nowIso } from '../db/ids.js';
import { HttpError, toIssues } from '../http.js';
import { writeAudit, type AuditInput } from '../audit/write.js';

export const CONFLICT_COPY = 'Someone else changed this, reload to see their version.';

/** [path, id] for every media reference (keys ending Id/Ids or mediaId). */
export function mediaRefs(data: unknown, path: string[] = [], key: string | null = null): [string, string][] {
  const isId = key !== null && /(Id|Ids)$/.test(key);
  if (typeof data === 'string') return isId && data ? [[path.join('.'), data]] : [];
  if (Array.isArray(data)) return data.flatMap((v, i) => mediaRefs(v, [...path, String(i)], isId ? key : null));
  if (data && typeof data === 'object') return Object.entries(data).flatMap(([k, v]) => mediaRefs(v, [...path, k], k));
  return [];
}

export async function getSection(db: Kysely<DB> | Transaction<DB>, key: SectionKey) {
  const row = await db.selectFrom('content_sections').selectAll().where('key', '=', key).executeTakeFirst();
  if (!row) throw new HttpError(404, 'Section not found.');
  return { key, data: JSON.parse(row.data) as unknown, version: Number(row.version) };
}

interface SaveOpts {
  key: SectionKey;
  data: unknown;
  /** Version the editor loaded; null = use whatever is current (restore). */
  expectedVersion: number | null;
  action: 'section.update' | 'section.restore';
  user: AuditInput['user'];
  ip: string;
  undeleteMedia?: boolean;
}

/** Validates, checks images, writes with optimistic concurrency and audits — all in one transaction. */
export async function saveSection(db: Kysely<DB>, o: SaveOpts): Promise<{ version: number }> {
  const parsed = sectionSchemas[o.key].safeParse(o.data);
  if (!parsed.success) throw new HttpError(422, 'Please fix the highlighted fields.', { issues: toIssues(parsed.error) });
  const data = parsed.data;
  const refs = mediaRefs(data);

  return db.transaction().execute(async (trx) => {
    const current = await getSection(trx, o.key);
    const expected = o.expectedVersion ?? current.version;
    if (expected !== current.version) throw new HttpError(409, CONFLICT_COPY);

    if (refs.length) {
      const ids = [...new Set(refs.map(([, id]) => id))];
      if (o.undeleteMedia) await trx.updateTable('media').set({ deleted_at: null }).where('id', 'in', ids).where('deleted_at', 'is not', null).execute();
      const found = new Set((await trx.selectFrom('media').select('id').where('id', 'in', ids).where('deleted_at', 'is', null).execute()).map((r) => r.id));
      const missing = refs.filter(([, id]) => !found.has(id));
      if (missing.length) {
        throw new HttpError(422, 'Please fix the highlighted fields.', {
          issues: missing.map(([path]) => ({ path, message: 'That image no longer exists. Choose another.' })),
        });
      }
    }

    const version = current.version + 1;
    const res = await trx.updateTable('content_sections')
      .set({ data: JSON.stringify(data), version, updated_at: nowIso(), updated_by: o.user.id })
      .where('key', '=', o.key).where('version', '=', expected).executeTakeFirst();
    if (Number(res.numUpdatedRows) !== 1) throw new HttpError(409, CONFLICT_COPY);
    await writeAudit(trx, { user: o.user, action: o.action, targetType: 'section', targetKey: o.key, before: current.data, after: data, ip: o.ip });
    return { version };
  });
}
