import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MediaView, PublicContent, SectionData, SectionKey } from '@faction/shared';
import { fetchContent } from '../api';

const Ctx = createContext<PublicContent | null>(null);

/** Supplies site content. Pass `value` to render fixed content (admin preview, tests); otherwise it loads from the API. */
export function ContentProvider({ value, children, fallback = null }: { value?: PublicContent; children: ReactNode; fallback?: ReactNode }) {
  if (value) return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  return <LiveContent fallback={fallback}>{children}</LiveContent>;
}

// Plain fetch (no query library) keeps the public bundle small; the server usually inlines content anyway.
function LiveContent({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [data, setData] = useState<PublicContent | undefined>(() => (typeof window !== 'undefined' ? window.__FACTION__ : undefined));
  const [error, setError] = useState(false);
  useEffect(() => {
    if (data) return;
    let live = true;
    fetchContent().then((c) => { if (live) setData(c); }, () => { if (live) setError(true); });
    return () => { live = false; };
  }, [data]);
  if (error && !data) return <p role="alert" style={{ padding: 24 }}>Sorry, the site could not load. Please refresh.</p>;
  if (!data) return <>{fallback}</>;
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useContent(): PublicContent {
  const c = useContext(Ctx);
  if (!c) throw new Error('useContent outside ContentProvider');
  return c;
}

export function useSection<K extends SectionKey>(key: K): SectionData<K> {
  return useContent().sections[key];
}

export function useMedia(id: string | undefined): MediaView | undefined {
  const { media } = useContent();
  return id ? media[id] : undefined;
}
