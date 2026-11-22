import { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, Plus, Search } from 'lucide-react';
import { fillHours } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { RichText } from '../../content/RichText';
import { DisplayText } from '../../content/DisplayText';
import { PageHero } from '../PageHero';
import { Reveal } from '../Reveal';

export default function Faq() {
  const f = useSection('faq');
  const { hours, whatsappNumber } = useSection('site');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  const items = useMemo(() => f.items.map((it, i) => ({ ...it, a: fillHours(it.a, hours), i })), [f.items, hours]);
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((it) => (it.q + ' ' + it.a).toLowerCase().includes(q)) : items;

  return (
    <>
      <PageHero crumb="FAQ" eyebrow={f.eyebrow} title={f.title} intro={f.intro} />
      <section className="container-x grid gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-16">
        <aside className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <label htmlFor={`${base}-q`} className="sr-only">Filter questions</label>
            <input id={`${base}-q`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter questions…"
              className="w-full rounded-full border border-line-strong bg-surface py-4 pl-14 pr-6 text-base text-fg outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20" />
          </div>
          <p className="mono px-2 text-[11px] uppercase tracking-[0.18em] text-muted">{shown.length} of {items.length} questions</p>
          {f.askTitle && (
            <div className="relative overflow-hidden rounded-[26px] bg-accent p-7 text-on-accent [--stroke:var(--on-accent)]">
              <h2 className="display text-4xl"><DisplayText text={f.askTitle} accent="outline" /></h2>
              {f.askText && <p className="mt-3 text-[15px] leading-relaxed opacity-80">{f.askText}</p>}
              {f.askButton && (
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm mt-6 bg-on-accent text-accent hover:opacity-90">
                  <MessageCircle className="h-4 w-4" />{f.askButton}
                </a>
              )}
            </div>
          )}
        </aside>
        <div>
          <ul className="flex flex-col border-t border-line">
            {shown.map((it) => {
              const isOpen = open === it.i || !!q;
              return (
                <Reveal as="li" key={it.i} className="border-b border-line">
                  <h2>
                    <button type="button" id={`${base}-h${it.i}`} aria-expanded={isOpen} aria-controls={`${base}-p${it.i}`} onClick={() => setOpen(open === it.i ? null : it.i)}
                      className="group flex w-full items-start gap-5 py-6 text-left sm:gap-8 sm:py-7">
                      <span className={`mono mt-1.5 text-xs tabular-nums ${isOpen ? 'text-accent-ink' : 'text-muted'}`}>{String(it.i + 1).padStart(2, '0')}</span>
                      <span className={`flex-1 text-lg font-semibold leading-snug transition-colors sm:text-xl ${isOpen ? 'text-fg' : 'text-fg/85 group-hover:text-fg'}`}>{it.q}</span>
                      <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.35 }}
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors ${isOpen ? 'border-accent bg-accent text-on-accent' : 'border-line-strong text-fg'}`}>
                        <Plus className="h-4 w-4" />
                      </motion.span>
                    </button>
                  </h2>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div id={`${base}-p${it.i}`} role="region" aria-labelledby={`${base}-h${it.i}`}
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                        <p className="max-w-2xl pb-8 pl-10 text-base leading-relaxed text-muted sm:pl-14"><RichText text={it.a} /></p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Reveal>
              );
            })}
          </ul>
          {!shown.length && <p className="py-10 text-muted">No questions match “{query}”.</p>}
        </div>
      </section>
    </>
  );
}
