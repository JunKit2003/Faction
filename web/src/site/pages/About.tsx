import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { formatHours } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { Img } from '../../content/Img';
import { RichText } from '../../content/RichText';
import { PageHero } from '../PageHero';
import { Reveal } from '../Reveal';
import { OpenBadge } from '../OpenBadge';

export default function About() {
  const a = useSection('about');
  const site = useSection('site');
  const imgRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: imgRef, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <>
      <PageHero title={a.title} intro={a.intro} />
      <section className="container-x grid items-center gap-12 pb-24 lg:grid-cols-2 lg:gap-20">
        <Reveal className="flex flex-col gap-6">
          <h2 className="h2">{a.storyTitle}</h2>
          {a.story.map((p, i) => <p key={i} className="text-lg leading-relaxed text-muted"><RichText text={p} /></p>)}
        </Reveal>
        <Reveal delay={0.1}>
          <div ref={imgRef} className="relative aspect-[4/5] overflow-hidden rounded-[32px] border border-line">
            <motion.div style={reduce ? undefined : { y, scale: 1.18 }} className="absolute inset-0">
              <Img id={a.imageId} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full object-cover" />
            </motion.div>
          </div>
        </Reveal>
      </section>
      <section className="border-t border-line bg-surface">
        <div className="container-x grid gap-12 py-24 lg:grid-cols-[1.2fr_1fr]">
          <Reveal className="flex flex-col gap-6">
            <h2 className="h2-xl">{a.findTitle}</h2>
            {a.findText && <p className="lead"><RichText text={a.findText} /></p>}
          </Reveal>
          <Reveal delay={0.1}>
            <dl className="flex flex-col divide-y divide-line rounded-[28px] border border-line bg-bg">
              <div className="flex flex-col gap-2 p-6 sm:p-8">
                <dt className="eyebrow flex items-center gap-3">{site.labels.hours} <OpenBadge /></dt>
                <dd className="flex flex-col text-lg text-fg">{formatHours(site.hours).map((l) => <span key={l}>{l}</span>)}</dd>
              </div>
              <div className="flex flex-col gap-2 p-6 sm:p-8">
                <dt className="eyebrow">{site.labels.address}</dt>
                <dd className="text-lg text-fg">{site.address}</dd>
              </div>
              <div className="flex flex-col gap-2 p-6 sm:p-8">
                <dt className="eyebrow">{site.labels.contact}</dt>
                <dd><Link to="/contact" className="group inline-flex items-center gap-2 text-lg font-semibold text-accent-ink">{a.contactLabel}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></Link></dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>
    </>
  );
}
