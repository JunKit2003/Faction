import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MediaView, PublicContent, SectionData, SectionKey } from '@faction/shared';
import { fetchContent } from '../api';

const Ctx = createContext<PublicContent | null>(null);

/** Supplies site content. Pass `value` to render fixed content (admin preview, tests); otherwise it loads from the API. */
export function ContentProvider({ value, children, fallback = null }: { value?: PublicContent; children: ReactNode; fallback?: ReactNode }) {
  if (value) return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  return <LiveContent fallback={fallback}>{children}</LiveContent>;
}

function LiveContent({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const initial = typeof window !== 'undefined' ? window.__FACTION__ : undefined;
  const { data, error } = useQuery({
    queryKey: ['content'],
    queryFn: fetchContent,
    initialData: initial,
    staleTime: initial ? 60_000 : 0,
  });
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
