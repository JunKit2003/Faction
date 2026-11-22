import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { plainDisplay } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { Img } from '../../content/Img';
import { DisplayText } from '../../content/DisplayText';
import { StatusLine } from '../StatusLine';
import { Magnetic } from '../Magnetic';
import { RingBadge } from '../ui/RingBadge';

const SLIDE_MS = 6500;
const isInternal = (href: string) => href.startsWith('/') || href.startsWith('#');

function Cta({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return isInternal(href) ? <Link to={href} className={className}>{children}</Link> : <a href={href} className={className}>{children}</a>;
}

export function Hero() {
  const hero = useSection('home.hero');
  const site = useSection('site');
  const about = useSection('about');
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-22%']);
  const cardY = useTransform(scrollYProgress, [0, 1], ['0%', '-60%']);
  const slides = hero.slideIds;

  useEffect(() => {
    if (reduce || slides.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, reduce, slides.length]);

  const current = slides[index % slides.length];
  // The floating card has its own photos (Homepage → Top banner → Floating card), on its own slower cycle.
  const cardPhotos = hero.badgeImageIds;
  const [cardIndex, setCardIndex] = useState(0);
  useEffect(() => {
    if (reduce || cardPhotos.length < 2) return;
    const t = setTimeout(() => setCardIndex((i) => (i + 1) % cardPhotos.length), SLIDE_MS + 1500);
    return () => clearTimeout(t);
  }, [cardIndex, reduce, cardPhotos.length]);
  const cardImage = cardPhotos[cardIndex % Math.max(1, cardPhotos.length)];
  const hasCard = !!(cardImage || hero.badgeTitle || hero.badgeText);
  const words = plainDisplay(hero.title).split(/\s+/).length;
  // The floating collage only exists on wide screens; don't even mount it (or fetch its photo) on phones.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-black text-[#eceee4] [--stroke:#eceee4] [--accent-ink:var(--accent)]">
      <motion.div aria-hidden style={reduce ? undefined : { y: imgY }} className="absolute inset-0 -z-10 will-change-transform">
        <AnimatePresence initial={false}>
          <motion.div key={current} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }}>
            <motion.div className="h-full w-full" initial={{ scale: reduce ? 1 : 1.1 }} animate={{ scale: 1 }} transition={{ duration: reduce ? 0 : SLIDE_MS / 1000 + 1.4, ease: 'linear' }}>
              <Img id={current} priority={index === 0} sizes="100vw" alt="" className="h-full w-full object-cover" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0a] via-[#0b0c0a]/55 to-[#0b0c0a]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c0a]/85 via-[#0b0c0a]/20 to-transparent" />
        <div className="grid-lines absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="grain absolute inset-0 opacity-[0.14] mix-blend-overlay" />
      </motion.div>

      {/* Top readouts */}
      <div className="container-x absolute inset-x-0 top-[96px] flex items-start justify-between">
        <StatusLine className="text-[#eceee4]/85" />
        {site.coordinates && <p className="mono hidden text-[11px] uppercase tracking-[0.2em] text-[#eceee4]/55 sm:block">{site.coordinates}</p>}
      </div>

      {/* Floating collage card (wide screens only) */}
      {wide && hasCard && (
        <motion.div data-hero-card style={reduce ? undefined : { y: cardY }} className="absolute right-[6vw] top-[22vh] hidden w-[19vw] max-w-[300px] xl:block">
          {cardImage && (
            <motion.div initial={{ opacity: 0, rotate: 0, y: 40 }} animate={{ opacity: 1, rotate: 5, y: 0 }} transition={{ delay: 0.6, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-[22px] border border-white/15 bg-white/5 p-2 shadow-2xl backdrop-blur-md">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={cardImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="aspect-[4/5] overflow-hidden rounded-[16px]">
                  <Img id={cardImage} sizes="300px" className="h-full w-full object-cover" />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
          {(hero.badgeTitle || hero.badgeText) && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.8 }}
              className={`max-w-[230px] rounded-2xl border border-white/10 bg-[#0b0c0a]/85 p-4 shadow-2xl backdrop-blur-md ${cardImage ? 'absolute -bottom-8 -left-16' : 'relative mt-24'}`}>
              <p className="h3 text-base text-accent">{hero.badgeTitle}</p>
              <p className="mt-1 text-[13px] leading-snug text-white/70">{hero.badgeText}</p>
            </motion.div>
          )}
          {about.badge && cardImage && (
            <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="absolute -right-8 -top-10">
              <RingBadge text={about.badge} className="h-28 w-28"><ArrowDown className="h-6 w-6" /></RingBadge>
            </motion.div>
          )}
        </motion.div>
      )}

      <motion.div style={reduce ? undefined : { y: copyY }} className="container-x relative w-full pb-24 pt-44 sm:pb-28">
        {hero.eyebrow && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="eyebrow mb-6 !text-accent">{hero.eyebrow}</motion.p>
        )}
        <h1 className="display max-w-[16ch] text-[clamp(3rem,9.6vw,9.5rem)] [text-wrap:balance]" aria-label={plainDisplay(hero.title)}>
          {/* Painted from the first frame (LCP): slide up only, never hidden. */}
          <motion.span aria-hidden className="block" initial={{ y: 48 }} animate={{ y: 0 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>
            <DisplayText text={hero.title} />
          </motion.span>
        </h1>
        {/* Visible from the first paint (LCP on phones): slide only, no fade. */}
        <motion.p initial={{ y: 18 }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-[#eceee4]/75 sm:text-xl">
          {hero.text}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + words * 0.02, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="mt-10 flex flex-wrap items-center gap-3">
          <Magnetic>
            <Cta href={hero.primary.href} className="btn btn-primary btn-lg group">{hero.primary.label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Cta>
          </Magnetic>
          <Cta href={hero.secondary.href} className="btn btn-ghost-light btn-lg">{hero.secondary.label}</Cta>
        </motion.div>
      </motion.div>

      {slides.length > 1 && (
        <div className="container-x absolute inset-x-0 bottom-8 flex items-center gap-4">
          <span className="mono text-[11px] tabular-nums text-white/60">{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
          <div className="flex gap-1.5" role="group" aria-label="Hero images">
            {slides.map((id, i) => (
              <button key={id + i} type="button" onClick={() => setIndex(i)} aria-label={`Show image ${i + 1}`} aria-current={i === index}
                className="relative h-[3px] w-10 overflow-hidden rounded-full bg-white/20 sm:w-16">
                {i === index && <motion.span className="absolute inset-y-0 left-0 bg-accent" initial={{ width: reduce ? '100%' : '0%' }} animate={{ width: '100%' }} transition={{ duration: reduce ? 0 : SLIDE_MS / 1000, ease: 'linear' }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
