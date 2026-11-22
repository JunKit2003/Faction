import { describe, expect, it } from 'vitest';
import { SECTION_KEYS, SECTION_LABELS, collectMediaIds, MAP_EMBED_MESSAGE, sitePageForPath } from '../src/index.js';
import { sectionSchemas, hoursSchema } from '../src/schemas.js';

const day = (open: string, close: string) => ({ closed: false, open, close });
const closed = { closed: true, open: '', close: '' };
const hours = { mon: day('11:00', '19:30'), tue: day('11:00', '19:30'), wed: day('11:00', '19:30'), thu: day('11:00', '19:30'), fri: day('11:00', '19:30'), sat: day('11:00', '16:00'), sun: closed };

const site = {
  name: 'Faction Bikeworks', accentColor: '#38bdf8', logoOnLightId: 'L1', logoOnDarkId: 'L2', faviconId: 'F1',
  openedYear: 2022, whatsappNumber: '601133321767', address: 'G-8, Wisma WIM', hours,
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=abc',
  socials: [{ platform: 'instagram', url: 'https://www.instagram.com/faction.my' }],
  labels: { hours: 'Hours', address: 'Address', contact: 'Contact', open: 'Open now', closed: 'Closed, gone riding' },
  coordinates: '3.1434° N, 101.6324° E',
};

describe('section schemas', () => {
  it('has a schema and label for every key', () => {
    for (const k of SECTION_KEYS) {
      expect(sectionSchemas[k]).toBeDefined();
      expect(SECTION_LABELS[k]).toBeTruthy();
    }
    expect(SECTION_LABELS['home.hero']).toBe('Home: Hero');
  });

  it('accepts a valid site section', () => {
    expect(sectionSchemas.site.safeParse(site).success).toBe(true);
  });

  it('rejects a non-Google map link with the map copy', () => {
    const r = sectionSchemas.site.safeParse({ ...site, mapEmbedUrl: 'https://example.com/map' });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path).toEqual(['mapEmbedUrl']);
    expect(r.error!.issues[0]!.message).toBe('Paste the embed link from Google Maps → Share → Embed a map.');
    expect(MAP_EMBED_MESSAGE).toBe('Paste the embed link from Google Maps → Share → Embed a map.');
  });

  it('requires the info labels', () => {
    const { labels: _l, ...noLabels } = site;
    expect(sectionSchemas.site.safeParse(noLabels).success).toBe(false);
  });

  it('rejects a bad WhatsApp number', () => {
    expect(sectionSchemas.site.safeParse({ ...site, whatsappNumber: '+60 11-333' }).success).toBe(false);
  });

  it('rejects social links that are not http(s)', () => {
    expect(sectionSchemas.site.safeParse({ ...site, socials: [{ platform: 'facebook', url: 'javascript:alert(1)' }] }).success).toBe(false);
  });

  it('rejects hours where open is not before close', () => {
    const r = hoursSchema.safeParse({ ...hours, mon: day('19:30', '11:00') });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path).toEqual(['mon', 'close']);
  });

  it('rejects malformed times', () => {
    expect(hoursSchema.safeParse({ ...hours, tue: day('9am', '19:30') }).success).toBe(false);
  });

  it('rejects empty required text', () => {
    const r = sectionSchemas.faq.safeParse({ title: 'FAQ', intro: '', items: [{ q: '', a: 'x' }] });
    expect(r.success).toBe(false);
    expect(r.error!.issues.some((i) => i.path.join('.') === 'items.0.q')).toBe(true);
  });

  it('rejects unknown keys so stale data cannot sneak through', () => {
    expect(sectionSchemas['home.map'].safeParse({ title: 'a', subtitle: 'b', extra: 1 }).success).toBe(false);
  });
});

describe('v2 sections', () => {
  it('has the new homepage blocks with labels', () => {
    for (const k of ['home.ticker', 'home.reasons', 'home.closer'] as const) {
      expect(SECTION_KEYS).toContain(k);
      expect(SECTION_LABELS[k]).toBeTruthy();
    }
  });
  it('validates reasons icons from a fixed set', () => {
    const ok = { eyebrow: 'Why', title: 'T', items: [{ icon: 'wrench', title: 'A', text: 'B' }] };
    expect(sectionSchemas['home.reasons'].safeParse(ok).success).toBe(true);
    expect(sectionSchemas['home.reasons'].safeParse({ ...ok, items: [{ icon: 'skull', title: 'A', text: 'B' }] }).success).toBe(false);
  });
  it('closer needs a safe link', () => {
    const ok = { title: 'Get *dialled.*', text: 'x', buttonLabel: 'Book', href: '/contact#booking' };
    expect(sectionSchemas['home.closer'].safeParse(ok).success).toBe(true);
    expect(sectionSchemas['home.closer'].safeParse({ ...ok, href: 'javascript:alert(1)' }).success).toBe(false);
  });
  it('about allows an optional second photo', () => {
    const base = { title: 'A', intro: '', storyTitle: 'S', story: ['p'], imageId: 'I', secondImageId: '', findTitle: 'F', findText: '', contactLabel: 'C', eyebrow: '', quote: '', badge: '' };
    expect(sectionSchemas.about.safeParse(base).success).toBe(true);
  });
});

describe('hero floating card photos', () => {
  const hero = { eyebrow: '', title: 'T', text: 't', badgeTitle: '', badgeText: '', primary: { label: 'a', href: '/' }, secondary: { label: 'b', href: '/' }, slideIds: ['S1'] };
  it('has its own photo list, which may be empty', () => {
    expect(sectionSchemas['home.hero'].safeParse({ ...hero, badgeImageIds: ['P1', 'P2'] }).success).toBe(true);
    expect(sectionSchemas['home.hero'].safeParse({ ...hero, badgeImageIds: [] }).success).toBe(true);
    expect(sectionSchemas['home.hero'].safeParse(hero).success).toBe(false);
  });
  it('counts as an image reference for in-use checks', () => {
    expect(collectMediaIds({ badgeImageIds: ['P1'] })).toEqual(['P1']);
  });
});

describe('collectMediaIds', () => {
  it('finds ids under *Id, *Ids and mediaId keys at any depth', () => {
    const data = { logoOnLightId: 'A', slideIds: ['B', 'C'], items: [{ title: 'x', mediaId: 'D' }], name: 'E', ogImageId: '' };
    expect(collectMediaIds(data).sort()).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('sitePageForPath', () => {
  it('maps paths to page keys', () => {
    expect(sitePageForPath('/')).toBe('home');
    expect(sitePageForPath('/media')).toBe('media');
    expect(sitePageForPath('/nope')).toBeNull();
  });
});

import { parseRich, isSafeHref } from '../src/index.js';
describe('parseRich', () => {
  it('parses bold and links', () => {
    expect(parseRich('Hi **there** see [Contact](/contact).')).toEqual([
      { type: 'text', text: 'Hi ' }, { type: 'bold', text: 'there' }, { type: 'text', text: ' see ' },
      { type: 'link', text: 'Contact', href: '/contact' }, { type: 'text', text: '.' },
    ]);
  });
  it('turns unsafe links into plain text', () => {
    expect(parseRich('[x](javascript:alert(1))')).toEqual([{ type: 'text', text: '[x](javascript:alert(1))' }]);
  });
  it('isSafeHref allows only http(s), mailto, tel, / and #', () => {
    for (const ok of ['https://a.b', 'http://a.b', 'mailto:a@b.c', 'tel:+60', '/contact', '/contact#booking', '#top']) expect(isSafeHref(ok)).toBe(true);
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.com', ' javascript:x', 'vbscript:x']) expect(isSafeHref(bad)).toBe(false);
  });
});
