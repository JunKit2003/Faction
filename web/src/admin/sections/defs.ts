import type { SectionKey, SitePage } from '@faction/shared';
import type { Field, Option } from '../form/fields';

export const DISPLAY_HINT = 'Big headline. Wrap words in _underscores_ to outline them, or *stars* to make them lime.';
const eyebrow = (hint = 'Small label above the title.'): Field => ({ name: 'eyebrow', label: 'Small label', kind: 'text', hint });
const display = (name: string, label: string): Field => ({ name, label, kind: 'text', hint: DISPLAY_HINT });

const PAGES: Option[] = [
  { value: '/', label: 'Home' }, { value: '/about', label: 'About' }, { value: '/media', label: 'Media' }, { value: '/faq', label: 'FAQ' }, { value: '/contact', label: 'Contact' },
];
const link = (name: string, label: string): Field => ({
  name, label, kind: 'group', fields: [
    { name: 'label', label: 'Button text', kind: 'text' },
    { name: 'href', label: 'Goes to', kind: 'text', hint: 'A page like /contact or /contact#booking, or a full https:// link.' },
  ],
});
const seoPage = (p: SitePage, label: string): Field => ({
  name: p, label, kind: 'group', fields: [
    { name: 'title', label: 'Title in Google and browser tab', kind: 'text', hint: 'Under 70 characters.' },
    { name: 'description', label: 'Description in Google', kind: 'textarea', hint: 'Under 170 characters.' },
  ],
});

export interface SectionDef { fields: Field[]; preview: SitePage | 'seo' | null; help?: string }

export const SECTION_DEFS: Record<SectionKey, SectionDef> = {
  site: {
    preview: 'contact',
    help: 'Shop details used across the whole site.',
    fields: [
      { name: 'name', label: 'Shop name', kind: 'text' },
      { name: 'address', label: 'Address', kind: 'textarea' },
      { name: 'hours', label: 'Opening hours', kind: 'hours' },
      { name: 'whatsappNumber', label: 'WhatsApp number', kind: 'text', hint: 'Digits only with country code, e.g. 601133321767. The contact form sends messages here.' },
      { name: 'mapEmbedUrl', label: 'Google Maps embed link', kind: 'url', hint: 'Google Maps → Share → Embed a map → copy only the link inside src="…".' },
      { name: 'openedYear', label: 'Year the shop opened', kind: 'number', min: 1950, max: 2100, hint: 'Used for “Years in Business”.' },
      { name: 'accentColor', label: 'Accent colour', kind: 'color', hint: 'Buttons and highlights. Hex, e.g. #38bdf8.' },
      { name: 'logoOnLightId', label: 'Logo for light backgrounds', kind: 'media', purpose: 'logo', hint: 'Usually the black logo.' },
      { name: 'logoOnDarkId', label: 'Logo for dark backgrounds', kind: 'media', purpose: 'logo', hint: 'Usually the white logo.' },
      { name: 'faviconId', label: 'Browser tab icon', kind: 'media', purpose: 'logo', hint: 'Square image works best.' },
      {
        name: 'socials', label: 'Social links', kind: 'list', itemLabel: 'Link', newItem: { platform: 'instagram', url: 'https://' },
        fields: [
          { name: 'platform', label: 'Platform', kind: 'select', options: [{ value: 'instagram', label: 'Instagram' }, { value: 'facebook', label: 'Facebook' }, { value: 'whatsapp', label: 'WhatsApp' }] },
          { name: 'url', label: 'Link', kind: 'url' },
        ],
      },
      {
        name: 'labels', label: 'Labels', kind: 'group', hint: 'Small words used around the site.',
        fields: [
          { name: 'open', label: 'When open', kind: 'text', hint: 'Shown with a green dot during opening hours.' },
          { name: 'closed', label: 'When closed', kind: 'text', hint: 'Shown with a red dot outside opening hours.' },
          { name: 'hours', label: 'Hours heading', kind: 'text' },
          { name: 'address', label: 'Address heading', kind: 'text' },
          { name: 'contact', label: 'Contact heading', kind: 'text' },
        ],
      },
      { name: 'coordinates', label: 'Map coordinates', kind: 'text', hint: 'Shown as a small readout, e.g. 3.1434° N, 101.6324° E. Leave empty to hide.' },
    ],
  },
  nav: {
    preview: 'home',
    fields: [
      { name: 'items', label: 'Menu links', kind: 'list', itemLabel: 'Link', newItem: { label: 'New link', path: '/' }, fields: [
        { name: 'label', label: 'Text', kind: 'text' },
        { name: 'path', label: 'Page', kind: 'select', options: PAGES },
      ] },
      {
        name: 'ctaIndex', label: 'Highlighted button', kind: 'select', numeric: true,
        hint: 'Which menu link is shown as a button.',
        options: (root) => [{ value: '-1', label: 'None' }, ...(((root as { items?: { label: string }[] })?.items ?? []).map((it, i) => ({ value: String(i), label: it.label || `Link ${i + 1}` })))],
      },
    ],
  },
  'home.hero': {
    preview: 'home',
    fields: [
      eyebrow('Small label above the headline.'),
      display('title', 'Headline'),
      { name: 'text', label: 'Text', kind: 'textarea' },
      { name: 'badgeTitle', label: 'Floating card title', kind: 'text', hint: 'The small card beside the headline on big screens. Leave the title, text and photos empty to hide it.' },
      { name: 'badgeText', label: 'Floating card text', kind: 'text' },
      { name: 'badgeImageIds', label: 'Floating card photos', kind: 'mediaList', hint: 'Its own photos, separate from the banner. They take turns. Leave empty for a text-only card.' },
      link('primary', 'Main button'),
      link('secondary', 'Second button'),
      { name: 'slideIds', label: 'Background images', kind: 'mediaList', hint: 'They fade from one to the next. The first loads first.' },
    ],
  },
  'home.ticker': {
    preview: 'home',
    fields: [{ name: 'items', label: 'Ticker words', kind: 'list', itemLabel: 'Word', newItem: '', itemKind: 'text' }],
  },
  'home.reasons': {
    preview: 'home',
    fields: [
      eyebrow(),
      display('title', 'Title'),
      { name: 'items', label: 'Reasons', kind: 'list', itemLabel: 'Reason', newItem: { icon: 'wrench', title: '', text: '' }, fields: [
        { name: 'title', label: 'Title', kind: 'text' },
        { name: 'icon', label: 'Icon', kind: 'select', options: ['wrench', 'clock', 'map', 'shield', 'bike', 'zap', 'heart', 'star'].map((v) => ({ value: v, label: v })) },
        { name: 'text', label: 'Text', kind: 'textarea' },
      ] },
    ],
  },
  'home.closer': {
    preview: 'home',
    fields: [
      display('title', 'Big line'),
      { name: 'text', label: 'Text', kind: 'textarea' },
      { name: 'buttonLabel', label: 'Button text', kind: 'text' },
      { name: 'href', label: 'Button goes to', kind: 'text' },
    ],
  },
  'home.services': {
    preview: 'home',
    fields: [
      eyebrow(),
      display('title', 'Title'),
      { name: 'subtitle', label: 'Subtitle', kind: 'textarea' },
      { name: 'items', label: 'Services', kind: 'list', itemLabel: 'Service', newItem: { title: '', text: '', mediaId: '' }, fields: [
        { name: 'title', label: 'Title', kind: 'text' },
        { name: 'text', label: 'Description', kind: 'textarea' },
        { name: 'mediaId', label: 'Image', kind: 'media' },
      ] },
    ],
  },
  'home.stats': {
    preview: 'home',
    fields: [
      { name: 'items', label: 'Stats', kind: 'list', itemLabel: 'Stat', newItem: { value: '', label: '', kind: 'text' }, fields: [
        { name: 'label', label: 'Label', kind: 'text' },
        { name: 'kind', label: 'Type', kind: 'select', options: [{ value: 'text', label: 'Fixed text' }, { value: 'years', label: 'Years since opening (automatic)' }] },
        { name: 'value', label: 'Value', kind: 'text', hint: 'e.g. 1,800+. Numbers count up on screen. For “Years since opening”, write {years}+ and the number fills in.' },
      ] },
    ],
  },
  'home.process': {
    preview: 'home',
    fields: [
      eyebrow(),
      display('title', 'Title'),
      { name: 'steps', label: 'Steps', kind: 'list', itemLabel: 'Step', newItem: { title: '', text: '' }, fields: [
        { name: 'title', label: 'Title', kind: 'text' },
        { name: 'text', label: 'Text', kind: 'textarea' },
      ] },
    ],
  },
  'home.map': {
    preview: 'home',
    help: 'The map link itself is in Site settings.',
    fields: [
      eyebrow(),
      { name: 'title', label: 'Title', kind: 'text', hint: 'Wrap words in *stars* to highlight them in lime.' },
      { name: 'subtitle', label: 'Subtitle', kind: 'textarea' },
    ],
  },
  about: {
    preview: 'about',
    fields: [
      eyebrow(),
      display('title', 'Page title'),
      { name: 'intro', label: 'Intro', kind: 'textarea' },
      display('storyTitle', 'Story heading'),
      { name: 'story', label: 'Story paragraphs', kind: 'list', itemLabel: 'Paragraph', newItem: '', itemKind: 'rich' },
      { name: 'imageId', label: 'Main photo', kind: 'media' },
      { name: 'secondImageId', label: 'Overlapping photo', kind: 'media', hint: 'Optional smaller photo tilted over the corner.' },
      { name: 'badge', label: 'Spinning badge text', kind: 'text', hint: 'e.g. Est. 2022 · Bukit Kiara ·  Leave empty to hide.' },
      { name: 'quote', label: 'Big quote', kind: 'textarea', hint: 'Shown on a lime band. Leave empty to hide.' },
      display('findTitle', '“Where to find us” heading'),
      { name: 'findText', label: '“Where to find us” text', kind: 'rich' },
      { name: 'contactLabel', label: 'Contact link text', kind: 'text' },
    ],
  },
  media: {
    preview: 'media',
    fields: [
      eyebrow(),
      display('title', 'Page title'),
      { name: 'imageIds', label: 'Gallery', kind: 'mediaList', hint: 'Each image’s alt text is used as its caption. Edit it in the Media library.' },
    ],
  },
  faq: {
    preview: 'faq',
    fields: [
      eyebrow(),
      display('title', 'Page title'),
      { name: 'intro', label: 'Intro', kind: 'textarea' },
      display('askTitle', '“Ask the mechanic” card title'),
      { name: 'askText', label: '“Ask the mechanic” card text', kind: 'textarea' },
      { name: 'askButton', label: '“Ask the mechanic” button', kind: 'text', hint: 'Opens WhatsApp. Leave the card title empty to hide the card.' },
      { name: 'items', label: 'Questions', kind: 'list', itemLabel: 'Question', newItem: { q: '', a: '' }, fields: [
        { name: 'q', label: 'Question', kind: 'text' },
        { name: 'a', label: 'Answer', kind: 'rich', hint: 'Use **bold** and [link text](/contact). Write {hours} to show the opening hours.' },
      ] },
    ],
  },
  contact: {
    preview: 'contact',
    help: 'Hours, address, WhatsApp number and map are in Site settings.',
    fields: [
      eyebrow(),
      display('title', 'Page title'),
      { name: 'intro', label: 'Intro', kind: 'textarea' },
      { name: 'getInTouchTitle', label: '“Get in touch” heading', kind: 'text' },
      { name: 'formTitle', label: 'Form heading', kind: 'text' },
      { name: 'nameLabel', label: 'Name field label', kind: 'text' },
      { name: 'namePlaceholder', label: 'Name field placeholder', kind: 'text' },
      { name: 'messageLabel', label: 'Message field label', kind: 'text' },
      { name: 'messagePlaceholder', label: 'Message field placeholder', kind: 'text' },
      { name: 'submitLabel', label: 'Send button text', kind: 'text' },
      { name: 'whatsappHeader', label: 'First line of the WhatsApp message', kind: 'text' },
    ],
  },
  footer: {
    preview: 'home',
    fields: [
      { name: 'tagline', label: 'Tagline', kind: 'text' },
      { name: 'columns', label: 'Link columns', kind: 'list', itemLabel: 'Column', newItem: { title: '', links: [] }, fields: [
        { name: 'title', label: 'Heading', kind: 'text' },
        { name: 'links', label: 'Links', kind: 'list', itemLabel: 'Link', newItem: { label: '', href: '/' }, fields: [
          { name: 'label', label: 'Text', kind: 'text' },
          { name: 'href', label: 'Goes to', kind: 'text', hint: 'A page like /about, or a full https:// link.' },
        ] },
      ] },
      { name: 'connectTitle', label: 'Social links heading', kind: 'text' },
      { name: 'copyright', label: 'Copyright text', kind: 'text', hint: '© and the current year are added automatically.' },
    ],
  },
  seo: {
    preview: 'seo',
    help: 'How each page appears in Google and when shared.',
    fields: [
      { name: 'pages', label: 'Pages', kind: 'group', fields: [seoPage('home', 'Home'), seoPage('about', 'About'), seoPage('media', 'Media'), seoPage('faq', 'FAQ'), seoPage('contact', 'Contact')] },
      { name: 'ogImageId', label: 'Share image', kind: 'media', hint: 'Shown when a link is shared on WhatsApp, Facebook, etc.' },
    ],
  },
};
