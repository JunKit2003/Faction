import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { SECTION_KEYS, SECTION_LABELS, isSectionKey } from '@faction/shared';
import { api, ApiError, type AdminUser, type AuditItem } from '../api';
import { inputCls } from '../form/inputs';
import { AuditDiff } from './AuditDiff';
import { PageHeader } from '../ui';

export const ACTION_LABELS: Record<string, string> = {
  'section.update': 'Edited', 'section.restore': 'Restored',
  'media.upload': 'Uploaded image', 'media.update': 'Edited image', 'media.delete': 'Deleted image',
  'user.create': 'Added admin', 'user.update': 'Edited admin', 'user.disable': 'Disabled admin', 'user.enable': 'Enabled admin', 'user.delete': 'Deleted admin',
  'user.password_reset': 'Reset password for', 'me.password_change': 'Changed own password',
  'auth.login': 'Signed in', 'auth.login_failed': 'Failed sign-in', 'auth.logout': 'Signed out',
};

export function describeTarget(item: AuditItem, users: AdminUser[]): string {
  if (item.targetType === 'section') return isSectionKey(item.targetKey) ? SECTION_LABELS[item.targetKey] : item.targetKey;
  if (item.targetType === 'media') {
    const name = (item.after as { originalName?: string } | null)?.originalName ?? (item.before as { originalName?: string } | null)?.originalName;
    return name ?? 'image';
  }
  if (item.action.startsWith('auth.') || item.action === 'me.password_change') return '';
  return users.find((u) => u.id === item.targetKey)?.email ?? (item.before as { email?: string } | null)?.email ?? (item.after as { email?: string } | null)?.email ?? 'admin';
}

const PAGE_SIZE = 25;

export function Audit() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ userId: '', targetKey: '', action: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<AdminUser[]>('GET', '/api/admin/users') });
  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.targetKey) params.set('targetKey', filters.targetKey);
  if (filters.action) params.set('action', filters.action);
  if (filters.from) params.set('from', new Date(`${filters.from}T00:00:00`).toISOString());
  if (filters.to) params.set('to', new Date(`${filters.to}T23:59:59.999`).toISOString());
  const log = useQuery({ queryKey: ['audit', params.toString()], queryFn: () => api<{ items: AuditItem[]; total: number }>('GET', `/api/admin/audit?${params}`), placeholderData: keepPreviousData });
  const set = (k: keyof typeof filters, v: string) => { setFilters({ ...filters, [k]: v }); setPage(1); };

  const restore = async (item: AuditItem, which: 'before' | 'after') => {
    const label = isSectionKey(item.targetKey) ? SECTION_LABELS[item.targetKey] : item.targetKey;
    if (!window.confirm(`Put “${label}” back to the ${which === 'before' ? 'version before' : 'version after'} this change? It goes live immediately.`)) return;
    setMsg('');
    try {
      await api('POST', `/api/admin/audit/${item.id}/restore`, { which });
      setMsg(`Restored ${label}.`);
      void qc.invalidateQueries({ queryKey: ['audit'] });
      void qc.invalidateQueries({ queryKey: ['section', item.targetKey] });
      void qc.invalidateQueries({ queryKey: ['content'] });
      void qc.invalidateQueries({ queryKey: ['media'] });
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Restore failed.'); }
  };

  const total = log.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sel = `${inputCls} py-2 text-sm`;
  return (
    <div>
      <PageHeader title="Activity" description="Who changed what, and when. Open an entry to compare before and after, or restore a section." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Admin
          <select value={filters.userId} onChange={(e) => set('userId', e.target.value)} className={sel}><option value="">Everyone</option>{(users.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Section
          <select value={filters.targetKey} onChange={(e) => set('targetKey', e.target.value)} className={sel}><option value="">All</option>{SECTION_KEYS.map((k) => <option key={k} value={k}>{SECTION_LABELS[k]}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">Action
          <select value={filters.action} onChange={(e) => set('action', e.target.value)} className={sel}><option value="">All</option>{Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">From<input type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} className={sel} /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">To<input type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} className={sel} /></label>
      </div>
      {msg && <p role="status" className="mt-4 text-sm font-medium">{msg}</p>}
      <ul className="flex flex-col gap-2 py-5">
        {(log.data?.items ?? []).map((item) => {
          const expanded = open === item.id;
          const hasDiff = item.before !== null || item.after !== null;
          const canRestore = item.targetType === 'section' && isSectionKey(item.targetKey);
          return (
            <li key={item.id} className="rounded-2xl border border-line bg-surface">
              <button type="button" onClick={() => setOpen(expanded ? null : item.id)} aria-expanded={expanded} disabled={!hasDiff}
                className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left disabled:cursor-default">
                <time dateTime={item.at} className="w-40 shrink-0 text-xs tabular-nums text-muted">{new Date(item.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time>
                <span className="min-w-0 flex-1 text-sm"><span className="font-semibold">{item.userEmail || 'Unknown'}</span> <span className={item.action === 'auth.login_failed' ? 'text-red-500' : 'text-muted'}>{ACTION_LABELS[item.action] ?? item.action}</span> <span className="font-medium">{describeTarget(item, users.data ?? [])}</span></span>
                {hasDiff && <ChevronDown className={`h-4 w-4 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />}
              </button>
              {expanded && (
                <div className="flex flex-col gap-3 border-t border-line p-4">
                  <AuditDiff before={item.before} after={item.after} />
                  {canRestore && (
                    <div className="flex flex-wrap gap-2">
                      {item.before !== null && <button type="button" onClick={() => void restore(item, 'before')} className="btn btn-ghost btn-sm"><RotateCcw className="h-4 w-4" />Restore this version (before)</button>}
                      {item.after !== null && <button type="button" onClick={() => void restore(item, 'after')} className="btn btn-ghost btn-sm"><RotateCcw className="h-4 w-4" />Restore the version after</button>}
                    </div>
                  )}
                  <p className="text-xs text-muted">From {item.ip || 'unknown address'}</p>
                </div>
              )}
            </li>
          );
        })}
        {log.data && !log.data.items.length && <li className="py-10 text-center text-muted">No entries match.</li>}
      </ul>
      <div className="flex items-center justify-between px-5 pb-8 text-sm sm:px-8">
        <span className="text-muted">{total} entries</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-ghost btn-sm disabled:opacity-40">Previous</button>
          <span className="tabular-nums text-muted">{page} / {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn btn-ghost btn-sm disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
