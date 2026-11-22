import { z } from 'zod';
import { isSafeHref } from './richtext';
import { MAP_EMBED_MESSAGE, MAP_EMBED_PREFIX, REASON_ICONS, SECTION_KEYS, SITE_PAGES, type SectionKey, type SitePage } from './keys';


const req = (label = 'This field') => z.string().trim().min(1, `${label} is required`).max(5000);
const opt = z.string().max(5000);
const mediaId = z.string().min(1, 'Choose an image').max(26);
const optMediaId = z.string().max(26);
const href = z.string().trim().min(1, 'Link is required').refine(isSafeHref, 'Use a full https:// link, or a page path like /contact');
const httpUrl = z.string().trim().regex(/^https?:\/\/\S+$/i, 'Use a full https:// link');
const link = z.strictObject({ label: req('Label'), href });

const pagePath = z.enum(['/', '/about', '/media', '/faq', '/contact']);

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const daySchema = z
  .strictObject({ closed: z.boolean(), open: z.string(), close: z.string() })
  .superRefine((d, ctx) => {
    if (d.closed) return;
    if (!TIME.test(d.open)) ctx.addIssue({ code: 'custom', path: ['open'], message: 'Use 24-hour HH:MM, e.g. 11:00' });
    if (!TIME.test(d.close)) ctx.addIssue({ code: 'custom', path: ['close'], message: 'Use 24-hour HH:MM, e.g. 19:30' });
    else if (TIME.test(d.open) && d.open >= d.close) ctx.addIssue({ code: 'custom', path: ['close'], message: 'Closing time must be after opening time' });
  });

export const hoursSchema = z.strictObject({
  mon: daySchema, tue: daySchema, wed: daySchema, thu: daySchema, fri: daySchema, sat: daySchema, sun: daySchema,
});


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
    labels: z.strictObject({ hours: req('Label'), address: req('Label'), contact: req('Label'), open: req('Label'), closed: req('Label') }),
    coordinates: opt,
  }),
  nav: z.strictObject({
    items: z.array(z.strictObject({ label: req('Label'), path: pagePath })).min(1).max(8),
    ctaIndex: z.number().int().min(-1).max(7),
  }),
  'home.hero': z.strictObject({
    eyebrow: opt,
    title: req('Headline'),
    badgeTitle: opt,
    badgeText: opt,
    badgeImageIds: z.array(mediaId).max(12),
    text: req('Text'),
    primary: link,
    secondary: link,
    slideIds: z.array(mediaId).min(1, 'Add at least one hero image').max(20),
  }),
  'home.ticker': z.strictObject({
    items: z.array(req('Word')).max(20),
  }),
  'home.services': z.strictObject({
    eyebrow: opt,
    title: req('Title'),
    subtitle: opt,
    items: z.array(z.strictObject({ title: req('Title'), text: req('Text'), mediaId })).max(12),
  }),
  'home.stats': z.strictObject({
    items: z.array(z.strictObject({ value: z.string().max(40), label: req('Label'), kind: z.enum(['text', 'years']) })).max(8),
  }),
  'home.process': z.strictObject({
    eyebrow: opt,
    title: req('Title'),
    steps: z.array(z.strictObject({ title: req('Title'), text: req('Text') })).max(8),
  }),
  'home.reasons': z.strictObject({
    eyebrow: opt,
    title: req('Title'),
    items: z.array(z.strictObject({ icon: z.enum(REASON_ICONS), title: req('Title'), text: req('Text') })).max(6),
  }),
  'home.map': z.strictObject({ eyebrow: opt, title: req('Title'), subtitle: opt }),
  'home.closer': z.strictObject({ title: req('Title'), text: opt, buttonLabel: req('Button text'), href }),
  about: z.strictObject({
    eyebrow: opt,
    title: req('Title'),
    intro: opt,
    storyTitle: req('Title'),
    story: z.array(req('Paragraph')).max(12),
    imageId: mediaId,
    secondImageId: optMediaId,
    quote: opt,
    badge: opt,
    findTitle: req('Title'),
    findText: opt,
    contactLabel: req('Label'),
  }),
  media: z.strictObject({ eyebrow: opt, title: req('Title'), imageIds: z.array(mediaId).max(200) }),
  faq: z.strictObject({
    eyebrow: opt,
    title: req('Title'),
    intro: opt,
    askTitle: opt,
    askText: opt,
    askButton: opt,
    items: z.array(z.strictObject({ q: req('Question'), a: req('Answer') })).max(60),
  }),
  contact: z.strictObject({
    eyebrow: opt,
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

// Compile-time check that the schema list and the key list agree.
type SchemaKey = keyof typeof sectionSchemas;
const _keysMatch: [SchemaKey] extends [SectionKey] ? ([SectionKey] extends [SchemaKey] ? true : never) : never = true;
void _keysMatch;
void SECTION_KEYS;
export type SectionData<K extends SectionKey> = z.infer<(typeof sectionSchemas)[K]>;
export type AllSections = { [K in SectionKey]: SectionData<K> };

