import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { useSection } from '../../content/ContentContext';
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
    const controls = animate(0, split.value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(formatSplit(split, v)),
      onComplete: () => setShown(text),
    });
    return () => controls.stop();
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
    <section data-section="home.stats" aria-label="Shop in numbers" className="relative overflow-hidden border-y border-line bg-surface">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)]" />
      <div className="container-x relative grid grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => {
          const value = s.kind === 'years' ? (s.value || '{years}').replaceAll('{years}', String(yearsSince(openedYear))) : s.value;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col gap-2 px-4 py-10 sm:px-8 lg:py-16 ${i % 2 ? 'border-l border-line' : ''} ${i > 1 ? 'border-t border-line lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''}`}
            >
              <span className="font-display text-5xl leading-none tracking-tight text-fg sm:text-6xl lg:text-7xl">
                <CountUp text={value} />
              </span>
              <span className="text-sm font-medium uppercase tracking-[0.18em] text-muted">{s.label}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
