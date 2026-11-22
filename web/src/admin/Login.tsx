import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api, ApiError, type Me } from './api';
import { inputCls } from './form/inputs';

export function Login() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const me = await api<Me>('POST', '/api/auth/login', { email, password });
      qc.setQueryData(['me'], me);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Check your connection.');
    } finally { setBusy(false); }
  };
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-5">
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0" />
      <form onSubmit={submit} className="card relative flex w-full max-w-sm flex-col gap-5 p-7 shadow-2xl" noValidate>
        <div>
          <p className="eyebrow">Faction Bikeworks</p>
          <h1 className="mt-1 font-display text-4xl uppercase text-fg">Admin sign in</h1>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-semibold">Email</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold">Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-red-500">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}</button>
        <p className="text-xs text-muted">Forgot your password? Ask another admin to set a new one for you.</p>
      </form>
    </main>
  );
}
