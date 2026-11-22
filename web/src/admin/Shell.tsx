import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileText, Gauge, History, Home, Image, LogOut, Menu, Navigation, Search, Store, Users, X, Globe } from 'lucide-react';
import { api, type Me } from './api';
import { ADMIN_PAGES } from './structure';
import { CommandPalette } from './CommandPalette';
import { Logo } from '../site/Logo';
import { ContentProvider } from '../content/ContentContext';

const ICONS: Record<string, typeof Store> = { shop: Store, homepage: Home, pages: FileText, navigation: Navigation, seo: Globe };

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-fg/[0.07] text-fg' : 'text-fg/65 hover:bg-fg/5 hover:text-fg'}`;
const Bar = ({ on }: { on: boolean }) => <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${on ? 'bg-accent' : 'bg-transparent'}`} />;

function NavItems() {
  const item = (to: string, label: string, Icon: typeof Store, end = false) => (
    <li key={to}>
      <NavLink to={to} end={end} className={linkCls}>{({ isActive }) => <><Bar on={isActive} /><Icon className={`h-[18px] w-[18px] ${isActive ? 'text-accent-ink' : ''}`} />{label}</>}</NavLink>
    </li>
  );
  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      <ul className="flex flex-col gap-0.5">{item('/admin', 'Dashboard', Gauge, true)}</ul>
      <div>
        <p className="eyebrow mb-2 px-3 !text-muted before:!content-none">Website</p>
        <ul className="flex flex-col gap-0.5">{ADMIN_PAGES.map((p) => item(`/admin/${p.id}`, p.label, ICONS[p.id] ?? FileText))}</ul>
      </div>
      <div>
        <p className="eyebrow mb-2 px-3 !text-muted before:!content-none">Library</p>
        <ul className="flex flex-col gap-0.5">{item('/admin/photos', 'Photos', Image)}</ul>
      </div>
      <div>
        <p className="eyebrow mb-2 px-3 !text-muted before:!content-none">Team</p>
        <ul className="flex flex-col gap-0.5">{item('/admin/admins', 'Admins', Users)}{item('/admin/activity', 'Activity', History)}</ul>
      </div>
    </nav>
  );
}

const crumbFor = (path: string) => {
  const [, , a] = path.split('/');
  if (!a) return 'Dashboard';
  return ADMIN_PAGES.find((p) => p.id === a)?.label ?? ({ photos: 'Photos', admins: 'Admins', activity: 'Activity', account: 'My account' } as Record<string, string>)[a] ?? '';
};

export function Shell({ me, children }: { me: Me; children: ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  const signOut = async () => {
    await api('POST', '/api/auth/logout').catch(() => undefined);
    qc.setQueryData(['me'], null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
  };
  const side = (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3 px-3 pt-1">
        <ContentProvider fallback={<span className="display text-xl">Faction</span>}><Logo className="h-7 w-auto" /></ContentProvider>
        <span className="mono rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-on-accent">ADMIN</span>
      </div>
      <button type="button" onClick={() => setPalette(true)} className="mx-1 flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2 text-left text-sm text-muted hover:border-line-strong">
        <Search className="h-4 w-4" /><span className="flex-1">Jump to…</span><kbd className="mono text-[10px]">⌘K</kbd>
      </button>
      <NavItems />
      <div className="mt-auto flex items-center gap-3 rounded-2xl border border-line p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-on-accent">{me.name.slice(0, 1).toUpperCase()}</span>
        <NavLink to="/admin/account" className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{me.name}</p>
          <p className="truncate text-xs text-muted">My account</p>
        </NavLink>
        <button type="button" onClick={() => void signOut()} aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-fg/5 hover:text-fg"><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-bg text-fg lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-line bg-surface p-4 lg:block">{side}</aside>
      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden" aria-label="Open menu" aria-expanded={open}><Menu className="h-5 w-5" /></button>
            <p className="mono text-[11px] uppercase tracking-[0.16em] text-muted">Admin <span className="text-fg/40">/</span> <span className="text-fg">{crumbFor(pathname)}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPalette(true)} className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden" aria-label="Open search"><Search className="h-4 w-4" /></button>
            <a href="/" target="_blank" rel="noopener" className="btn btn-ghost btn-sm"><ExternalLink className="h-4 w-4" /><span className="hidden sm:inline">View site</span></a>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] overflow-y-auto border-r border-line bg-surface p-4 shadow-2xl">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full hover:bg-fg/5"><X className="h-5 w-5" /></button>
            {side}
          </div>
        </div>
      )}
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
