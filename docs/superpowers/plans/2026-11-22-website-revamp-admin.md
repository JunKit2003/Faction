# Faction Website Revamp + Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Faction Bikeworks site with a React site whose every visible element is editable from an audited Admin Panel, backed by Node + MySQL/PostgreSQL.

**Architecture:** npm workspaces `shared/` (zod section schemas, hours helpers), `server/` (Express + Kysely; serves API, uploads and built SPA with per-page meta), `web/` (Vite + React; public site and `/admin`). Content is one JSON-as-TEXT row per section with an optimistic `version`; every write audits in the same transaction.

**Tech Stack:** Node 20+, TypeScript strict, Express 5, Kysely (`mysql2` / `pg`), zod 4, `@node-rs/argon2`, `sharp`, multer, Vitest + Supertest, React 19, React Router 7, TanStack Query, Tailwind CSS 4, `motion`, `lenis`, `@dnd-kit`, Playwright.

**Spec:** `docs/plans/2026-11-22-website-revamp-admin-design.md` + `docs/website-revamp-admin-spec.md`

## Global Constraints

- `DB_CLIENT=mysql|pg` + `DATABASE_URL` select the database; MySQL 8+, PostgreSQL 14+. Tests must pass on MySQL 8.4 and PostgreSQL 16.
- Only portable column types: `varchar`, `text` (`longtext` on MySQL), `integer`. No booleans, no DB timestamps: times are ISO-8601 UTC strings in `varchar(32)`; flags are nullable `*_at` strings. IDs are app-generated sortable strings (`newId()`).
- Uploads: jpg/png/webp ≤ 15 MB; svg allowed for logos only; webp variants at 480/960/1600/2400 px, EXIF stripped.
- Sessions 7 days sliding, cookie `fsid` httpOnly, SameSite=Lax, Secure when `NODE_ENV=production`. Login: 5 failures / 15 min per IP+email.
- Copy (verbatim): "Email or password is incorrect.", "Too many attempts. Try again in 15 minutes.", "Someone else changed this, reload to see their version.", "Paste the embed link from Google Maps → Share → Embed a map.", "Only JPG, PNG or WebP images up to 15 MB.", "Please enter your name.", "Please include a message.", "Opening WhatsApp…".
- Map URL must start with `https://www.google.com/maps/embed?`. No page loads `maps.googleapis.com/maps/api/js`.
- Hours wording: group equal consecutive days → "Mon–Fri · 11:00–19:30", "Sat · 11:00–16:00", "Sun · Closed"; open-now uses `Asia/Kuala_Lumpur`.
- Old URLs 301: `/index.html→/`, `/about.html→/about`, `/gallery.html→/media`, `/faq.html→/faq`, `/contact.html→/contact`.
- All motion off under `prefers-reduced-motion: reduce`.
- Passwords/hashes never appear in audit rows or API responses.

## Review Focus

- **Restore of a section version that fails today's schema** (schema evolved) → reject with 422, don't write bad data. Test in Task 6.
- **Inline rich text containing HTML / `javascript:` links** → rendered as text; links limited to `http(s):`, `mailto:`, `tel:`, `/`. Test in Task 8.
- **Uploaded file lying about its type** (pdf renamed .jpg) → sharp decode fails → 415 with the upload copy. Test in Task 4.
- **Session of a disabled/deleted admin** → next request 401. Test in Task 5.
- **Hours with a day where open ≥ close** → validation error. Test in Task 2.

---

### Task 1: Workspace scaffold, DB connection, migrations, health

**Files:**
- Create: `package.json` (workspaces), `tsconfig.base.json`, `.gitignore`, `.env.example`, `compose.mysql.yaml` (mysql:8.4 on 33061), `compose.pg.yaml` (postgres:16 on 54321)
- Create: `server/package.json`, `server/tsconfig.json`, `server/vitest.config.ts`, `server/src/config.ts`, `server/src/db/{index,types,migrations,ids}.ts`, `server/src/app.ts`, `server/src/main.ts`
- Test: `server/test/helpers.ts`, `server/test/health.test.ts`, `server/test/migrations.test.ts`

**Interfaces:**
- Produces: `loadConfig(env): Config` (`dbClient`, `databaseUrl`, `port`, `uploadDir`, `publicBaseUrl`, `webDist`, `isProd`); `createDb(cfg): Kysely<DB>`; `migrateToLatest(db, client)`; `newId(): string` (lexicographically time-sortable, 26 chars); `nowIso(): string`; `createApp(deps: {db, cfg}): express.Express`; test helper `setupTestApp(): Promise<{app, db, cfg, reset()}>` reading `TEST_DB_CLIENT`/`TEST_DATABASE_URL`.
- Tables (`server/src/db/types.ts`): `content_sections`, `media`, `users`, `sessions`, `audit_log` exactly as in the design doc §3 (+ `media.deleted_at`, `users.disabled_at`).

- [ ] Step 1: tests — `GET /healthz` → 200 `{ok:true, db:true}`; with a db whose `selectFrom` throws → 503 `{ok:false, db:false}`; migrations create all five tables (insert+select a row in each).
- [ ] Step 2: run `npm run test:pg -w server` → FAIL (no app).
- [ ] Step 3: implement; migrations use helper `longText(client)`.
- [ ] Step 4: `docker compose -f compose.pg.yaml up -d && docker compose -f compose.mysql.yaml up -d`; `npm run test:pg -w server && npm run test:mysql -w server` → PASS.
- [ ] Step 5: commit.

### Task 2: Shared section schemas + hours helpers

**Files:**
- Create: `shared/package.json`, `shared/src/{index,sections,hours,richtext}.ts`
- Test: `shared/test/hours.test.ts`, `shared/test/sections.test.ts`

**Interfaces:**
- Produces: `SECTION_KEYS = ['site','nav','home.hero','home.services','home.stats','home.process','home.map','about','media','faq','contact','footer','seo'] as const`; `SectionKey`; `sectionSchemas: {[K in SectionKey]: z.ZodType}`; `SectionData<K>`; `SECTION_LABELS: Record<SectionKey,string>` ("Site settings", "Home: Hero", …); `Hours = Record<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun', {closed: boolean; open: string; close: string}>`; `formatHours(h): string[]`; `isOpenAt(h, date: Date, tz='Asia/Kuala_Lumpur'): boolean`; `fillHours(text, h): string` (replaces `{hours}` with lines joined ", "); `collectMediaIds(data: unknown): string[]` (every string value under a key ending `Id`/`Ids` or `mediaId`); `MAP_EMBED_PREFIX`.
- Section shapes: `site{name, accentColor, logoOnLightId, logoOnDarkId, faviconId, openedYear, whatsappNumber(/^\d{8,15}$/), address, hours, mapEmbedUrl, socials[{platform:'instagram'|'facebook'|'whatsapp', url}]}`; `nav{items[{label, path:'/'|'/about'|'/media'|'/faq'|'/contact'}], ctaIndex}`; `home.hero{title, text, primary{label,href}, secondary{label,href}, slideIds[]}`; `home.services{title, subtitle, items[{title, text, mediaId}]}`; `home.stats{items[{value, label, kind:'text'|'years'}]}`; `home.process{title, steps[{title,text}]}`; `home.map{title, subtitle}`; `about{title, intro, storyTitle, story[rich], imageId, findTitle, findText(rich), contactLabel}`; `media{title, imageIds[]}`; `faq{title, intro, items[{q, a(rich)}]}`; `contact{title, intro, getInTouchTitle, formTitle, nameLabel, namePlaceholder, messageLabel, messagePlaceholder, submitLabel, whatsappHeader}`; `footer{tagline, columns[{title, links[{label, href}]}], connectTitle, copyright}`; `seo{pages: Record<'home'|'about'|'media'|'faq'|'contact', {title, description}>, ogImageId}`.

- [ ] Step 1: tests — `formatHours(seed)` equals `["Mon–Fri · 11:00–19:30","Sat · 11:00–16:00","Sun · Closed"]`; `isOpenAt` Monday 12:00 KL true, Saturday 16:30 false, Sunday 12:00 false, Monday 04:00Z (=12:00 KL) true; `fillHours("Open {hours}.")`; schema rejects open "19:30" close "11:00"; `site` rejects map URL `https://example.com/map` with the map copy; `collectMediaIds` on nested sample.
- [ ] Step 2–4: fail → implement → `npm test -w shared` PASS.
- [ ] Step 5: commit.

### Task 3: Content seed from the current site

**Files:**
- Create: `server/seed/assets/*` (moved from `hero/`, `images/`, logos), `server/src/seed/{content,run}.ts`
- Delete: root `*.html`, `assets/`, `hero/`, `images/`, logos, `robots.txt`, `sitemap.xml` (preserved on `backup/static-site`)
- Test: `server/test/seed.test.ts`

**Interfaces:**
- Consumes: `processImage` (Task 4), `sectionSchemas`.
- Produces: `seedIfEmpty(db, cfg): Promise<boolean>`; `npm run db:seed -w server`. Content strings copied verbatim from the legacy HTML (except hours wording and the empty `<p></p>`); FAQ hours answer becomes "We’re open {hours}.".

- [ ] Step 1: test — after `seedIfEmpty` every `SECTION_KEYS` row exists and parses; `home.hero.title === "Ride Hard. We’ll keep you rolling."`; `faq.items.length === 9`; `media` has 10 photos + 3 logos; second call returns false.
- [ ] Step 2–4: fail → implement → PASS on both DBs. (Task 4 is implemented before this one in execution order.)
- [ ] Step 5: commit.

### Task 4: Media pipeline + media API

**Files:**
- Create: `server/src/media/{process,routes,repo}.ts`
- Test: `server/test/media.test.ts`, fixtures `server/test/fixtures/{photo.jpg,fake.jpg,logo.svg,evil.svg}`

**Interfaces:**
- Produces: `processImage(buf, originalName, {allowSvg}): Promise<{filename, mime, width, height}>` writing variants `{id}-{w}.webp`; `mediaView(row): {id, url, srcset, width, height, alt, mime}`; routes `GET/POST /api/admin/media`, `PATCH/DELETE /api/admin/media/:id`, static `/uploads` with `Cache-Control: public, max-age=31536000, immutable`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`.
- Delete: 409 `{error, usedIn: SectionKey[]}` if any current section references the id; else sets `deleted_at`.

- [ ] Step 1: tests — upload photo → 201, width ≤ 2400, files exist; fake.jpg → 415 "Only JPG, PNG or WebP images up to 15 MB."; 16 MB → 413 same copy; svg with `?purpose=logo` ok, `evil.svg` (`<script>`/`onload=`) → 415; svg without purpose → 415; delete in-use → 409 `usedIn:['home.hero']`; delete unused → 204, gone from list; every action writes an audit row.
- [ ] Step 2–4: fail → implement → PASS both DBs.
- [ ] Step 5: commit.

### Task 5: Auth, sessions, admins, CLI

**Files:**
- Create: `server/src/auth/{passwords,sessions,middleware,routes,ratelimit}.ts`, `server/src/users/routes.ts`, `server/src/audit/write.ts`, `server/src/cli/admin.ts`
- Test: `server/test/auth.test.ts`, `server/test/users.test.ts`

**Interfaces:**
- Produces: `writeAudit(trx, {user, action, targetType, targetKey, before?, after?, ip})` (`action` ∈ `section.update|section.restore|media.upload|media.update|media.delete|user.create|user.update|user.disable|user.enable|user.delete|user.password_reset|me.password_change|auth.login|auth.login_failed|auth.logout`); `requireAdmin` middleware sets `req.admin: {id, email, name}`; `originCheck`; `POST /api/auth/login|logout`, `GET /api/auth/me`; `/api/admin/users` CRUD + `POST /:id/password`; `PUT /api/admin/me/password`; `bootstrapAdmin(db, env)`; CLI `npm run admin:create -w server -- --email e --name n [--reset]` (password from `ADMIN_PASSWORD` env or prompt).

- [ ] Step 1: tests — login ok sets `fsid`; wrong → 401 copy; 6th attempt → 429 copy; `/api/admin/*` without cookie 401; POST without matching Origin 403; disable self → 400; delete last active admin → 400; disabled admin's session → 401; password change requires current; user responses never contain `password_hash`; audit rows for login/failed/logout/user ops contain no password text.
- [ ] Step 2–4: fail → implement → PASS both DBs.
- [ ] Step 5: commit.

### Task 6: Sections API + audit API + restore

**Files:**
- Create: `server/src/content/{repo,routes,public}.ts`, `server/src/audit/routes.ts`
- Test: `server/test/content.test.ts`, `server/test/audit.test.ts`

**Interfaces:**
- Produces: `GET /api/content` → `{sections: {[K]: data}, media: Record<id, MediaView>, version: string}` with ETag; `GET /api/admin/sections/:key` → `{key, data, version}`; `PUT` body `{data, version}` → 200 `{version}` | 409 copy | 422 `{error, issues}`; `GET /api/admin/audit?userId&targetKey&action&from&to&page&pageSize` → `{items, total}`; `POST /api/admin/audit/:id/restore` body `{which:'before'|'after'}`.

- [ ] Step 1: tests — save stats `1,800+ → 2,000+` then public content shows `2,000+`; stale version → 409; bad map URL → 422; audit newest is `section.update` by that admin with before/after; filter by `targetKey`; restore `before` → public `1,800+`, new `section.restore` row; restore of a section referencing a soft-deleted media un-deletes it; restore of data failing current schema → 422; deleted admin's audit rows keep `user_email`.
- [ ] Step 2–4: fail → implement → PASS both DBs.
- [ ] Step 5: commit.

### Task 7: SPA serving, per-page meta, redirects, sitemap

**Files:**
- Create: `server/src/web/{serve,meta}.ts`
- Test: `server/test/web.test.ts`

**Interfaces:**
- Produces: `renderHead(page, content, baseUrl): string` (title, description, canonical, og:*, twitter card, JSON-LD `BikeStore` with address, telephone `+<whatsapp>`, openingHoursSpecification, sameAs socials); index.html contains `<!--app-head-->`; `/admin*` adds `noindex`; unknown path → 404 with SPA shell; `GET /sitemap.xml`, `GET /robots.txt` (disallow `/admin`, `/api`).

- [ ] Step 1: tests — `/about.html` → 301 `/about`; `/faq` HTML contains seo faq title + canonical `${PUBLIC_BASE_URL}/faq`; `/admin` contains `noindex`; `/nope` 404; sitemap lists 5 URLs; HTML never contains `maps.googleapis.com/maps/api/js`.
- [ ] Step 2–4: fail → implement (fixture dist in test) → PASS.
- [ ] Step 5: commit.

### Task 8: Public site (React)

**Files:**
- Create: `web/` Vite app: `src/main.tsx`, `src/api.ts`, `src/content/{ContentContext,useSection,RichText,Img}.tsx`, `src/site/{Layout,Header,Footer,BackToTop,OpenBadge,PageTransition,SmoothScroll}.tsx`, `src/site/pages/{Home,About,Media,Faq,Contact,NotFound}.tsx`, `src/site/home/{Hero,Services,Stats,Process,MapBlock}.tsx`, `src/site/media/Lightbox.tsx`, `src/styles.css`
- Test: `web/test/{RichText,Contact,Stats}.test.tsx` (Vitest + Testing Library + jsdom)

**Interfaces:**
- Consumes: `/api/content` shape (Task 6), `formatHours`, `isOpenAt`, `fillHours`.
- Produces: `ContentProvider({value?, children})` (value override used by admin preview); `useSection<K>(key)`; `useMedia(id)`; `<RichText text>` supporting `**bold**` and `[label](href)` only; `<Img id sizes>`; page components render purely from content (no fetch inside) so admin can preview them.

- [ ] Step 1: tests — RichText renders `<strong>`, safe links, and renders `<script>` / `[x](javascript:alert(1))` as plain text; Contact submit with empty name shows "Please enter your name." and doesn't call `window.open`; valid submit calls `window.open` with `https://wa.me/601133321767?text=` containing `Name%3A%20Aiman`; Stats with reduced motion shows final values.
- [ ] Step 2–4: fail → implement visual design (design doc §4) → `npm test -w web` PASS; `npm run build -w web` clean.
- [ ] Step 5: commit.

### Task 9: Admin Panel (React)

**Files:**
- Create: `web/src/admin/{AdminApp,Login,Shell,api,useUnsaved}.tsx`, `web/src/admin/form/{fields,FormRenderer,ListField,MediaPicker,HoursField}.tsx`, `web/src/admin/sections/defs.ts` (field descriptors per `SectionKey`), `web/src/admin/pages/{SectionEditor,MediaLibrary,Admins,Audit,Account}.tsx`, `web/src/admin/Preview.tsx`
- Test: `web/test/admin/{FormRenderer,Audit}.test.tsx`

**Interfaces:**
- Consumes: all admin endpoints (Tasks 4–6), `sectionSchemas`, `SECTION_LABELS`, page components + `ContentProvider` (Task 8).
- Produces: field descriptor type `Field = {name, label, kind:'text'|'textarea'|'rich'|'url'|'color'|'number'|'select'|'media'|'mediaList'|'hours'|'list', options?, fields?, hint?}`.

- [ ] Step 1: tests — FormRenderer edits nested list item, reorders, and reports zod issues against the right field; 409 response shows conflict copy and keeps edits; Audit renders before/after diff with changed field highlighted.
- [ ] Step 2–4: fail → implement → PASS; build clean.
- [ ] Step 5: commit.

### Task 10: End-to-end, packaging, docs

**Files:**
- Create: `e2e/{playwright.config.ts, site.spec.ts, admin.spec.ts}`, `Dockerfile`, `.dockerignore`, `compose.yaml` (app + choose db via profile), `README.md`
- Test: e2e specs

- [ ] Step 1: e2e — public pages headings (RV01_AC1 table), redirect, WhatsApp popup URL, no googleapis request; admin login → change Saturday hours → public About/Contact show "Sat · 10:00–16:00" → audit shows entry → restore.
- [ ] Step 2: `npm run build && npm run e2e` against pg and mysql → PASS.
- [ ] Step 3: Lighthouse mobile on `/` → Perf ≥ 85, A11y ≥ 95, SEO ≥ 95; fix until met.
- [ ] Step 4: `docker build` + run with each DB → `/healthz` 200.
- [ ] Step 5: commit.
