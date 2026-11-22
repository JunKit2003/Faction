import { DAYS, PAGE_PATHS, type PublicContent, type SitePage } from '@faction/shared';

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** JSON safe to place inside a <script> element. */
export const scriptJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' } as const;

export type HeadPage = SitePage | 'admin' | 'notfound';

export function jsonLd(c: PublicContent, baseUrl: string) {
  const { site } = c.sections;
  const groups = new Map<string, string[]>();
  for (const d of DAYS) {
    const h = site.hours[d];
    if (h.closed) continue;
    const k = `${h.open}-${h.close}`;
    groups.set(k, [...(groups.get(k) ?? []), DAY_NAMES[d]]);
  }
  const logo = c.media[site.logoOnLightId];
  const og = c.media[c.sections.seo.ogImageId];
  return {
    '@context': 'https://schema.org',
    '@type': 'BikeStore',
    name: site.name,
    url: `${baseUrl}/`,
    ...(og ? { image: baseUrl + og.url } : {}),
    ...(logo ? { logo: baseUrl + logo.url } : {}),
    telephone: `+${site.whatsappNumber}`,
    address: { '@type': 'PostalAddress', streetAddress: site.address, addressLocality: 'Kuala Lumpur', addressCountry: 'MY' },
    openingHoursSpecification: [...groups].map(([k, days]) => {
      const [opens, closes] = k.split('-');
      return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes };
    }),
    sameAs: site.socials.map((s) => s.url),
  };
}

export function renderHead(page: HeadPage, c: PublicContent, baseUrl: string, nonce: string): string {
  const { site, seo } = c.sections;
  const meta = page === 'admin' ? { title: `Admin | ${site.name}`, description: '' }
    : page === 'notfound' ? { title: `Page not found | ${site.name}`, description: '' }
    : seo.pages[page];
  const favicon = c.media[site.faviconId];
  const og = c.media[seo.ogImageId];
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    meta.description && `<meta name="description" content="${esc(meta.description)}">`,
    favicon && `<link rel="icon" href="${esc(favicon.url)}" type="${esc(favicon.mime)}">`,
    `<meta name="theme-color" content="${esc(site.accentColor)}">`,
    `<style nonce="${nonce}">:root{--accent:${/^#[0-9a-fA-F]{6}$/.test(site.accentColor) ? site.accentColor : '#38bdf8'}}</style>`,
  ];
  if (page === 'admin' || page === 'notfound') {
    tags.push('<meta name="robots" content="noindex, nofollow">');
  } else {
    const url = `${baseUrl}${PAGE_PATHS[page] === '/' ? '/' : PAGE_PATHS[page]}`;
    tags.push(
      `<link rel="canonical" href="${esc(url)}">`,
      '<meta property="og:type" content="website">',
      `<meta property="og:site_name" content="${esc(site.name)}">`,
      `<meta property="og:title" content="${esc(meta.title)}">`,
      `<meta property="og:description" content="${esc(meta.description)}">`,
      `<meta property="og:url" content="${esc(url)}">`,
      og ? `<meta property="og:image" content="${esc(baseUrl + og.url)}">` : '',
      '<meta name="twitter:card" content="summary_large_image">',
      `<script type="application/ld+json">${scriptJson(jsonLd(c, baseUrl))}</script>`,
    );
    const hero = page === 'home' ? c.media[c.sections['home.hero'].slideIds[0] ?? ''] : undefined;
    if (hero?.srcset) tags.push(`<link rel="preload" as="image" imagesrcset="${esc(hero.srcset)}" imagesizes="100vw" fetchpriority="high">`);
  }
  return tags.filter(Boolean).join('\n    ');
}

export function sitemapXml(baseUrl: string): string {
  const urls = Object.values(PAGE_PATHS).map((p) => `  <url><loc>${esc(baseUrl + p)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const robotsTxt = (baseUrl: string) => `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
