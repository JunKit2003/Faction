import { useSection } from '../../content/ContentContext';
import { Tape } from '../ui/Tape';

/** Two crossing tapes: a loud lime one over a quiet outlined one. */
export function Ticker() {
  const { items } = useSection('home.ticker');
  const services = useSection('home.services').items.map((s) => s.title);
  const words = items.length ? items : services;
  if (!words.length) return null;
  return (
    <section aria-label="What we work on" className="relative z-10 -mt-10 h-[150px] overflow-hidden sm:h-[190px]">
      <Tape words={[...words].reverse()} tone="ink" direction="right" className="absolute inset-x-[-5%] top-[38%] rotate-[2deg]" />
      <Tape words={words} tone="lime" className="absolute inset-x-[-5%] top-[22%] -rotate-[2.5deg] shadow-[0_20px_60px_-20px_rgb(0_0_0/.6)]" />
    </section>
  );
}
