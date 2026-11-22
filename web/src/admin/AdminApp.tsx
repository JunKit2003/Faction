import { lazy, Suspense, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes, useParams } from 'react-router';
import { isSectionKey } from '@faction/shared';
import { useMe } from './auth';
import { Login } from './Login';
import { Shell } from './Shell';
import { SectionEditor } from './pages/SectionEditor';
import { MediaLibrary } from './pages/MediaLibrary';
import { Admins } from './pages/Admins';
import { Audit } from './pages/Audit';
import { Account } from './pages/Account';

const PreviewHost = lazy(() => import('./PreviewHost'));

function SectionRoute() {
  const { key = '' } = useParams();
  if (!isSectionKey(key)) return <Navigate to="/admin/sections/site" replace />;
  return <SectionEditor key={key} sectionKey={key} />;
}

export default function AdminApp() {
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
      <Route path="*" element={
        me.isLoading ? <div className="grid min-h-screen place-items-center text-muted">Loading…</div>
          : !me.data ? <Login />
          : (
            <Shell me={me.data}>
              <Routes>
                <Route index element={<Navigate to="sections/site" replace />} />
                <Route path="sections/:key" element={<SectionRoute />} />
                <Route path="media" element={<MediaLibrary />} />
                <Route path="admins" element={<Admins me={me.data} />} />
                <Route path="audit" element={<Audit />} />
                <Route path="account" element={<Account />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Shell>
          )
      } />
    </Routes>
  );
}
