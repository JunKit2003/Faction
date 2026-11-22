import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useSection } from '../../content/ContentContext';
import { Img } from '../../content/Img';
import { SplitWords } from '../Reveal';
import { OpenBadge } from '../OpenBadge';
import { Magnetic } from '../Magnetic';

const SLIDE_MS = 6500;

export function Hero() {
  const hero = useSection('home.hero');
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%']);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const slides = hero.slideIds;

  useEffect(() => {
    if (reduce || slides.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, reduce, slides.length]);

  const current = slides[index % slides.length];
  const isInternal = (href: string) => href.startsWith('/') || href.startsWith('#');

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-black text-white">
      <motion.div aria-hidden style={reduce ? undefined : { y: imgY }} className="absolute inset-0 -z-10 will-change-transform">
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          >
            <motion.div
              className="h-full w-full"
              initial={{ scale: reduce ? 1 : 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: reduce ? 0 : SLIDE_MS / 1000 + 1.4, ease: 'linear' }}
            >
              <Img id={current} priority={index === 0} sizes="100vw" alt="" className="h-full w-full object-cover" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent" />
        <div className="grain absolute inset-0 opacity-[0.15] mix-blend-overlay" />
      </motion.div>

      <motion.div style={reduce ? undefined : { y: copyY, opacity: copyOpacity }} className="container-x relative w-full pb-24 pt-40 sm:pb-28">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="mb-6">
          <OpenBadge className="border-white/25 bg-white/10 text-white backdrop-blur dark:text-white" />
        </motion.div>
        <h1 className="max-w-[14ch] font-display text-[clamp(3.4rem,11vw,9.5rem)] uppercase leading-[0.86] tracking-[-0.01em]">
          <SplitWords text={hero.title} delay={0.15} />
        </h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
          {hero.text}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center gap-4">
          <Magnetic>
            {isInternal(hero.primary.href)
              ? <Link to={hero.primary.href} className="btn btn-primary btn-lg group">{hero.primary.label}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
              : <a href={hero.primary.href} className="btn btn-primary btn-lg group">{hero.primary.label}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></a>}
          </Magnetic>
          {isInternal(hero.secondary.href)
            ? <Link to={hero.secondary.href} className="btn btn-ghost-light btn-lg">{hero.secondary.label}</Link>
            : <a href={hero.secondary.href} className="btn btn-ghost-light btn-lg">{hero.secondary.label}</a>}
        </motion.div>
      </motion.div>

      {slides.length > 1 && (
        <div className="container-x absolute inset-x-0 bottom-8 flex items-center justify-between">
          <div className="flex gap-2" role="group" aria-label="Hero images">
            {slides.map((id, i) => (
              <button key={id + i} type="button" onClick={() => setIndex(i)} aria-label={`Show image ${i + 1}`} aria-current={i === index}
                className="relative h-1 w-10 overflow-hidden rounded-full bg-white/25 sm:w-14">
                {i === index && (
                  <motion.span className="absolute inset-y-0 left-0 bg-white" initial={{ width: reduce ? '100%' : '0%' }} animate={{ width: '100%' }}
                    transition={{ duration: reduce ? 0 : SLIDE_MS / 1000, ease: 'linear' }} />
                )}
              </button>
            ))}
          </div>
          <motion.span aria-hidden animate={reduce ? undefined : { y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2 }}
            className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 sm:flex">
            Scroll <ChevronDown className="h-4 w-4" />
          </motion.span>
        </div>
      )}
    </section>
  );
}
