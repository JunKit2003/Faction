import { useEffect, useState } from 'react';
import { isOpenAt } from '@faction/shared';
import { useSection } from '../content/ContentContext';

/** "Open now" / "Closed", from the shop hours in Kuala Lumpur time. Re-checks every minute. */
export function OpenBadge({ className = '' }: { className?: string }) {
  const { hours } = useSection('site');
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const open = isOpenAt(hours, now);
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold normal-case tracking-normal ${open ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300' : 'border-line bg-fg/5 text-muted'} ${className}`}>
      <span className="relative flex h-2 w-2">
        {open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${open ? 'bg-emerald-400' : 'bg-muted'}`} />
      </span>
      {open ? 'Open now' : 'Closed'}
    </span>
  );
}
