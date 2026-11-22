import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { useSection } from '../../content/ContentContext';
import { Reveal } from '../Reveal';
import { Topo } from '../ui/Topo';
import { formatSplit, splitNumber, yearsSince } from './count';

function CountUp({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();
  const split = splitNumber(text);
  const [shown, setShown] = useState(() => (reduce || !split ? text : formatSplit(split, 0)));
  useEffect(() => {
    if (reduce || !split) { setShown(text); return; }
    if (!inView) return;
    const c = animate(0, split.value, { duration: 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setShown(formatSplit(split, v)), onComplete: () => setShown(text) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, text]);
  return (
    <span ref={ref}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

export function Stats() {
  const { items } = useSection('home.stats');
  const { openedYear } = useSection('site');
  if (!items.length) return null;
  return (
    <section data-section="home.stats" aria-label="Shop in numbers" className="relative overflow-hidden py-20 sm:py-28">
      <Topo className="text-fg/[0.06]" seed={3} />
      <div className="container-x relative grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
        {items.map((s, i) => {
          const value = s.kind === 'years' ? (s.value || '{years}').replaceAll('{years}', String(yearsSince(openedYear))) : s.value;
          return (
            <Reveal key={i} delay={i * 0.08} className="flex flex-col gap-3 border-l-2 border-accent pl-5 sm:pl-7">
              <span className="display whitespace-nowrap text-[clamp(2.1rem,4.4vw,4.4rem)] leading-none text-fg"><CountUp text={value} /></span>
              <span className="mono text-[11px] uppercase tracking-[0.18em] text-muted">{s.label}</span>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
