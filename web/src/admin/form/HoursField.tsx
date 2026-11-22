import { DAYS, DAY_LABELS, formatHours, type Hours } from '@faction/shared';
import type { Issues } from './fields';
import { inputCls } from './inputs';

export function HoursField({ label, value, onChange, issues, path }: { label: string; value: Hours; onChange: (v: Hours) => void; issues: Issues; path: string }) {
  const setDay = (d: (typeof DAYS)[number], patch: Partial<Hours['mon']>) => {
    const cur = value[d];
    const next = { ...cur, ...patch };
    if (patch.closed === false && !next.open) Object.assign(next, { open: '11:00', close: '19:30' });
    if (patch.closed === true) Object.assign(next, { open: '', close: '' });
    onChange({ ...value, [d]: next });
  };
  let preview: string[] = [];
  try { preview = formatHours(value); } catch { /* incomplete */ }
  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-fg">{label}</legend>
      <div className="flex flex-col divide-y divide-line">
        {DAYS.map((d) => {
          const h = value[d];
          const err = issues[`${path}.${d}.open`] ?? issues[`${path}.${d}.close`];
          return (
            <div key={d} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
              <span className="w-10 text-sm font-semibold text-fg">{DAY_LABELS[d]}</span>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={!h.closed} onChange={(e) => setDay(d, { closed: !e.target.checked })} className="h-4 w-4 accent-[var(--accent)]" />
                Open
              </label>
              {!h.closed && (
                <div className="flex items-center gap-2">
                  <input type="time" aria-label={`${DAY_LABELS[d]} opens`} value={h.open} onChange={(e) => setDay(d, { open: e.target.value })}
                    aria-invalid={issues[`${path}.${d}.open`] ? 'true' : 'false'} className={`${inputCls} w-32 py-2`} />
                  <span className="text-muted">–</span>
                  <input type="time" aria-label={`${DAY_LABELS[d]} closes`} value={h.close} onChange={(e) => setDay(d, { close: e.target.value })}
                    aria-invalid={issues[`${path}.${d}.close`] ? 'true' : 'false'} className={`${inputCls} w-32 py-2`} />
                </div>
              )}
              {err && <p role="alert" className="w-full text-sm font-medium text-red-500">{err}</p>}
            </div>
          );
        })}
      </div>
      {preview.length > 0 && <p className="text-xs text-muted">Shown on the site as: <span className="font-medium text-fg">{preview.join(', ')}</span></p>}
    </fieldset>
  );
}
