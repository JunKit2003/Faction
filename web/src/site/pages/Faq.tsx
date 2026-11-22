import { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Search } from 'lucide-react';
import { fillHours } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { RichText } from '../../content/RichText';
import { PageHero } from '../PageHero';
import { Reveal } from '../Reveal';

export default function Faq() {
  const f = useSection('faq');
  const { hours } = useSection('site');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  const items = useMemo(() => f.items.map((it, i) => ({ ...it, a: fillHours(it.a, hours), i })), [f.items, hours]);
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((it) => (it.q + ' ' + it.a).toLowerCase().includes(q)) : items;

  return (
    <>
      <PageHero title={f.title} intro={f.intro} />
      <section className="container-x max-w-4xl pb-24">
        <Reveal className="relative mb-8">
          <Search aria-hidden className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <label htmlFor={`${base}-q`} className="sr-only">Filter questions</label>
          <input id={`${base}-q`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter questions…"
            className="w-full rounded-full border border-line bg-surface py-4 pl-14 pr-6 text-base text-fg outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15" />
        </Reveal>
        <ul className="flex flex-col gap-3">
          {shown.map((it) => {
            const isOpen = open === it.i || !!q;
            return (
              <li key={it.i} className={`overflow-hidden rounded-3xl border transition-colors duration-300 ${isOpen ? 'border-accent/40 bg-surface' : 'border-line bg-surface/50 hover:bg-surface'}`}>
                <h2>
                  <button type="button" id={`${base}-h${it.i}`} aria-expanded={isOpen} aria-controls={`${base}-p${it.i}`}
                    onClick={() => setOpen(open === it.i ? null : it.i)}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-lg font-semibold text-fg sm:px-8 sm:py-6">
                    {it.q}
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isOpen ? 'bg-accent text-black' : 'bg-fg/5 text-fg'}`}>
                      <Plus className="h-5 w-5" />
                    </motion.span>
                  </button>
                </h2>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={`${base}-p${it.i}`} role="region" aria-labelledby={`${base}-h${it.i}`}
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                      <p className="px-6 pb-6 text-base leading-relaxed text-muted sm:px-8 sm:pb-8"><RichText text={it.a} /></p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
        {!shown.length && <p className="py-10 text-center text-muted">No questions match “{query}”.</p>}
      </section>
    </>
  );
}
