import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useSection } from '../content/ContentContext';
import { Logo } from './Logo';

export function Header() {
  const nav = useSection('nav');
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,color] duration-500 ${
        overHero ? 'text-white' : open ? 'bg-bg text-fg' : 'border-b border-line bg-bg/70 text-fg shadow-[0_10px_40px_-20px_rgb(0_0_0/.5)] backdrop-blur-xl backdrop-saturate-150'
      }`}
    >
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link to="/" aria-label="Home" className="relative z-10 shrink-0">
          {overHero ? <Logo force="onDark" className="h-9 w-auto" /> : <Logo className="h-9 w-auto" />}
        </Link>

        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.items.map((item, i) => i === nav.ctaIndex ? (
              <li key={i} className="ml-3">
                <NavLink to={item.path} className="btn btn-primary btn-sm">{item.label}</NavLink>
              </li>
            ) : (
              <li key={i}>
                <NavLink to={item.path} end={item.path === '/'} className="relative block px-4 py-2 text-sm font-medium">
                  {({ isActive }) => (
                    <>
                      <span className={`relative z-10 transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}>{item.label}</span>
                      {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button ref={toggleRef} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu"
          className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-current/20 md:hidden" aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div id="mobile-menu" key="menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 top-[72px] z-40 flex flex-col bg-bg px-6 pb-10 pt-6 md:hidden">
            <nav aria-label="Mobile navigation" className="flex-1">
              <ul className="flex flex-col">
                {nav.items.map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-line">
                    <NavLink to={item.path} end={item.path === '/'} className={({ isActive }) => `flex items-center justify-between py-5 font-display text-5xl uppercase ${isActive ? 'text-accent-ink' : 'text-fg'}`}>
                      {item.label}
                      <span className="font-sans text-sm text-muted">0{i + 1}</span>
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
