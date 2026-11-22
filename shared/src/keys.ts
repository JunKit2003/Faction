import type { AllSections } from './schemas';

export const MAP_EMBED_PREFIX = 'https://www.google.com/maps/embed?';
export const MAP_EMBED_MESSAGE = 'Paste the embed link from Google Maps → Share → Embed a map.';

export const SECTION_KEYS = ['site', 'nav', 'home.hero', 'home.services', 'home.stats', 'home.process', 'home.map', 'about', 'media', 'faq', 'contact', 'footer', 'seo'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const PAGE_PATHS = { home: '/', about: '/about', media: '/media', faq: '/faq', contact: '/contact' } as const;
export type SitePage = keyof typeof PAGE_PATHS;
export const SITE_PAGES = Object.keys(PAGE_PATHS) as SitePage[];
export function sitePageForPath(path: string): SitePage | null {
  const clean = path.replace(/\/+$/, '') || '/';
  return (SITE_PAGES.find((p) => PAGE_PATHS[p] === clean) ?? null);
}
export const SECTION_LABELS: Record<SectionKey, string> = {
  site: 'Site settings',
  nav: 'Navigation',
  'home.hero': 'Home: Hero',
  'home.services': 'Home: Services',
  'home.stats': 'Home: Stats',
  'home.process': 'Home: How it works',
  'home.map': 'Home: Map',
  about: 'About',
  media: 'Media gallery',
  faq: 'FAQ',
  contact: 'Contact',
  footer: 'Footer',
  seo: 'SEO',
};

export function isSectionKey(k: string): k is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(k);
}

/** Every non-empty string under a key ending in `Id`, `Ids` or named `mediaId`, at any depth. */
export function collectMediaIds(data: unknown): string[] {
  const out = new Set<string>();
  const walk = (v: unknown, key: string | null) => {
    const isIdKey = key !== null && /(Id|Ids)$/.test(key);
    if (typeof v === 'string') { if (isIdKey && v) out.add(v); return; }
    if (Array.isArray(v)) { for (const x of v) walk(x, isIdKey ? key : null); return; }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(data, null);
  return [...out];
}

/** Public shape of an image, resolved by the server. */
export interface MediaView {
  id: string;
  url: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
  mime: string;
}

export interface PublicContent {
  sections: AllSections;
  media: Record<string, MediaView>;
  version: string;
}
