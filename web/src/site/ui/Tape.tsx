/** Tilted tape ticker. `tone="lime"` is the loud one; `tone="ink"` sits behind with outlined words. */
export function Tape({ words, tone = 'lime', direction = 'left', className = '' }: { words: string[]; tone?: 'lime' | 'ink'; direction?: 'left' | 'right'; className?: string }) {
  if (!words.length) return null;
  const list = Array.from({ length: Math.max(2, Math.ceil(10 / words.length)) }, () => words).flat();
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className={`flex shrink-0 items-center gap-8 pr-8 ${direction === 'left' ? 'marquee-left' : 'marquee-right'}`}>
      {list.map((w, i) => (
        <li key={i} className="flex items-center gap-8 whitespace-nowrap">
          <span className={`display text-3xl sm:text-5xl ${tone === 'ink' ? 'text-outline' : ''}`}>{w}</span>
          <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0 sm:h-8 sm:w-8"><path fill="currentColor" d="M12 2l2.2 6.6L21 9l-5.4 4.2L17.6 20 12 16.2 6.4 20l2-6.8L3 9l6.8-.4z" /></svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`flex overflow-hidden py-4 sm:py-5 ${tone === 'lime' ? 'bg-accent text-on-accent [--stroke:var(--on-accent)]' : 'border-y border-line bg-bg text-fg/60'} ${className}`}>
      {row(false)}
      {row(true)}
    </div>
  );
}
