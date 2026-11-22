import { Fragment } from 'react';
import { Link } from 'react-router';
import { parseRich } from '@faction/shared';

/** Renders the tiny inline markup admins can use: **bold** and [label](href). Never renders HTML. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const tokens = parseRich(text);
  return (
    <span className={className}>
      {tokens.map((t, i) => {
        if (t.type === 'bold') return <strong key={i} className="font-semibold text-fg">{t.text}</strong>;
        if (t.type === 'link') {
          const internal = t.href.startsWith('/') || t.href.startsWith('#');
          return internal
            ? <Link key={i} to={t.href} className="link-underline text-accent-ink">{t.text}</Link>
            : <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" className="link-underline text-accent-ink">{t.text}</a>;
        }
        return <Fragment key={i}>{t.text}</Fragment>;
      })}
    </span>
  );
}
