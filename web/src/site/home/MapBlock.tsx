import { MapPin, MessageCircle, Clock } from 'lucide-react';
import { formatHours } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { DisplayText } from '../../content/DisplayText';
import { MapEmbed } from '../MapEmbed';
import { Reveal } from '../Reveal';
import { Eyebrow } from '../ui/Eyebrow';
import { StatusLine } from '../StatusLine';

const phone = (n: string) => `+${n.slice(0, 2)} ${n.slice(2, 4)}-${n.slice(4, 8)} ${n.slice(8)}`.trim();

export function MapBlock() {
  const m = useSection('home.map');
  const site = useSection('site');
  return (
    <section data-section="home.map" aria-labelledby="visit-title" className="container-x grid gap-12 py-24 sm:py-32 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
      <Reveal className="flex flex-col gap-7">
        <Eyebrow>{m.eyebrow}</Eyebrow>
        <h2 id="visit-title" className="h2-xl"><DisplayText text={m.title} accent="mark" /></h2>
        {m.subtitle && <p className="lead">{m.subtitle}</p>}
        <ul className="flex flex-col gap-5 text-[15px]">
          <li className="flex gap-4"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent-ink" /><span>{site.address}</span></li>
          <li className="flex gap-4"><MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent-ink" />
            <a href={`https://wa.me/${site.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="link-underline">{phone(site.whatsappNumber)} (WhatsApp)</a></li>
          <li className="flex gap-4"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent-ink" />
            <div className="flex flex-col gap-1.5"><StatusLine className="text-fg" />{formatHours(site.hours).map((l) => <span key={l} className="text-muted">{l}</span>)}</div></li>
        </ul>
      </Reveal>
      <Reveal delay={0.1} className="relative">
        <MapEmbed title={`${site.name} on Google Maps`} />
        {site.coordinates && <span className="tag absolute left-4 top-4 bg-bg/80 backdrop-blur">{site.coordinates}</span>}
      </Reveal>
    </section>
  );
}
