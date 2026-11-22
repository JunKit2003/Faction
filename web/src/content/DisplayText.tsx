import { Fragment } from 'react';
import { parseDisplay } from '@faction/shared';

/** Headline text with _outlined_ and *lime* accent words (see admin hint). */
/** accent: 'text' = lime words, 'mark' = lime highlighter, 'outline' = outlined words (for use on lime backgrounds). */
export function DisplayText({ text, accent = 'text' }: { text: string; accent?: 'text' | 'mark' | 'outline' }) {
  return (
    <>
      {parseDisplay(text).map((t, i) => {
        if (t.type === 'outline') return <span key={i} className="text-outline">{t.text}</span>;
        if (t.type === 'accent') {
          if (accent === 'mark') return <mark key={i} data-accent className="mark-accent">{t.text}</mark>;
          if (accent === 'outline') return <span key={i} data-accent className="text-outline">{t.text}</span>;
          return <span key={i} data-accent className="text-accent-ink">{t.text}</span>;
        }
        return <Fragment key={i}>{t.text}</Fragment>;
      })}
    </>
  );
}
