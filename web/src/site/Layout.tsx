import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useSection } from '../content/ContentContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackToTop } from './BackToTop';
import { SmoothScroll } from './SmoothScroll';
import { useAfterFirstPaint } from '../content/useAfterFirstPaint';

/** Scroll to top on page change, or to #hash targets (e.g. /contact#booking). */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' }), 80);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/** Keeps the browser tab title in step with the admin-edited SEO titles during client-side navigation. */
function TitleManager() {
  const { pathname } = useLocation();
  const seo = useSection('seo');
  const site = useSection('site');
  useEffect(() => {
    const key = ({ '/': 'home', '/about': 'about', '/media': 'media', '/faq': 'faq', '/contact': 'contact' } as const)[pathname as '/'];
    document.title = key ? seo.pages[key].title : `Page not found | ${site.name}`;
  }, [pathname, seo, site.name]);
  return null;
}

export function Layout() {
  const location = useLocation();
  const { accentColor } = useSection('site');
  const painted = useAfterFirstPaint();
  useEffect(() => { document.documentElement.style.setProperty('--accent', accentColor); }, [accentColor]);
  return (
    <>
      <SmoothScroll />
      <ScrollManager />
      <TitleManager />
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main id="main" key={location.pathname} tabIndex={-1} className="outline-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.25 } }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {/* Lime curtain that sweeps across on page change (not on first load). */}
      <AnimatePresence initial={false}>
        <motion.div key={location.pathname} aria-hidden className="pointer-events-none fixed inset-0 z-[90] origin-bottom bg-accent"
          initial={{ scaleY: 1 }} animate={{ scaleY: 0, transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1], delay: 0.1 } }}
          exit={{ scaleY: 0 }} style={{ transformOrigin: 'top' }} />
      </AnimatePresence>
      {painted && <Footer />}
      {painted && <BackToTop />}
    </>
  );
}
