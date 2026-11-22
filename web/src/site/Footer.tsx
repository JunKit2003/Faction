import { Link } from 'react-router';
import { useSection } from '../content/ContentContext';
import { Logo } from './Logo';
import { SocialLinks } from './SocialLinks';

const isInternal = (href: string) => href.startsWith('/') || href.startsWith('#');

export function Footer() {
  const f = useSection('footer');
  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface">
      <div className="container-x grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-5">
          <Logo className="h-10 w-auto self-start" />
          {f.tagline && <p className="max-w-xs font-display text-3xl uppercase leading-[0.95] text-fg">{f.tagline}</p>}
        </div>
        {f.columns.map((col, i) => (
          <div key={i}>
            <h2 className="eyebrow mb-4">{col.title}</h2>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((l, j) => (
                <li key={j}>
                  {isInternal(l.href)
                    ? <Link to={l.href} className="link-underline text-fg/80 hover:text-fg">{l.label}</Link>
                    : <a href={l.href} target="_blank" rel="noopener noreferrer" className="link-underline text-fg/80 hover:text-fg">{l.label}</a>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="eyebrow mb-4">{f.connectTitle}</h2>
          <SocialLinks />
        </div>
      </div>
      <div className="border-t border-line">
        <p className="container-x py-6 text-sm text-muted">© {new Date().getFullYear()} {f.copyright}</p>
      </div>
    </footer>
  );
}
