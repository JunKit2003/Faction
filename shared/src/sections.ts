import { z } from 'zod';
import { hoursSchema } from './hours';
import { isSafeHref } from './richtext';

export const MAP_EMBED_PREFIX = 'https://www.google.com/maps/embed?';
export const MAP_EMBED_MESSAGE = 'Paste the embed link from Google Maps → Share → Embed a map.';

const req = (label = 'This field') => z.string().trim().min(1, `${label} is required`).max(5000);
const opt = z.string().max(5000);
const mediaId = z.string().min(1, 'Choose an image').max(26);
const optMediaId = z.string().max(26);
const href = z.string().trim().min(1, 'Link is required').refine(isSafeHref, 'Use a full https:// link, or a page path like /contact');
const httpUrl = z.string().trim().regex(/^https?:\/\/\S+$/i, 'Use a full https:// link');
const link = z.strictObject({ label: req('Label'), href });

export const PAGE_PATHS = { home: '/', about: '/about', media: '/media', faq: '/faq', contact: '/contact' } as const;
export type SitePage = keyof typeof PAGE_PATHS;
export const SITE_PAGES = Object.keys(PAGE_PATHS) as SitePage[];
export function sitePageForPath(path: string): SitePage | null {
  const clean = path.replace(/\/+$/, '') || '/';
  return (SITE_PAGES.find((p) => PAGE_PATHS[p] === clean) ?? null);
}
const pagePath = z.enum(['/', '/about', '/media', '/faq', '/contact']);

export const sectionSchemas = {
  site: z.strictObject({
    name: req('Shop name'),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #38bdf8'),
    logoOnLightId: mediaId,
    logoOnDarkId: mediaId,
    faviconId: mediaId,
    openedYear: z.number().int().min(1950).max(2100),
    whatsappNumber: z.string().regex(/^\d{8,15}$/, 'Digits only, with country code, e.g. 601133321767'),
    address: req('Address'),
    hours: hoursSchema,
    mapEmbedUrl: z.string().trim().refine((u) => u.startsWith(MAP_EMBED_PREFIX) && !/[\s"'<>]/.test(u), MAP_EMBED_MESSAGE),
    socials: z.array(z.strictObject({ platform: z.enum(['instagram', 'facebook', 'whatsapp']), url: httpUrl })).max(10),
    labels: z.strictObject({ hours: req('Label'), address: req('Label'), contact: req('Label') }),
  }),
  nav: z.strictObject({
    items: z.array(z.strictObject({ label: req('Label'), path: pagePath })).min(1).max(8),
    ctaIndex: z.number().int().min(-1).max(7),
  }),
  'home.hero': z.strictObject({
    title: req('Headline'),
    text: req('Text'),
    primary: link,
    secondary: link,
    slideIds: z.array(mediaId).min(1, 'Add at least one hero image').max(20),
  }),
  'home.services': z.strictObject({
    title: req('Title'),
    subtitle: opt,
    items: z.array(z.strictObject({ title: req('Title'), text: req('Text'), mediaId })).max(12),
  }),
  'home.stats': z.strictObject({
    items: z.array(z.strictObject({ value: z.string().max(40), label: req('Label'), kind: z.enum(['text', 'years']) })).max(8),
  }),
  'home.process': z.strictObject({
    title: req('Title'),
    steps: z.array(z.strictObject({ title: req('Title'), text: req('Text') })).max(8),
  }),
  'home.map': z.strictObject({ title: req('Title'), subtitle: opt }),
  about: z.strictObject({
    title: req('Title'),
    intro: opt,
    storyTitle: req('Title'),
    story: z.array(req('Paragraph')).max(12),
    imageId: mediaId,
    findTitle: req('Title'),
    findText: opt,
    contactLabel: req('Label'),
  }),
  media: z.strictObject({ title: req('Title'), imageIds: z.array(mediaId).max(200) }),
  faq: z.strictObject({
    title: req('Title'),
    intro: opt,
    items: z.array(z.strictObject({ q: req('Question'), a: req('Answer') })).max(60),
  }),
  contact: z.strictObject({
    title: req('Title'),
    intro: opt,
    getInTouchTitle: req('Title'),
    formTitle: req('Title'),
    nameLabel: req('Label'),
    namePlaceholder: opt,
    messageLabel: req('Label'),
    messagePlaceholder: opt,
    submitLabel: req('Label'),
    whatsappHeader: req('Message header'),
  }),
  footer: z.strictObject({
    tagline: opt,
    columns: z.array(z.strictObject({ title: req('Title'), links: z.array(link).max(10) })).max(4),
    connectTitle: req('Title'),
    copyright: req('Copyright'),
  }),
  seo: z.strictObject({
    pages: z.strictObject(Object.fromEntries(SITE_PAGES.map((p) => [p, z.strictObject({ title: req('Title').max(70, 'Keep titles under 70 characters'), description: req('Description').max(170, 'Keep descriptions under 170 characters') })])) as Record<SitePage, z.ZodObject<{ title: z.ZodString; description: z.ZodString }>>),
    ogImageId: optMediaId,
  }),
} as const;

export type SectionKey = keyof typeof sectionSchemas;
export const SECTION_KEYS = Object.keys(sectionSchemas) as SectionKey[];
export type SectionData<K extends SectionKey> = z.infer<(typeof sectionSchemas)[K]>;
export type AllSections = { [K in SectionKey]: SectionData<K> };

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
  return Object.prototype.hasOwnProperty.call(sectionSchemas, k);
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
