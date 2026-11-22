# Website revamp + Admin Panel design (no work item)

Acceptance spec: [`docs/website-revamp-admin-spec.md`](../website-revamp-admin-spec.md)

## 1. Summary & goal

The Faction Bikeworks site today is five static HTML pages (Home, About, Media, FAQ, Contact). Changing anything means editing HTML. The shop asked for an Admin Panel so they can update the site themselves. We're also taking the chance to rebuild the public site so it looks premium and feels alive.

- **Rebuild** the public site in React with exactly the content shown today, redesigned and made interactive.
- **Make every visible thing editable** from a password-protected Admin Panel: text, images, logos, hours, address, stats, services, steps, FAQs, gallery, social links, the WhatsApp number, the map, and the page titles/descriptions shown on Google.
- **Add an audit log** so admins can see who changed what, when, and what it was before. They can restore an earlier version of any section.
- **Run on MySQL or PostgreSQL**, chosen by one setting, because the hosting provider is unknown.

### Answers to the open questions
- **Who edits?** Several admin logins, all with full access, no roles. The panel must work well on a phone.
- **Stack?** Node (option 1 below).
- **Google Places / API key?** Gone for good. Only the free Google Maps *embed* iframe stays. (The old key is in the public git history, so the owner should rotate it.)

## 2. Scope

**In scope**
- Public pages: Home (hero, services, stats, how it works, map), About (intro, story, image, where to find us, hours, address), Media (gallery + lightbox), FAQ, Contact (hours, address, social links, quick message → WhatsApp, map), plus the shared header, footer and back-to-top button.
- Light and dark appearance that follows the visitor's device setting, with the matching logo, as today.
- Admin Panel: sign in/out, edit every section, upload/reorder/delete images, manage admin accounts, change own password, audit log with before/after and restore.
- MySQL 8+ and PostgreSQL 14+ support from one codebase.
- Seed data equal to the current site's content and images, so day one looks the same content-wise.
- Deployment docs + Dockerfile + compose files for both databases.

**Out of scope**
- New content sections, blog, online booking/payments, shop/e-commerce, multiple languages.
- Google reviews/ratings pulled live (paid API). The "5.0★ / 21 Google Reviews" stat stays an editable text stat.
- Storing contact-form messages (the form keeps opening WhatsApp).
- Roles/permissions, 2FA, email-based password reset (no email service is assumed).
- Draft/scheduled publishing. Saving goes live immediately.

**Definition of Done**
- Every element visible on the five current pages appears in the new site and can be changed from the Admin Panel without a code change.
- The full automated test suite passes against **both** MySQL and PostgreSQL.
- Every admin change shows up in the audit log with who, when, and before/after.
- Lighthouse on Home (mobile): Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95.
- The README lets a host deploy it on plain Node or Docker with either database.

## 3. Architecture & data ownership

**Approaches considered**
1. **Node: React (Vite) + Express + Kysely** (chosen). One migration set works on both databases. A single Node process serves site, API and uploads, which suits the widest range of hosts.
2. ASP.NET Core + EF Core: needs a separate migration set per database, and fewer cheap hosts run .NET.
3. Next.js + Prisma: Prisma fixes the database type in the schema, so it needs two schemas and two builds, and it's heavier to host.

**Repo layout** (npm workspaces): `web/` (Vite + React + TypeScript), `server/` (Express + TypeScript), `shared/` (zod schemas + types used by both). The legacy static files move to the `backup/static-site` branch and are deleted from this branch once their images are seeded.

### Who owns what

| Data | Table | Notes |
|---|---|---|
| Section content (hero, services, stats, steps, about, contact, faq, footer, site settings, seo) | `content_sections` (`key` PK, `data` TEXT JSON, `version` int, `updated_at`, `updated_by`) | One row per section. JSON is stored as TEXT so it behaves the same on both databases. It's validated by the zod schema for that section on every write. |
| Images | `media` (`id`, `filename`, `original_name`, `mime`, `width`, `height`, `alt`, `created_at`, `created_by`, `deleted_at`) | Files live on disk in `UPLOAD_DIR`. Sections refer to images by `media.id`. Deleting is a soft delete (*builder's call*): the row is hidden from the library but the file is kept. |
| Admins | `users` (`id`, `email` unique, `name`, `password_hash`, `created_at`, `last_login_at`, `disabled`) | Passwords hashed with argon2id. |
| Sessions | `sessions` (`id` random 32 bytes, `user_id`, `expires_at`, `ip`, `user_agent`) | httpOnly, Secure, SameSite=Lax cookie. Sessions last 7 days and slide on use. |
| Audit log | `audit_log` (`id`, `at`, `user_id`, `user_email` snapshot, `action`, `target_type`, `target_key`, `before` TEXT, `after` TEXT, `ip`) | Rows are only ever added, never edited. Kept forever (the volume is tiny). |

Gallery and hero slides are **ordered arrays of media ids inside their section JSON**, so reordering them is one section save and one audit entry.

### The rules that fall out of this
- **Database switch:** `DB_CLIENT=mysql|pg` + `DATABASE_URL`. Migrations use only the column types both databases share (`varchar`, `text`/`longtext`, `integer`). Times are ISO-8601 strings and flags are nullable `*_at` columns (*builder's call*, avoids boolean/timestamp differences). The test suite runs on both.
- **Optimistic concurrency:** saving a section sends the `version` it was loaded at. If the stored version has moved on, the server answers 409 and the UI says "Someone else changed this, reload to see their version".
- **Every write is audited in the same transaction** as the change: section update, media upload/alt edit/delete, user create/disable/delete/password reset, own password change, login success, login failure, logout, restore.
- **Restore** copies an audit entry's `before` (or `after`) back into the section. That counts as a new update with its own audit row. Any soft-deleted image the restored version uses is un-deleted in the same transaction (*builder's call*).
- **Media in use can't be deleted.** The server returns the sections using it so the admin can see where it's used.
- **Uploads:** jpg/png/webp up to 15 MB. `sharp` re-encodes to webp at 480/960/1600/2400 px widths, strips EXIF, and keeps the original aspect ratio. Logos also accept svg. SVGs are not rewritten: one containing scripts, event handlers, `javascript:` links, embedded objects or entity declarations is refused with an explanation, and `/uploads` is served with a sandboxing CSP (*builder's call*).
- **Admin safety:** you can't disable or delete yourself, and the last active admin can't be removed. Login is rate-limited (5 failures per 15 minutes per IP + email). Every mutating request is checked against the `Origin` header.
- **First admin:** `npm run admin:create -- --email … --name …` prompts for a password. There's also `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD`, which is used only when the `users` table is empty.
- **SEO without SSR:** the server serves the built `index.html` with that page's title, description, OG tags, canonical URL and a JSON-LD `BikeStore` block filled in from the database. `/sitemap.xml` and `/robots.txt` are generated (base URL from `PUBLIC_BASE_URL`). The old `*.html` URLs 301 to the new paths (`/about`, `/media`, `/faq`, `/contact`).
- **Map:** admins paste the Google Maps "Embed a map" `src`. The server only accepts `https://www.google.com/maps/embed?…`.
- **Years in business** is computed from an editable "opened year" (2022 today), as now.
- **Hours are structured** (*builder's call*): each weekday is either closed or has an open and close time (`HH:MM`). About and Contact show one standard wording by grouping days with the same hours ("Mon–Fri · 11:00–19:30", "Sat · 11:00–16:00", "Sun · Closed"). FAQ answers can contain `{hours}`, which is replaced with the same wording. This is the one deliberate exception to word-for-word copy, because today the three pages word the hours differently. The "Open now" badge uses the same data.
- **Compiled add-ons** (*builder's call*): `sharp` and `@node-rs/argon2` both ship ready-built for Linux, macOS and Windows on x64 and arm64 (glibc and musl), so hosts don't need a compiler.

### Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/content` | public | All public sections, with media resolved to URLs. Cached, ETag'd. |
| GET | `/uploads/:file` | public | Image files, long cache. |
| POST | `/api/auth/login`, `/api/auth/logout` | public / admin | Sessions. |
| GET | `/api/auth/me` | admin | Current admin. |
| GET/PUT | `/api/admin/sections/:key` | admin | Read/save one section (with `version`). |
| GET/POST/PATCH/DELETE | `/api/admin/media[/:id]` | admin | List, upload (multipart), edit alt text, delete. |
| GET/POST/PATCH/DELETE | `/api/admin/users[/:id]` | admin | Manage admins, reset password. |
| PUT | `/api/admin/me/password` | admin | Change own password (needs the current one). |
| GET | `/api/admin/audit` | admin | Paged and filterable by user, target, action and date range. |
| POST | `/api/admin/audit/:id/restore` | admin | Restore a section to `before` or `after`. |
| GET | `/healthz` | public | Liveness + DB ping. |

### Changes to existing endpoints
None. There's no backend today.

Initial migration: `0001_initial` (all tables) and seed `0001_seed_current_site`.

## 4. Product-visible behaviour & copy

**Look (builder's call, within this direction):** dark-first "trail at dusk" feel that still honours the light theme. Near-black surfaces, jungle-green photo tones, and a single electric accent kept from the current sky blue (`#38bdf8`, editable in site settings), with the black/white logo. It uses a bold condensed display face for headlines (e.g. "Archivo" / "Anton", self-hosted) and Inter for body text.

**Interactions:** hero slideshow with slow Ken Burns zoom and crossfade over the admin's hero images, with the headline revealing word by word. Service cards tilt slightly and their image zooms on hover, with a scroll-reveal stagger. Stats count up when they scroll into view. How It Works is a scroll-driven line that "draws" between the steps. The FAQ has a smooth accordion with a filter box over the existing questions. The gallery is a masonry layout with a fullscreen lightbox (swipe, arrows, Esc, captions = alt text). Page transitions animate the route change. The nav underline slides to the active link and the header turns into glass on scroll. Smooth scrolling (Lenis) is used on desktop only. All motion respects `prefers-reduced-motion`. There's an "Open now / Closed" badge computed from the editable hours (Asia/Kuala_Lumpur time). That's the builder's interactive addition and uses no new content.

**Copy:** all strings are seeded verbatim from the current HTML, except the broken empty `<p></p>` on About, which is dropped. Contact form errors keep "Please enter your name." / "Please include a message." and the status "Opening WhatsApp…".

**Admin Panel:** at `/admin`, works on a phone first. The left nav (a bottom sheet on mobile) lists Site settings, Home: Hero, Home: Services, Home: Stats, Home: How it works, Home: Map, About, Media gallery, FAQ, Contact, Footer & social, SEO, Media library, Admins, Audit log. Each editor has a live preview pane on desktop and a "Preview" toggle on mobile. Lists support add, delete, and drag-to-reorder. Save shows "Saved" or a clear error. Leaving with unsaved changes asks first. The audit log shows a side-by-side field diff and a "Restore this version" button.

**Also out of scope:** pointing factionbikeworks.com at the new app, choosing a host, and rotating the old Google key (the owner's task). The deliverable is a deployable, documented build.

## 5. Known limitations
- Very old shared hosts (glibc < 2.26, or no Node 20+) can't run the ready-built image and password add-ons. Use Docker or a VPS (a rented virtual server) there.
- Uploaded images live on the server's disk. The host has to keep `UPLOAD_DIR` between deploys (a Docker volume or persistent folder).
- There's no email, so a forgotten password is reset by another admin or with the `admin:create --reset` CLI.
- The SPA renders content on the client. Search engines get correct meta tags and JSON-LD from the server, but page body text appears after JavaScript runs (Google handles this fine).
- The Google review count is manual text.
