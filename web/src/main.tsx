import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/inter-tight/wght.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import './styles.css';
import { ContentProvider } from './content/ContentContext';
import { Layout } from './site/Layout';
import Home from './site/pages/Home';
// Home ships in the main bundle; other pages load on demand (and are prefetched once the page is idle).
const About = lazy(() => import('./site/pages/About'));
const Media = lazy(() => import('./site/pages/Media'));
const Faq = lazy(() => import('./site/pages/Faq'));
const Contact = lazy(() => import('./site/pages/Contact'));
const NotFound = lazy(() => import('./site/pages/NotFound'));
const page = (el: React.ReactNode) => <Suspense fallback={<div className="min-h-screen" />}>{el}</Suspense>;
if (typeof window !== 'undefined') {
  const prefetch = () => { void import('./site/pages/About'); void import('./site/pages/Media'); void import('./site/pages/Faq'); void import('./site/pages/Contact'); };
  window.addEventListener('load', () => (window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500)))(prefetch), { once: true });
}

const AdminApp = lazy(() => import('./admin/AdminApp'));

const router = createBrowserRouter([
  {
    path: '/admin/*',
    element: <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Loading…</div>}><AdminApp /></Suspense>,
  },
  {
    element: <ContentProvider fallback={<div className="min-h-screen bg-bg" />}><Layout /></ContentProvider>,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: page(<About />) },
      { path: 'media', element: page(<Media />) },
      { path: 'faq', element: page(<Faq />) },
      { path: 'contact', element: page(<Contact />) },
      { path: '*', element: page(<NotFound />) },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  </StrictMode>,
);
