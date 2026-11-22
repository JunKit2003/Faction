import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useSection } from '../../content/ContentContext';
import { Reveal } from '../Reveal';
import { SectionHeading } from '../ui/SectionHeading';

export function Process() {
  const p = useSection('home.process');
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 60%'] });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);
  if (!p.steps.length) return null;
  return (
    <section data-section="home.process" className="container-x py-24 sm:py-32">
      <SectionHeading eyebrow={p.eyebrow} title={p.title} />
      <ol ref={ref} className="relative grid gap-5 lg:grid-cols-3">
        <motion.span aria-hidden style={{ scaleX: reduce ? 1 : line }} className="absolute -top-6 left-0 hidden h-[2px] w-full origin-left bg-accent lg:block" />
        {p.steps.map((s, i) => (
          <Reveal as="li" key={i} delay={i * 0.1} className="card group relative flex min-h-[300px] flex-col justify-between overflow-hidden p-7 transition-colors duration-500 hover:border-accent/50 sm:p-9">
            <span aria-hidden className="display text-outline pointer-events-none absolute -right-3 -top-6 text-[9rem] leading-none transition-[-webkit-text-stroke-color] duration-500 [--stroke:var(--line-strong)] group-hover:[--stroke:var(--accent)]">{String(i + 1).padStart(2, '0')}</span>
            <span className="mono text-[11px] uppercase tracking-[0.2em] text-accent-ink">Step {String(i + 1).padStart(2, '0')}</span>
            <div className="relative flex flex-col gap-3">
              <h3 className="h3 text-3xl sm:text-4xl">{s.title}</h3>
              <p className="text-base leading-relaxed text-muted">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
