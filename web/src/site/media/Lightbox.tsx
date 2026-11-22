import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Img } from '../../content/Img';
import { useContent } from '../../content/ContentContext';

interface Props { ids: string[]; index: number | null; onChange: (i: number | null) => void }

/** Fullscreen viewer: arrows, swipe, Esc; focus is trapped inside and returned on close. */
export function Lightbox({ ids, index, onChange }: Props) {
  const { media } = useContent();
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const open = index !== null;
  const go = (d: number) => index !== null && onChange((index + d + ids.length) % ids.length);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('[data-close]')?.focus();
    return () => { document.body.style.overflow = prev; returnFocus.current?.focus(); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(null);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab' && dialogRef.current) {
        const f = [...dialogRef.current.querySelectorAll<HTMLElement>('button')];
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const id = index !== null ? ids[index] : undefined;
  const caption = id ? media[id]?.alt : '';

  return createPortal(
    <AnimatePresence>
      {open && id && (
        <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Image viewer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onChange(null); }}>
          <div className="flex items-center justify-between p-4 sm:p-6">
            <span className="text-sm tabular-nums text-white/60">{index! + 1} / {ids.length}</span>
            <button data-close type="button" onClick={() => onChange(null)} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20" onClick={(e) => { if (e.target === e.currentTarget) onChange(null); }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={id} className="flex max-h-full max-w-full items-center justify-center"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}
                drag={ids.length > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6}
                onDragEnd={(_e, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1); }}>
                <Img id={id} sizes="100vw" className="max-h-[78vh] w-auto max-w-full select-none rounded-xl object-contain" />
              </motion.div>
            </AnimatePresence>
            {ids.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="absolute left-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid sm:left-6"><ChevronLeft className="h-6 w-6" /></button>
                <button type="button" onClick={() => go(1)} aria-label="Next image" className="absolute right-2 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 sm:grid sm:right-6"><ChevronRight className="h-6 w-6" /></button>
              </>
            )}
          </div>
          <p className="min-h-16 p-4 text-center text-sm text-white/75 sm:p-6">{caption}</p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
