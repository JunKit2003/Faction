import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import express, { Router } from 'express';
import type { Kysely } from 'kysely';
import { sitePageForPath } from '@faction/shared';
import type { Config } from '../config.js';
import type { DB } from '../db/types.js';
import { loadPublicContent } from '../content/public.js';
import { renderHead, robotsTxt, scriptJson, sitemapXml, type HeadPage } from './meta.js';

const LEGACY: Record<string, string> = {
  '/index.html': '/', '/about.html': '/about', '/gallery.html': '/media', '/faq.html': '/faq', '/contact.html': '/contact',
};

function csp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'self' https://www.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

/** Public routes that don't depend on the built SPA. */
export function seoRoutes(cfg: Config): Router {
  const r = Router();
  for (const [from, to] of Object.entries(LEGACY)) r.get(from, (_req, res) => res.redirect(301, to));
  r.get('/robots.txt', (_req, res) => { res.type('text/plain').send(robotsTxt(cfg.publicBaseUrl)); });
  r.get('/sitemap.xml', (_req, res) => { res.type('application/xml').send(sitemapXml(cfg.publicBaseUrl)); });
  return r;
}

/** Serves the built React app with per-page head tags and the content inlined. No-op if web/dist is missing (dev uses Vite). */
export function spaRoutes(db: Kysely<DB>, cfg: Config): Router {
  const r = Router();
  const indexPath = path.join(cfg.webDist, 'index.html');
  if (!fs.existsSync(indexPath)) return r;
  // Preload the self-hosted headline font so the hero headline doesn't reflow when it arrives.
  const assetsDir = path.join(cfg.webDist, 'assets');
  const fontPreload = (fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [])
    .filter((f) => /^(anton-latin-400-normal|inter-latin-wght-normal)-.*\.woff2$/.test(f))
    .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`)
    .join('');
  const template = fs.readFileSync(indexPath, 'utf8').replace('<!--app-head-->', `${fontPreload}<!--app-head-->`);

  r.use('/assets', express.static(path.join(cfg.webDist, 'assets'), { immutable: true, maxAge: '365d', fallthrough: false }));
  r.use(express.static(cfg.webDist, { index: false, maxAge: '1h' }));

  r.get(/.*/, async (req, res) => {
    const isAdmin = req.path === '/admin' || req.path.startsWith('/admin/');
    const sitePage = sitePageForPath(req.path);
    const page: HeadPage = isAdmin ? 'admin' : sitePage ?? 'notfound';
    const nonce = randomBytes(16).toString('base64');
    const content = await loadPublicContent(db);
    const html = template
      .replace('<!--app-head-->', renderHead(page, content, cfg.publicBaseUrl, nonce))
      .replace('<!--app-data-->', `<script nonce="${nonce}">window.__FACTION__=${scriptJson(content)}</script>`)
      .replaceAll('<script type="module"', `<script nonce="${nonce}" type="module"`);
    res.status(page === 'notfound' ? 404 : 200)
      .set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Content-Security-Policy': csp(nonce),
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'SAMEORIGIN',
      })
      .send(html);
  });
  return r;
}
