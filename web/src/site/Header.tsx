import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useSection } from '../content/ContentContext';
import { Logo } from './Logo';
import { StatusLine } from './StatusLine';

export function Header() {
  const nav = useSection('nav');
  const site = useSection('site');
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overHero = pathname === '/' && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const cta = nav.items[nav.ctaIndex];
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,color,border-color] duration-500 ${
      overHero ? 'border-b border-transparent text-[#eceee4]' : open ? 'bg-bg text-fg' : 'border-b border-line bg-bg/75 text-fg backdrop-blur-xl backdrop-saturate-150'}`}>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link to="/" aria-label="Home" className="relative z-10 shrink-0">
          {overHero ? <Logo force="onDark" className="h-8 w-auto" /> : <Logo className="h-8 w-auto" />}
        </Link>

        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.items.map((item, i) => i === nav.ctaIndex ? null : (
              <li key={i}>
                <NavLink to={item.path} end={item.path === '/'} className="mono relative block px-3.5 py-2 text-[11.5px] font-medium uppercase tracking-[0.16em]">
                  {({ isActive }) => (
                    <>
                      <span className={`relative z-10 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>{item.label}</span>
                      {isActive && <motion.span layoutId="nav-dot" className="absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {cta && <NavLink to={cta.path} className="btn btn-primary btn-sm hidden md:inline-flex">{cta.label}<ArrowUpRight className="h-4 w-4" /></NavLink>}
          <button ref={toggleRef} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu"
            className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-current/25 md:hidden" aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div id="mobile-menu" key="menu"
            initial={{ clipPath: 'circle(0% at 92% 4%)' }} animate={{ clipPath: 'circle(150% at 92% 4%)' }} exit={{ clipPath: 'circle(0% at 92% 4%)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 top-[72px] z-40 flex flex-col justify-between bg-bg px-6 pb-10 pt-6 md:hidden">
            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col">
                {nav.items.map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="border-b border-line">
                    <NavLink to={item.path} end={item.path === '/'} className={({ isActive }) => `flex items-baseline justify-between py-4 ${isActive ? 'text-accent-ink' : 'text-fg'}`}>
                      <span className="display text-[2.6rem]">{item.label}</span>
                      <span className="mono text-xs text-muted">0{i + 1}</span>
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-col gap-2">
              <StatusLine />
              <p className="mono text-[11px] uppercase tracking-[0.18em] text-muted">{site.coordinates}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
