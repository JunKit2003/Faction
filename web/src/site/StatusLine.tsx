import { useEffect, useState } from 'react';
import { isOpenAt } from '@faction/shared';
import { useSection } from '../content/ContentContext';

export function useOpenNow() {
  const { hours } = useSection('site');
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  return isOpenAt(hours, now);
}

/** Mono status readout: "● OPEN NOW" / "● CLOSED, GONE RIDING" (labels editable in Site settings). */
export function StatusLine({ className = '' }: { className?: string }) {
  const { labels } = useSection('site');
  const open = useOpenNow();
  return (
    <p className={`mono inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] ${className}`}>
      <span className="relative flex h-2 w-2">
        {open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${open ? 'bg-accent' : 'bg-red-500'}`} />
      </span>
      {open ? labels.open : labels.closed}
    </p>
  );
}
