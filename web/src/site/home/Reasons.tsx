import { Bike, Clock, Heart, MapPin, ShieldCheck, Star, Wrench, Zap, type LucideIcon } from 'lucide-react';
import type { ReasonIcon } from '@faction/shared';
import { useSection } from '../../content/ContentContext';
import { DisplayText } from '../../content/DisplayText';
import { Reveal } from '../Reveal';
import { Eyebrow } from '../ui/Eyebrow';
import { Topo } from '../ui/Topo';

export const REASON_ICON_MAP: Record<ReasonIcon, LucideIcon> = { wrench: Wrench, clock: Clock, map: MapPin, shield: ShieldCheck, bike: Bike, zap: Zap, heart: Heart, star: Star };

export function Reasons() {
  const r = useSection('home.reasons');
  if (!r.items.length) return null;
  return (
    <section data-section="home.reasons" className="relative overflow-hidden border-y border-line bg-surface-2 py-24 sm:py-32">
      <Topo className="text-fg/[0.07]" seed={7} rings={18} />
      <div className="container-x relative grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <Reveal className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>{r.eyebrow}</Eyebrow>
          <h2 className="h2-xl"><DisplayText text={r.title} /></h2>
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2">
          {r.items.map((it, i) => {
            const Icon = REASON_ICON_MAP[it.icon];
            return (
              <Reveal as="li" key={i} delay={i * 0.08} className={`card flex flex-col gap-5 bg-bg/70 p-7 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1 ${i % 2 ? 'sm:translate-y-10' : ''}`}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-on-accent"><Icon className="h-6 w-6" /></span>
                <h3 className="h3 text-2xl">{it.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{it.text}</p>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
