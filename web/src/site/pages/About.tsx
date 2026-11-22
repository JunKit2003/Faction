import { Link } from 'react-router';
import { ArrowRight, Quote } from 'lucide-react';
import { formatHours } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { Img } from '../../content/Img';
import { RichText } from '../../content/RichText';
import { DisplayText } from '../../content/DisplayText';
import { PageHero } from '../PageHero';
import { Reveal } from '../Reveal';
import { StatusLine } from '../StatusLine';
import { RingBadge } from '../ui/RingBadge';
import { Eyebrow } from '../ui/Eyebrow';

export default function About() {
  const a = useSection('about');
  const site = useSection('site');
  return (
    <>
      <PageHero crumb="About" eyebrow={a.eyebrow} title={a.title} intro={a.intro} />

      <section className="container-x grid items-center gap-16 py-24 lg:grid-cols-2 lg:gap-24">
        <Reveal className="relative order-2 pb-16 lg:order-1 lg:pb-20">
          {/* Whole photo at its natural shape, scaled to fit the column and the screen height. */}
          <Img id={a.imageId} sizes="(min-width: 1024px) 50vw, 100vw" className="mx-auto h-auto max-h-[80vh] w-auto max-w-full rounded-[28px] border border-line" />
          {a.secondImageId && (
            <div className="absolute bottom-0 right-0 w-[46%] rotate-[4deg] overflow-hidden rounded-[22px] border-4 border-bg shadow-2xl sm:-right-6">
              <Img id={a.secondImageId} sizes="(min-width: 1024px) 22vw, 44vw" className="h-auto w-full" />
            </div>
          )}
          {a.badge && <RingBadge text={a.badge} className="absolute -left-3 -top-8 h-28 w-28 sm:-left-8 sm:h-32 sm:w-32"><span className="display text-xl">{site.openedYear}</span></RingBadge>}
        </Reveal>
        <Reveal className="order-1 flex flex-col gap-6 lg:order-2">
          <h2 className="h2"><DisplayText text={a.storyTitle} /></h2>
          {a.story.map((p, i) => <p key={i} className={`leading-relaxed ${i === 0 ? 'text-xl text-fg' : 'text-lg text-muted'}`}><RichText text={p} /></p>)}
        </Reveal>
      </section>

      {a.quote && (
        <section className="relative overflow-hidden bg-accent py-20 text-on-accent [--stroke:var(--on-accent)] sm:py-28">
          <div className="container-x relative">
            <Quote aria-hidden className="mb-6 h-12 w-12" />
            <blockquote className="display max-w-6xl text-[clamp(2rem,5.4vw,4.6rem)] leading-[0.95] [text-wrap:balance]">{a.quote}</blockquote>
          </div>
        </section>
      )}

      <section className="container-x grid gap-12 py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <Reveal className="flex flex-col gap-6">
          <Eyebrow>{site.name}</Eyebrow>
          <h2 className="h2-xl"><DisplayText text={a.findTitle} /></h2>
          {a.findText && <p className="lead"><RichText text={a.findText} /></p>}
        </Reveal>
        <Reveal delay={0.1}>
          <dl className="card flex flex-col divide-y divide-line">
            <div className="flex flex-col gap-3 p-6 sm:p-8">
              <dt className="eyebrow">{site.labels.hours}</dt>
              <dd className="flex flex-col gap-1 text-lg"><StatusLine className="mb-1" />{formatHours(site.hours).map((l) => <span key={l}>{l}</span>)}</dd>
            </div>
            <div className="flex flex-col gap-3 p-6 sm:p-8">
              <dt className="eyebrow">{site.labels.address}</dt>
              <dd className="text-lg">{site.address}</dd>
            </div>
            <div className="flex flex-col gap-3 p-6 sm:p-8">
              <dt className="eyebrow">{site.labels.contact}</dt>
              <dd><Link to="/contact" className="group inline-flex items-center gap-2 text-lg font-semibold text-accent-ink">{a.contactLabel}<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></Link></dd>
            </div>
          </dl>
        </Reveal>
      </section>
    </>
  );
}
