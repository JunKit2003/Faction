import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { CornerDownLeft, Search } from 'lucide-react';
import { ADMIN_PAGES } from './structure';

interface Item { label: string; hint: string; to: string; words: string }

const EXTRA: Item[] = [
  { label: 'Dashboard', hint: 'Overview', to: '/admin', words: 'home start overview' },
  { label: 'Photos', hint: 'Upload and describe images', to: '/admin/photos', words: 'media images upload library gallery pictures' },
  { label: 'Admins', hint: 'Who can sign in', to: '/admin/admins', words: 'team users staff people password' },
  { label: 'Activity', hint: 'Who changed what', to: '/admin/activity', words: 'audit log history restore undo' },
  { label: 'My account', hint: 'Change your password', to: '/admin/account', words: 'password profile' },
];

/** ⌘K / Ctrl+K: jump to any page or tab. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const items = useMemo<Item[]>(() => [
    ...EXTRA,
    ...ADMIN_PAGES.flatMap((p) => p.tabs.map((t) => ({
      label: `${p.label} › ${t.label}`, hint: t.cards.map((c) => c.title).join(', '), to: `/admin/${p.id}/${t.id}`,
      words: t.cards.flatMap((c) => [c.title, ...c.fields]).join(' '),
    }))),
  ], []);
  const shown = items.filter((it) => `${it.label} ${it.hint} ${it.words}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 12);

  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => input.current?.focus(), 0); } }, [open]);
  if (!open) return null;
  const go = (it?: Item) => { if (!it) return; navigate(it.to); onClose(); };
  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Jump to" className="w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="h-5 w-5 text-muted" />
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setI(0); }} placeholder="Jump to… (hours, logo, FAQ, photos)" aria-label="Search the admin"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, shown.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
              if (e.key === 'Enter') go(shown[i]);
            }}
            className="h-14 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-muted" />
          <kbd className="mono rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {shown.map((it, j) => (
            <li key={it.to}>
              <button type="button" onMouseEnter={() => setI(j)} onClick={() => go(it)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${j === i ? 'bg-accent text-on-accent' : 'text-fg hover:bg-fg/5'}`}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{it.label}</span>
                  <span className={`block truncate text-xs ${j === i ? 'opacity-75' : 'text-muted'}`}>{it.hint}</span>
                </span>
                {j === i && <CornerDownLeft className="h-4 w-4" />}
              </button>
            </li>
          ))}
          {!shown.length && <li className="px-3 py-6 text-center text-sm text-muted">Nothing matches “{q}”.</li>}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
