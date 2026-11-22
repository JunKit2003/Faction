import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { formatHours } from '@faction/shared';
import { useSection } from '../content/ContentContext';
import { DisplayText } from '../content/DisplayText';
import { Logo } from './Logo';
import { SocialLinks } from './SocialLinks';
import { Magnetic } from './Magnetic';
import { StatusLine } from './StatusLine';
import { Topo } from './ui/Topo';

const isInternal = (href: string) => href.startsWith('/') || href.startsWith('#');
function A({ href, className, children, label }: { href: string; className?: string; children: React.ReactNode; label?: string }) {
  return isInternal(href)
    ? <Link to={href} className={className} aria-label={label}>{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>{children}</a>;
}

/** Site-wide closer ("GET DIALLED.") and footer. */
export function Footer() {
  const f = useSection('footer');
  const closer = useSection('home.closer');
  const site = useSection('site');
  return (
    <footer data-section="footer" className="relative isolate overflow-hidden border-t border-line bg-surface">
      <Topo className="-z-10 text-fg/[0.06]" seed={11} rings={20} />
      <section data-section="home.closer" aria-label="Get in touch" className="container-x flex flex-col gap-8 py-20 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-6">
          <StatusLine className="text-muted" />
          <p className="display text-[clamp(3.6rem,13vw,12rem)] leading-[0.82] text-fg"><DisplayText text={closer.title} /></p>
          {closer.text && <p className="lead max-w-xl">{closer.text}</p>}
        </div>
        <Magnetic strength={0.4}>
          <A href={closer.href} label={closer.buttonLabel}
            className="group grid h-40 w-40 shrink-0 place-items-center rounded-full bg-accent text-on-accent shadow-[0_30px_80px_-30px_var(--accent)] transition-transform duration-500 hover:scale-105 sm:h-48 sm:w-48">
            <span className="flex flex-col items-center gap-2">
              <ArrowUpRight className="h-12 w-12 transition-transform duration-500 group-hover:rotate-45" />
              <span className="mono text-[10.5px] font-semibold uppercase tracking-[0.16em]">{closer.buttonLabel}</span>
            </span>
          </A>
        </Magnetic>
      </section>

      <div className="container-x grid gap-12 border-t border-line py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="flex flex-col gap-5">
          <Logo className="h-9 w-auto self-start" />
          {f.tagline && <p className="max-w-xs text-sm leading-relaxed text-muted">{f.tagline}</p>}
          <SocialLinks />
        </div>
        {f.columns.map((col, i) => (
          <div key={i}>
            <h2 className="eyebrow mb-5">{col.title}</h2>
            <ul className="flex flex-col gap-2.5 text-sm">
              {col.links.map((l, j) => <li key={j}><A href={l.href} className="link-underline text-fg/80 hover:text-fg">{l.label}</A></li>)}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="eyebrow mb-5">{site.labels.address}</h2>
          <p className="text-sm leading-relaxed text-fg/80">{site.address}</p>
        </div>
        <div>
          <h2 className="eyebrow mb-5">{site.labels.hours}</h2>
          <ul className="flex flex-col gap-1.5 text-sm text-fg/80">{formatHours(site.hours).map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-wrap items-center justify-between gap-3 py-6">
          <p className="mono flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" />© {new Date().getFullYear()} {f.copyright}
          </p>
          <p className="mono text-[11px] uppercase tracking-[0.14em] text-muted">{f.connectTitle} · {site.coordinates}</p>
        </div>
      </div>
    </footer>
  );
}
