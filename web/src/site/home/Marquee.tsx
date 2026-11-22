import { useSection } from '../../content/ContentContext';

/** Endless ticker of the service names (reuses existing content, adds none). */
export function Marquee() {
  const { items } = useSection('home.services');
  if (!items.length) return null;
  const words = Array.from({ length: Math.max(2, Math.ceil(8 / items.length)) }, () => items.map((s) => s.title)).flat();
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="marquee-track flex shrink-0 items-center gap-10 pr-10">
      {words.map((w, i) => (
        <li key={i} className="flex items-center gap-10 whitespace-nowrap font-display text-4xl uppercase sm:text-6xl">
          <span className={i % 2 ? 'text-stroke' : ''}>{w}</span>
          <span className="text-accent-ink">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="relative flex overflow-hidden border-b border-line bg-bg py-6 text-fg sm:py-8" aria-label="Services">
      {row(false)}
      {row(true)}
    </div>
  );
}
