import { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import type { SectionData } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { Img } from '../../content/Img';
import { Reveal } from '../Reveal';

type Item = SectionData<'home.services'>['items'][number];

function TiltCard({ item, index }: { item: Item; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 });
  const glow = useTransform([px, py], ([x, y]) => `radial-gradient(500px circle at ${(x as number) * 100}% ${(y as number) * 100}%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 45%)`);

  return (
    <Reveal delay={index * 0.1} className="[perspective:1200px]">
      <motion.article
        ref={ref}
        style={reduce ? undefined : { rotateX: rx, rotateY: ry }}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse' || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
        className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-surface [transform-style:preserve-3d]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Img id={item.mediaId} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute left-5 top-5 rounded-full bg-black/40 px-3 py-1 font-display text-lg text-white backdrop-blur">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
          <h3 className="font-display text-3xl uppercase leading-none text-fg">{item.title}</h3>
          <p className="text-[15px] leading-relaxed text-muted">{item.text}</p>
        </div>
        {!reduce && <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: glow }} />}
      </motion.article>
    </Reveal>
  );
}

export function Services() {
  const s = useSection('home.services');
  return (
    <section className="container-x py-24 sm:py-32">
      <Reveal className="mb-14 flex flex-col gap-4 sm:mb-20">
        <h2 className="h2-xl">{s.title}</h2>
        {s.subtitle && <p className="lead max-w-2xl">{s.subtitle}</p>}
      </Reveal>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {s.items.map((item, i) => <TiltCard key={i} item={item} index={i} />)}
      </div>
    </section>
  );
}
