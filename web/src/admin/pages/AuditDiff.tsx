import { useState } from 'react';

const label = (k: string) => (/^\d+$/.test(k) ? String(Number(k) + 1) : k.replace(/Ids?$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()));
/** "items.0.value" → "Items 1 › Value": list positions attach to their list name. */
const pathLabel = (path: string[]) => path.reduce<string[]>((acc, k) => {
  if (/^\d+$/.test(k) && acc.length) { acc[acc.length - 1] += ` ${Number(k) + 1}`; return acc; }
  return [...acc, label(k)];
}, []).join(' › ');
const show = (v: unknown) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v === null || v === undefined ? '' : String(v));

/** [["Items › 1 › Value", "1,800+"], ...] */
export function flatten(v: unknown, path: string[] = []): [string, string][] {
  if (Array.isArray(v)) return v.length ? v.flatMap((x, i) => flatten(x, [...path, String(i)])) : path.length ? [[pathLabel(path), '(empty)']] : [];
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => flatten(x, [...path, k]));
  return path.length ? [[pathLabel(path), show(v)]] : v === null || v === undefined ? [] : [['Value', show(v)]];
}

export function AuditDiff({ before, after }: { before: unknown; after: unknown }) {
  const [all, setAll] = useState(false);
  const b = new Map(flatten(before));
  const a = new Map(flatten(after));
  const keys = [...new Set([...b.keys(), ...a.keys()])];
  const rows = keys.map((k) => ({ k, before: b.get(k), after: a.get(k), changed: b.get(k) !== a.get(k) }));
  const visible = all ? rows : rows.filter((r) => r.changed);
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 self-end text-xs text-muted">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="accent-[var(--accent)]" />
        Show unchanged fields
      </label>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-fg/5 text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-3 py-2 font-semibold">Field</th><th className="px-3 py-2 font-semibold">Before</th><th className="px-3 py-2 font-semibold">After</th></tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.k} data-changed={r.changed ? 'true' : 'false'} className={`border-t border-line align-top ${r.changed ? '' : 'text-muted'}`}>
                <td className="w-1/4 px-3 py-2 font-medium">{r.k}</td>
                <td className={`px-3 py-2 whitespace-pre-wrap break-words ${r.changed ? 'bg-red-500/10 text-red-700 dark:text-red-300' : ''}`}>{r.before ?? <em className="text-muted">none</em>}</td>
                <td className={`px-3 py-2 whitespace-pre-wrap break-words ${r.changed ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : ''}`}>{r.after ?? <em className="text-muted">none</em>}</td>
              </tr>
            ))}
            {!visible.length && <tr><td colSpan={3} className="px-3 py-4 text-center text-muted">No field changes recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
