import { useId, type ReactNode } from 'react';

export const inputCls = 'w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[15px] text-fg outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/15';

export function FieldShell({ label, hint, error, children, id }: { label: string; hint?: string; error?: string; children: (id: string, describedBy?: string) => ReactNode; id?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = [hint ? `${fid}-hint` : '', error ? `${fid}-err` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fid} className="text-sm font-semibold text-fg">{label}</label>
      {children(fid, describedBy)}
      {hint && <p id={`${fid}-hint`} className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${fid}-err`} role="alert" className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
