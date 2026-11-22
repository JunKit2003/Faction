import { motion } from 'motion/react';
import { plainDisplay } from '@faction/shared';
import { DisplayText } from '../content/DisplayText';
import { useSection } from '../content/ContentContext';
import { Topo } from './ui/Topo';

export function PageHero({ eyebrow, title, intro, crumb }: { eyebrow?: string; title: string; intro?: string; crumb: string }) {
  const { coordinates } = useSection('site');
  return (
    <section className="relative isolate overflow-hidden border-b border-line pb-16 pt-36 sm:pb-24 sm:pt-44">
      <Topo className="-z-10 text-fg/[0.07] [mask-image:linear-gradient(to_bottom,black,transparent)]" seed={crumb.length} />
      <div className="container-x">
        <div className="mb-10 flex items-center justify-between gap-4">
          <p className="mono text-[11px] uppercase tracking-[0.2em] text-muted">Faction / <span className="text-fg">{crumb}</span></p>
          {coordinates && <p className="mono hidden text-[11px] uppercase tracking-[0.2em] text-muted sm:block">{coordinates}</p>}
        </div>
        {eyebrow && <p className="eyebrow mb-6">{eyebrow}</p>}
        <h1 className="h1 max-w-6xl [text-wrap:balance]" aria-label={plainDisplay(title)}>
          <motion.span aria-hidden className="block" initial={{ y: 36 }} animate={{ y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            <DisplayText text={title} />
          </motion.span>
        </h1>
        {intro && <p className="lead mt-8 max-w-2xl">{intro}</p>}
      </div>
    </section>
  );
}
