import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import '@fontsource/anton/latin-400.css';
import '@fontsource-variable/inter/wght.css';
import './styles.css';
import { ContentProvider } from './content/ContentContext';
import { Layout } from './site/Layout';
import Home from './site/pages/Home';
import About from './site/pages/About';
import Media from './site/pages/Media';
import Faq from './site/pages/Faq';
import Contact from './site/pages/Contact';
import NotFound from './site/pages/NotFound';

const AdminApp = lazy(() => import('./admin/AdminApp'));

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });

const router = createBrowserRouter([
  {
    path: '/admin/*',
    element: <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Loading…</div>}><AdminApp /></Suspense>,
  },
  {
    element: <ContentProvider fallback={<div className="min-h-screen bg-bg" />}><Layout /></ContentProvider>,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'media', element: <Media /> },
      { path: 'faq', element: <Faq /> },
      { path: 'contact', element: <Contact /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
