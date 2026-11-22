import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const stack: number[] = [];
let modalSeq = 0;

/** Accessible dialog: focus moves in, Esc closes the topmost one, focus returns to the opener. */
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const me = ++modalSeq;
    stack.push(me);
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input, button, select, textarea')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== me) return;
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab' && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea, a[href]')];
        if (!f.length) return;
        const first = f[0]!, last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { stack.splice(stack.indexOf(me), 1); document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; opener?.focus(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-fg/5"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
