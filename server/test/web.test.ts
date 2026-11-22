import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { setupTestApp, ORIGIN, type TestCtx } from './helpers.js';
import { seedIfEmpty } from '../src/seed/run.js';

let ctx: TestCtx;
beforeAll(async () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'faction-dist-'));
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><!--app-head--><script type="module" src="/assets/app.js"></script></head><body><div id="root"></div><!--app-data--></body></html>');
  fs.mkdirSync(path.join(dist, 'assets'));
  fs.writeFileSync(path.join(dist, 'assets', 'app.js'), 'console.log(1);'.repeat(500));
  fs.writeFileSync(path.join(dist, 'assets', 'archivo-latin-standard-normal-AbC123.woff2'), 'font');
  fs.writeFileSync(path.join(dist, 'assets', 'inter-tight-latin-wght-normal-XyZ789.woff2'), 'font');
  fs.writeFileSync(path.join(dist, 'assets', 'inter-tight-cyrillic-wght-normal-Nope.woff2'), 'font');
  ctx = await setupTestApp({ webDist: dist });
  await seedIfEmpty(ctx.db, ctx.cfg);
}, 120_000);
afterAll(async () => { await ctx.close(); });

describe('legacy URLs', () => {
  it.each([
    ['/index.html', '/'], ['/about.html', '/about'], ['/gallery.html', '/media'], ['/faq.html', '/faq'], ['/contact.html', '/contact'],
  ])('%s → 301 %s', async (from, to) => {
    const res = await request(ctx.app).get(from);
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe(to);
  });
});

describe('pages', () => {
  it('injects the page title, description, canonical and share tags', async () => {
    const res = await request(ctx.app).get('/faq');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<title>FAQ | Faction Bikeworks</title>');
    expect(res.text).toContain('<meta name="description" content="Frequently asked questions about Faction Bikeworks services, bookings, pricing, and location.">');
    expect(res.text).toContain(`<link rel="canonical" href="${ORIGIN}/faq">`);
    expect(res.text).toMatch(/<meta property="og:image" content="http:\/\/localhost:3000\/uploads\/[^"]+\.webp">/);
    expect(res.text).not.toContain('noindex');
  });

  it('embeds content and JSON-LD safely', async () => {
    const res = await request(ctx.app).get('/');
    const ld = res.text.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]!;
    const data = JSON.parse(ld);
    expect(data['@type']).toBe('BikeStore');
    expect(data.telephone).toBe('+601133321767');
    expect(data.openingHoursSpecification).toContainEqual({ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '11:00', closes: '19:30' });
    expect(data.sameAs).toContain('https://www.instagram.com/faction.my');
    const nonce = res.headers['content-security-policy']!.match(/'nonce-([^']+)'/)![1];
    expect(res.text).toContain(`<script nonce="${nonce}">window.__FACTION__=`);
    expect(res.text).not.toMatch(/<\/script>[^<]*<\/script>/);
  });

  it('escapes admin-entered text in the head', async () => {
    const row = await ctx.db.selectFrom('content_sections').select('data').where('key', '=', 'seo').executeTakeFirstOrThrow();
    const seo = JSON.parse(row.data);
    seo.pages.about.title = 'About "us" </title><script>alert(1)</script>';
    await ctx.db.updateTable('content_sections').set({ data: JSON.stringify(seo) }).where('key', '=', 'seo').execute();
    const res = await request(ctx.app).get('/about');
    expect(res.text).toContain('<title>About &quot;us&quot; &lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>');
    expect(res.text).not.toContain('<script>alert(1)');
  });

  it("keeps $ sequences in admin text intact (no String.replace patterns)", async () => {
    const row = await ctx.db.selectFrom('content_sections').select('data').where('key', '=', 'home.map').executeTakeFirstOrThrow();
    const map = JSON.parse(row.data);
    map.subtitle = "Price $' and $` and $& and $$ ok";
    await ctx.db.updateTable('content_sections').set({ data: JSON.stringify(map) }).where('key', '=', 'home.map').execute();
    const seoRow = await ctx.db.selectFrom('content_sections').select('data').where('key', '=', 'seo').executeTakeFirstOrThrow();
    const seo = JSON.parse(seoRow.data);
    seo.pages.faq.title = "FAQ $' $& | Faction";
    await ctx.db.updateTable('content_sections').set({ data: JSON.stringify(seo) }).where('key', '=', 'seo').execute();
    const res = await request(ctx.app).get('/faq');
    const json = res.text.match(/window\.__FACTION__=(.*?)<\/script>/s)![1]!;
    expect(JSON.parse(json).sections['home.map'].subtitle).toBe("Price $' and $` and $& and $$ ok");
    expect(res.text).toContain("<title>FAQ $' $&amp; | Faction</title>");
  });

  it('marks admin pages noindex', async () => {
    const res = await request(ctx.app).get('/admin/faq');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  it('404s unknown pages with the app shell', async () => {
    const res = await request(ctx.app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.text).toContain('<div id="root">');
    expect(res.text).toContain('noindex');
  });

  it('sends security headers allowing only the Google map frame', async () => {
    const res = await request(ctx.app).get('/contact');
    const csp = res.headers['content-security-policy']!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src 'self' https://www.google.com");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('never loads the paid Google Maps JS API', async () => {
    for (const p of ['/', '/about', '/media', '/faq', '/contact']) {
      expect((await request(ctx.app).get(p)).text).not.toContain('maps.googleapis.com/maps/api/js');
    }
  });

  it('serves hashed assets with long cache', async () => {
    const res = await request(ctx.app).get('/assets/app.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('compresses HTML, assets and API responses', async () => {
    for (const url of ['/', '/assets/app.js', '/api/content']) {
      const res = await request(ctx.app).get(url).set('Accept-Encoding', 'gzip');
      expect(res.headers['content-encoding'], url).toBe('gzip');
    }
  });

  it('preloads the latin headline and body fonts so text paints early and does not jump', async () => {
    const res = await request(ctx.app).get('/');
    expect(res.text).toContain('<link rel="preload" href="/assets/archivo-latin-standard-normal-AbC123.woff2" as="font" type="font/woff2" crossorigin>');
    expect(res.text).toContain('<link rel="preload" href="/assets/inter-tight-latin-wght-normal-XyZ789.woff2" as="font" type="font/woff2" crossorigin>');
    expect(res.text).not.toContain("inter-tight-cyrillic");
  });

  it('404s (not 500s) for missing upload files', async () => {
    const res = await request(ctx.app).get('/uploads/missing-960.webp');
    expect(res.status).toBe(404);
  });

  it('keeps unknown API paths as JSON 404', async () => {
    const res = await request(ctx.app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found.');
  });
});

describe('robots and sitemap', () => {
  it('lists the five pages', async () => {
    const res = await request(ctx.app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    for (const p of ['/', '/about', '/media', '/faq', '/contact']) expect(res.text).toContain(`<loc>${ORIGIN}${p}</loc>`);
  });
  it('blocks admin and api in robots.txt', async () => {
    const res = await request(ctx.app).get('/robots.txt');
    expect(res.text).toContain('Disallow: /admin');
    expect(res.text).toContain('Disallow: /api');
    expect(res.text).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });
});
