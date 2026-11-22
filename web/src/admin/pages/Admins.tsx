import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Trash2, UserPlus } from 'lucide-react';
import { api, ApiError, type AdminUser, type Issue, type Me } from '../api';
import { inputCls } from '../form/inputs';
import { Modal } from '../Modal';
import { PageHeader } from '../ui';

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');
const issueMap = (issues?: Issue[]) => Object.fromEntries((issues ?? []).map((i) => [i.path, i.message]));

function AddAdmin({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setIssues({});
    try { await api('POST', '/api/admin/users', form); void qc.invalidateQueries({ queryKey: ['users'] }); onClose(); }
    catch (err) { if (err instanceof ApiError) { setIssues(issueMap(err.body.issues)); setError(err.message); } else setError('Failed.'); }
  };
  const f = (k: 'name' | 'email' | 'password', label: string, type = 'text') => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`new-${k}`} className="text-sm font-semibold">{label}</label>
      <input id={`new-${k}`} type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} aria-invalid={issues[k] ? 'true' : 'false'} autoComplete={k === 'password' ? 'new-password' : 'off'} className={inputCls} />
      {issues[k] && <p className="text-sm text-red-500">{issues[k]}</p>}
    </div>
  );
  return (
    <Modal title="Add an admin" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {f('name', 'Name')}{f('email', 'Email', 'email')}{f('password', 'Temporary password (at least 10 characters)', 'password')}
        <p className="text-xs text-muted">Share the password with them privately. They can change it under My account.</p>
        {error && !Object.keys(issues).length && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button><button type="submit" className="btn btn-primary btn-sm">Add admin</button></div>
      </form>
    </Modal>
  );
}

function ResetPassword({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { await api('POST', `/api/admin/users/${user.id}/password`, { password }); onClose(); }
    catch (err) { setError(err instanceof ApiError ? (err.body.issues?.[0]?.message ?? err.message) : 'Failed.'); }
  };
  return (
    <Modal title={`New password for ${user.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <label htmlFor="reset-pw" className="text-sm font-semibold">New password (at least 10 characters)</label>
        <input id="reset-pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <p className="text-xs text-muted">They will be signed out everywhere.</p>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button><button type="submit" className="btn btn-primary btn-sm">Set password</button></div>
      </form>
    </Modal>
  );
}

export function Admins({ me }: { me: Me }) {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<AdminUser[]>('GET', '/api/admin/users') });
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [error, setError] = useState('');
  const act = async (fn: () => Promise<unknown>) => {
    setError('');
    try { await fn(); void qc.invalidateQueries({ queryKey: ['users'] }); } catch (e) { setError(e instanceof ApiError ? e.message : 'Failed.'); }
  };
  return (
    <div>
      <PageHeader title="Admins" description="Everyone here can edit the whole site. Every change is recorded in Activity."
        actions={<button type="button" onClick={() => setAdding(true)} className="btn btn-primary btn-sm"><UserPlus className="h-4 w-4" />Add admin</button>} />
      {error && <p role="alert" className="mb-3 text-sm text-red-500">{error}</p>}
      <ul className="flex flex-col gap-2 px-5">
        {(users.data ?? []).map((u) => {
          const self = u.id === me.id;
          return (
            <li key={u.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 font-semibold text-accent-ink">{u.name.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{u.name} {self && <span className="ml-1 rounded-full bg-fg/10 px-2 py-0.5 text-xs font-medium">You</span>} {u.disabledAt && <span className="ml-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-500">Disabled</span>}</p>
                <p className="truncate text-sm text-muted">{u.email} · Last sign-in {when(u.lastLoginAt)}</p>
              </div>
              {!self && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setResetting(u)} className="btn btn-ghost btn-sm"><KeyRound className="h-4 w-4" />Password</button>
                  <button type="button" onClick={() => void act(() => api('PATCH', `/api/admin/users/${u.id}`, { disabled: !u.disabledAt }))} className="btn btn-ghost btn-sm">{u.disabledAt ? 'Enable' : 'Disable'}</button>
                  <button type="button" aria-label={`Delete ${u.name}`} onClick={() => { if (window.confirm(`Delete ${u.name}? Their past changes stay in the audit log.`)) void act(() => api('DELETE', `/api/admin/users/${u.id}`)); }} className="btn btn-ghost btn-sm hover:!border-red-500 hover:!text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {adding && <AddAdmin onClose={() => setAdding(false)} />}
      {resetting && <ResetPassword user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}
