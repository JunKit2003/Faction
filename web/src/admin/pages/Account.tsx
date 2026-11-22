import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import { inputCls } from '../form/inputs';
import { PageHeader } from '../ui';

export function Account() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) { setMsg({ ok: false, text: 'The new passwords don’t match.' }); return; }
    try {
      await api('PUT', '/api/admin/me/password', { currentPassword, newPassword });
      setMsg({ ok: true, text: 'Password changed. Other devices have been signed out.' });
      setCurrent(''); setNew(''); setConfirm('');
    } catch (err) { setMsg({ ok: false, text: err instanceof ApiError ? (err.body.issues?.[0]?.message ?? err.message) : 'Failed.' }); }
  };
  const row = (id: string, label: string, v: string, set: (s: string) => void, ac: string) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <input id={id} type="password" autoComplete={ac} value={v} onChange={(e) => set(e.target.value)} className={inputCls} />
    </div>
  );
  return (
    <div>
      <PageHeader title="My account" />
      <form onSubmit={submit} className="card flex max-w-md flex-col gap-4 p-6" noValidate>
        <h2 className="font-semibold">Change password</h2>
        {row('cur-pw', 'Current password', currentPassword, setCurrent, 'current-password')}
        {row('new-pw', 'New password (at least 10 characters)', newPassword, setNew, 'new-password')}
        {row('conf-pw', 'Repeat new password', confirm, setConfirm, 'new-password')}
        {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? 'text-emerald-500' : 'text-red-500'}`}>{msg.text}</p>}
        <button type="submit" className="btn btn-primary btn-sm self-start">Change password</button>
      </form>
    </div>
  );
}
