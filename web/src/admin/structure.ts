import type { SectionKey, SitePage } from '@faction/shared';
import type { Field } from './form/fields';
import { SECTION_DEFS } from './sections/defs';

/** One titled card in the editor: a handful of fields from one section. */
export interface CardDef { title: string; description?: string; section: SectionKey; fields: string[] }
export interface TabDef { id: string; label: string; preview: SitePage | 'seo' | null; focus?: string; cards: CardDef[] }
export interface PageDef { id: string; label: string; description: string; tabs: TabDef[] }

const card = (section: SectionKey, title: string, fields: string[], description?: string): CardDef => ({ section, title, fields, description });

/**
 * The admin, organised by task rather than by page section.
 * Every field of every content section appears in exactly one card (enforced by a test).
 */
export const ADMIN_PAGES: PageDef[] = [
  {
    id: 'shop', label: 'Shop details', description: 'Name, address, hours, map, logos and social links. Used all over the site.',
    tabs: [
      { id: 'basics', label: 'Basics', preview: 'contact', cards: [
        card('site', 'Identity', ['name', 'openedYear'], 'Your shop name and the year you opened (used for “years in business”).'),
        card('site', 'Where you are', ['address', 'coordinates']),
        card('site', 'WhatsApp', ['whatsappNumber'], 'Messages from the contact form and every “Ask the mechanic” button go here.'),
      ] },
      { id: 'hours', label: 'Opening hours', preview: 'contact', cards: [
        card('site', 'Opening hours', ['hours'], 'Shown on Home, About, Contact, the footer and in the FAQ. The open/closed status uses Kuala Lumpur time.'),
      ] },
      { id: 'map', label: 'Map', preview: 'contact', cards: [
        card('site', 'Google map', ['mapEmbedUrl'], 'The map on the Home and Contact pages.'),
      ] },
      { id: 'branding', label: 'Branding', preview: 'home', cards: [
        card('site', 'Logos', ['logoOnLightId', 'logoOnDarkId', 'faviconId'], 'Keep logos black and white. The tab icon should stay the plain logo mark.'),
        card('site', 'Accent colour', ['accentColor'], 'Used for buttons, highlights and the ticker.'),
      ] },
      { id: 'social', label: 'Social links', preview: 'home', cards: [card('site', 'Social links', ['socials'])] },
      { id: 'labels', label: 'Labels', preview: 'home', cards: [card('site', 'Small words', ['labels'], 'Status words and the headings next to hours, address and contact.')] },
    ],
  },
  {
    id: 'homepage', label: 'Homepage', description: 'Everything on the home page, top to bottom.',
    tabs: [
      { id: 'hero', label: 'Top banner', preview: 'home', focus: 'home.hero', cards: [
        card('home.hero', 'Headline', ['eyebrow', 'title', 'text']),
        card('home.hero', 'Buttons', ['primary', 'secondary']),
        card('home.hero', 'Photos', ['slideIds'], 'They fade from one to the next. The first one loads first.'),
        card('home.hero', 'Floating card', ['badgeTitle', 'badgeText', 'badgeImageIds'], 'The small photo card beside the headline on big screens.'),
      ] },
      { id: 'ticker', label: 'Ticker', preview: 'home', focus: 'home.services', cards: [card('home.ticker', 'Ticker words', ['items'], 'The scrolling lime tape under the banner. Empty uses your service names.')] },
      { id: 'services', label: 'Services', preview: 'home', focus: 'home.services', cards: [
        card('home.services', 'Heading', ['eyebrow', 'title', 'subtitle']),
        card('home.services', 'Services', ['items'], 'The first one gets the big tile.'),
      ] },
      { id: 'stats', label: 'Numbers', preview: 'home', focus: 'home.stats', cards: [card('home.stats', 'Numbers', ['items'], 'Numbers count up when they scroll into view.')] },
      { id: 'process', label: 'How it works', preview: 'home', focus: 'home.process', cards: [
        card('home.process', 'Heading', ['eyebrow', 'title']),
        card('home.process', 'Steps', ['steps']),
      ] },
      { id: 'reasons', label: 'Why us', preview: 'home', focus: 'home.reasons', cards: [
        card('home.reasons', 'Heading', ['eyebrow', 'title']),
        card('home.reasons', 'Reasons', ['items']),
      ] },
      { id: 'visit', label: 'Visit us', preview: 'home', focus: 'home.map', cards: [card('home.map', 'Visit block', ['eyebrow', 'title', 'subtitle'], 'Address, WhatsApp, hours and map come from Shop details.')] },
      { id: 'closer', label: 'Closing banner', preview: 'home', focus: 'footer', cards: [card('home.closer', 'The big “Get dialled.” banner', ['title', 'text', 'buttonLabel', 'href'], 'Shown at the bottom of every page.')] },
    ],
  },
  {
    id: 'pages', label: 'Pages', description: 'About, Media, FAQ and Contact.',
    tabs: [
      { id: 'about', label: 'About', preview: 'about', cards: [
        card('about', 'Heading', ['eyebrow', 'title', 'intro']),
        card('about', 'Our story', ['storyTitle', 'story']),
        card('about', 'Photos', ['imageId', 'secondImageId', 'badge']),
        card('about', 'Big quote', ['quote']),
        card('about', 'Where to find us', ['findTitle', 'findText', 'contactLabel']),
      ] },
      { id: 'media', label: 'Media gallery', preview: 'media', cards: [
        card('media', 'Heading', ['eyebrow', 'title']),
        card('media', 'Gallery', ['imageIds'], 'Captions come from each photo’s description in Photos.'),
      ] },
      { id: 'faq', label: 'FAQ', preview: 'faq', cards: [
        card('faq', 'Heading', ['eyebrow', 'title', 'intro']),
        card('faq', 'Questions', ['items']),
        card('faq', '“Ask the mechanic” card', ['askTitle', 'askText', 'askButton']),
      ] },
      { id: 'contact', label: 'Contact', preview: 'contact', cards: [
        card('contact', 'Heading', ['eyebrow', 'title', 'intro', 'getInTouchTitle']),
        card('contact', 'Message form', ['formTitle', 'nameLabel', 'namePlaceholder', 'messageLabel', 'messagePlaceholder', 'submitLabel', 'whatsappHeader'], 'The form opens WhatsApp with the message filled in.'),
      ] },
    ],
  },
  {
    id: 'navigation', label: 'Menu & footer', description: 'The top menu and the footer links.',
    tabs: [
      { id: 'menu', label: 'Top menu', preview: 'home', cards: [card('nav', 'Menu links', ['items', 'ctaIndex'])] },
      { id: 'footer', label: 'Footer', preview: 'home', focus: 'footer', cards: [
        card('footer', 'Footer text', ['tagline', 'connectTitle', 'copyright']),
        card('footer', 'Link columns', ['columns']),
      ] },
    ],
  },
  {
    id: 'seo', label: 'Search & sharing', description: 'How each page looks in Google and when shared on WhatsApp or Facebook.',
    tabs: [
      { id: 'google', label: 'Google', preview: 'seo', cards: [card('seo', 'Page titles and descriptions', ['pages'])] },
      { id: 'share', label: 'Share image', preview: 'seo', cards: [card('seo', 'Share image', ['ogImageId'])] },
    ],
  },
];

export function fieldsForCard(c: CardDef): Field[] {
  const defs = SECTION_DEFS[c.section].fields;
  return c.fields.map((name) => {
    const f = defs.find((d) => d.name === name);
    if (!f) throw new Error(`No editor for ${c.section}.${name}`);
    return f;
  });
}

export const sectionsInPage = (p: PageDef): SectionKey[] => [...new Set(p.tabs.flatMap((t) => t.cards.map((c) => c.section)))];
export const sectionsInTab = (t: TabDef): SectionKey[] => [...new Set(t.cards.map((c) => c.section))];

export function findTabForSection(key: SectionKey): { page: string; tab: string } | null {
  for (const p of ADMIN_PAGES) for (const t of p.tabs) if (t.cards.some((c) => c.section === key)) return { page: p.id, tab: t.id };
  return null;
}
