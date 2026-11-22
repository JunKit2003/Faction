import { useSection } from '../../content/ContentContext';
import { MapEmbed } from '../MapEmbed';
import { Reveal } from '../Reveal';

export function MapBlock() {
  const m = useSection('home.map');
  const { name } = useSection('site');
  return (
    <section aria-labelledby="reviews-title" className="container-x pb-24 sm:pb-32">
      <Reveal className="mb-10 flex flex-col gap-4">
        <h2 id="reviews-title" className="h2-xl">{m.title}</h2>
        {m.subtitle && <p className="lead">{m.subtitle}</p>}
      </Reveal>
      <Reveal><MapEmbed title={`${name} on Google Maps`} /></Reveal>
    </section>
  );
}
