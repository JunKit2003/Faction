import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes, useParams } from 'react-router';
import { isSectionKey } from '@faction/shared';
import { useMe } from './auth';
import { Login } from './Login';
import { Shell } from './Shell';
import { PageEditor } from './pages/PageEditor';
import { Dashboard } from './pages/Dashboard';
import { ADMIN_PAGES, findTabForSection } from './structure';
import { ToastProvider } from './Toast';
import { MediaLibrary } from './pages/MediaLibrary';
import { Admins } from './pages/Admins';
import { Audit } from './pages/Audit';
import { Account } from './pages/Account';

const PreviewHost = lazy(() => import('./PreviewHost'));

/** Blue admin theme on <body> so dialogs, toasts and the jump-to search (portalled to body) match. Not used in the preview iframe. */
function AdminTheme() {
  useEffect(() => {
    document.body.classList.add('admin-theme');
    return () => document.body.classList.remove('admin-theme');
  }, []);
  return null;
}

/** Old links (/admin/sections/:key) go to the page and tab that now holds that section. */
function SectionRedirect() {
  const { key = '' } = useParams();
  const where = isSectionKey(key) ? findTabForSection(key) : null;
  return <Navigate to={where ? `/admin/${where.page}/${where.tab}` : '/admin'} replace />;
}

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });

/** The query library lives with the admin only, so the public site doesn't download it. */
export default function AdminApp() {
  return <QueryClientProvider client={queryClient}><AdminRoutes /></QueryClientProvider>;
}

function AdminRoutes() {
  const me = useMe();
  const qc = useQueryClient();
  useEffect(() => {
    const h = () => qc.setQueryData(['me'], null);
    window.addEventListener('faction:signed-out', h);
    return () => window.removeEventListener('faction:signed-out', h);
  }, [qc]);
  return (
    <Routes>
      <Route path="__preview" element={<Suspense fallback={null}><PreviewHost /></Suspense>} />
      <Route path="*" element={<><AdminTheme />{
        me.isLoading ? <div className="grid min-h-screen place-items-center text-muted">Loading…</div>
          : !me.data ? <Login />
          : (
            <ToastProvider>
            <Shell me={me.data}>
              <Routes>
                <Route index element={<Dashboard me={me.data} />} />
                {ADMIN_PAGES.map((p) => <Route key={p.id} path={`${p.id}/:tab?`} element={<PageEditor key={p.id} pageId={p.id} />} />)}
                <Route path="sections/:key" element={<SectionRedirect />} />
                <Route path="photos" element={<MediaLibrary />} />
                <Route path="media" element={<Navigate to="/admin/photos" replace />} />
                <Route path="admins" element={<Admins me={me.data} />} />
                <Route path="activity" element={<Audit />} />
                <Route path="audit" element={<Navigate to="/admin/activity" replace />} />
                <Route path="account" element={<Account />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Shell>
            </ToastProvider>
          )
      }</>} />
    </Routes>
  );
}
