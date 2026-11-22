import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useSection } from '../content/ContentContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { BackToTop } from './BackToTop';
import { SmoothScroll } from './SmoothScroll';

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
  useEffect(() => { document.documentElement.style.setProperty('--accent', accentColor); }, [accentColor]);
  return (
    <>
      <SmoothScroll />
      <ScrollManager />
      <TitleManager />
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          key={location.pathname}
          tabIndex={-1}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="outline-none"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      <BackToTop />
    </>
  );
}
