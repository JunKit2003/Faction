import { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import type { SectionData } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { Img } from '../../content/Img';
import { Reveal } from '../Reveal';
import { SectionHeading } from '../ui/SectionHeading';

type Item = SectionData<'home.services'>['items'][number];

function ServiceCard({ item, index, big }: { item: Item; index: number; big: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [5, -5]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });
  return (
    <Reveal delay={index * 0.08} className={`[perspective:1400px] ${big ? 'lg:row-span-2' : ''}`}>
      <motion.article ref={ref} style={reduce ? undefined : { rotateX: rx, rotateY: ry }}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse' || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width); py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
        className="group relative isolate flex h-full min-h-[340px] flex-col justify-end overflow-hidden rounded-[28px] border border-line bg-surface text-white">
        <Img id={item.mediaId} sizes={big ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 100vw'}
          className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/35 to-black/5" />
        <div className="absolute left-5 top-5 flex items-center gap-2">
          <span className="mono rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-on-accent">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <Link to="/contact#booking" aria-label={`Book: ${item.title}`}
          className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-black/30 backdrop-blur transition-all duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
          <ArrowUpRight className="h-5 w-5" />
        </Link>
        <div className={`flex flex-col gap-3 p-6 sm:p-8 ${big ? 'lg:p-10' : ''}`}>
          <h3 className={`h3 ${big ? 'text-4xl sm:text-5xl' : 'text-3xl'}`}>{item.title}</h3>
          <p className={`max-w-md text-[15px] leading-relaxed text-white/75 ${big ? '' : 'line-clamp-4 group-hover:line-clamp-none'}`}>{item.text}</p>
        </div>
      </motion.article>
    </Reveal>
  );
}

export function Services() {
  const s = useSection('home.services');
  return (
    <section data-section="home.services" className="container-x py-24 sm:py-32">
      <SectionHeading eyebrow={s.eyebrow} title={s.title} intro={s.subtitle} />
      <div className="grid auto-rows-[minmax(340px,auto)] gap-5 lg:grid-cols-[1.15fr_1fr]">
        {s.items.map((item, i) => <ServiceCard key={i} item={item} index={i} big={i === 0} />)}
      </div>
    </section>
  );
}
