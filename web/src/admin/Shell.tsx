import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, History, Image, LogOut, Menu, Settings2, User, Users, X, FileText } from 'lucide-react';
import { SECTION_KEYS, SECTION_LABELS } from '@faction/shared';
import { api, type Me } from './api';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-accent text-black' : 'text-fg/80 hover:bg-fg/5 hover:text-fg'}`;

function NavItems() {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      <div>
        <p className="eyebrow mb-2 px-3">Content</p>
        <ul className="flex flex-col gap-0.5">
          {SECTION_KEYS.map((k) => (
            <li key={k}><NavLink to={`/admin/sections/${k}`} className={linkCls}>{k === 'site' ? <Settings2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}{SECTION_LABELS[k]}</NavLink></li>
          ))}
        </ul>
      </div>
      <div>
        <p className="eyebrow mb-2 px-3">Manage</p>
        <ul className="flex flex-col gap-0.5">
          <li><NavLink to="/admin/media" className={linkCls}><Image className="h-4 w-4" />Media library</NavLink></li>
          <li><NavLink to="/admin/admins" className={linkCls}><Users className="h-4 w-4" />Admins</NavLink></li>
          <li><NavLink to="/admin/audit" className={linkCls}><History className="h-4 w-4" />Audit log</NavLink></li>
          <li><NavLink to="/admin/account" className={linkCls}><User className="h-4 w-4" />My account</NavLink></li>
        </ul>
      </div>
    </nav>
  );
}

export function Shell({ me, children }: { me: Me; children: ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const signOut = async () => {
    await api('POST', '/api/auth/logout').catch(() => undefined);
    qc.setQueryData(['me'], null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
  };
  const top = (
    <div className="flex items-center gap-2">
      <a href="/" target="_blank" rel="noopener" className="btn btn-ghost btn-sm"><ExternalLink className="h-4 w-4" /><span className="hidden sm:inline">View site</span></a>
      <button type="button" onClick={() => void signOut()} className="btn btn-ghost btn-sm" aria-label="Sign out"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></button>
    </div>
  );
  return (
    <div className="min-h-screen bg-bg text-fg lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 overflow-y-auto border-r border-line bg-surface p-4 lg:flex">
        <div className="px-3 pt-2">
          <p className="font-display text-2xl uppercase leading-none">Faction</p>
          <p className="text-xs text-muted">Signed in as {me.name}</p>
        </div>
        <NavItems />
      </aside>
      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur sm:px-8">
          <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-sm lg:hidden" aria-expanded={open} aria-controls="admin-drawer"><Menu className="h-4 w-4" />Menu</button>
          <p className="hidden text-sm text-muted lg:block">{me.email}</p>
          {top}
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu" id="admin-drawer">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-4 pb-8 shadow-2xl">
            <div className="mb-3 flex items-center justify-between px-3"><p className="font-semibold">Menu</p><button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-full hover:bg-fg/5"><X className="h-5 w-5" /></button></div>
            <NavItems />
          </div>
        </div>
      )}
    </div>
  );
}
