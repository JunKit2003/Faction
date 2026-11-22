import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useSection } from '../../content/ContentContext';
import { Reveal } from '../Reveal';

export function Process() {
  const p = useSection('home.process');
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 55%'] });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);
  if (!p.steps.length) return null;
  return (
    <section className="container-x py-24 sm:py-32">
      <Reveal className="mb-16"><h2 className="h2-xl">{p.title}</h2></Reveal>
      <div ref={ref} className="relative">
        <div aria-hidden className="absolute left-6 top-0 h-full w-px bg-line lg:left-0 lg:top-6 lg:h-px lg:w-full" />
        <motion.div aria-hidden style={{ scaleY: reduce ? 1 : line }} className="absolute left-6 top-0 h-full w-px origin-top bg-accent lg:hidden" />
        <motion.div aria-hidden style={{ scaleX: reduce ? 1 : line }} className="absolute left-0 top-6 hidden h-px w-full origin-left bg-accent lg:block" />
        <ol className="relative grid gap-12 lg:grid-cols-3 lg:gap-10">
          {p.steps.map((s, i) => (
            <Reveal as="li" key={i} delay={i * 0.12} className="relative grid grid-cols-[48px_1fr] gap-6 lg:grid-cols-1">
              <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full border border-accent bg-bg font-display text-xl text-accent-ink shadow-[0_0_0_8px_var(--bg)]">{i + 1}</span>
              <div className="flex flex-col gap-3 lg:pr-6">
                <h3 className="font-display text-4xl uppercase leading-none text-fg">{s.title}</h3>
                <p className="text-base leading-relaxed text-muted">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
