import { useId } from 'react';

/** Slowly spinning circular text badge, e.g. "EST. 2022 · BUKIT KIARA ·". */
export function RingBadge({ text, className = '', children }: { text: string; className?: string; children?: React.ReactNode }) {
  const id = useId().replace(/:/g, '');
  if (!text.trim()) return null;
  const label = `${text.trim()} `.repeat(Math.max(1, Math.round(28 / text.length)));
  return (
    <div className={`relative grid aspect-square place-items-center rounded-full bg-accent text-on-accent ${className}`} aria-label={text.trim()} role="img">
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full" aria-hidden>
        <defs><path id={id} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
        <text className="mono" fontSize="15.5" fontWeight="600" letterSpacing="3.4" fill="currentColor">
          <textPath href={`#${id}`}>{label.toUpperCase()}</textPath>
        </text>
      </svg>
      <span aria-hidden className="relative">{children}</span>
    </div>
  );
}
