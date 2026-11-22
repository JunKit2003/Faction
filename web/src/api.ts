import type { PublicContent } from '@faction/shared';

export async function fetchContent(): Promise<PublicContent> {
  const res = await fetch('/api/content', { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Content failed to load (${res.status})`);
  return res.json() as Promise<PublicContent>;
}

declare global {
  interface Window { __FACTION__?: PublicContent }
}
