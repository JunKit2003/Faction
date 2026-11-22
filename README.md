# Faction Bikeworks website

The public website for Faction Bikeworks (Bukit Kiara, Kuala Lumpur) plus an **Admin Panel** where shop staff can change everything you see on the site: text, photos, logos, opening hours, stats, services, FAQs, social links, the WhatsApp number, the map and Google titles. Every change is recorded in an **audit log** and can be undone.

- **Site:** React (Vite), served by the Node app. Pages: Home, About, Media, FAQ, Contact.
- **Admin Panel:** `/admin`. It works on phones.
- **Backend:** Node 20+ / Express. One process serves the site, the admin panel, the API and uploaded images.
- **Database:** **MySQL 8+ or PostgreSQL 14+**. You pick one with a single setting.

Design and acceptance spec: `docs/plans/2026-11-22-website-revamp-admin-design.md`, `docs/website-revamp-admin-spec.md`.

---

## For the host: deploying

### What you need

- Node.js **20.11 or newer** (or Docker)
- An empty MySQL 8+ **or** PostgreSQL 14+ database
- A folder that **survives redeploys** for uploaded images
- HTTPS in front of it (any reverse proxy, e.g. nginx, Caddy or your host's panel)

The app creates its tables, loads the starting content and photos on first start, and can create the first admin for you.

### Settings

Copy `.env.example` to `.env` and fill it in:

| Setting | Example | Notes |
|---|---|---|
| `DB_CLIENT` | `mysql` or `pg` | Which database you're using. |
| `DATABASE_URL` | `mysql://user:pass@db-host:3306/faction` or `postgres://user:pass@db-host:5432/faction` | The database must already exist (it can be empty). |
| `PUBLIC_BASE_URL` | `https://www.factionbikeworks.com` | The exact public address, no trailing slash. Used for Google links and the sitemap, and to block forged requests. If it starts with `https://`, the login cookie is HTTPS-only. |
| `PORT` | `3000` | Port the app listens on, behind your proxy. |
| `UPLOAD_DIR` | `/srv/faction/uploads` | Where uploaded photos are stored. **Must persist and be backed up.** Relative paths are relative to this repo folder. |
| `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` / `ADMIN_BOOTSTRAP_NAME` | | Optional. Creates the first admin, but only when there are no admins yet. Remove the password afterwards. |
| `NODE_ENV` | `production` | |

### Option A: plain Node

```bash
npm ci
npm run build                  # builds the site and the server
npm run start                  # runs migrations + first-time seed, then serves on $PORT
```

Keep it running with your host's process manager (systemd, PM2, cPanel "Setup Node.js App" with startup file `server/dist/main.js`, etc.).

### Option B: Docker

```bash
cp .env.example .env           # then edit it
# With a bundled PostgreSQL:
DB_CLIENT=pg    docker compose --profile pg up -d --build
# With a bundled MySQL (also set DATABASE_URL=mysql://faction:<DB_PASSWORD>@mysql:3306/faction):
DB_CLIENT=mysql docker compose --profile mysql up -d --build
# Using your own database server instead (set DATABASE_URL in .env):
docker compose up -d --build app
```

Uploads live in the `uploads` Docker volume. If your network inspects TLS traffic and `npm ci` fails with `SELF_SIGNED_CERT_IN_CHAIN`, build with `docker build --secret id=ca,src=/path/to/your-ca.crt .`

### Reverse proxy

Point your proxy at `http://127.0.0.1:3000` and pass the usual `X-Forwarded-*` headers. The app trusts proxy headers from loopback and private-network addresses only. Health check: `GET /healthz` returns `{"ok":true,"db":true}`, or **503** if the database is down.

### First admin

Either set the `ADMIN_BOOTSTRAP_*` settings before the first start, or run:

```bash
npm run admin:create -w server -- --email owner@factionbikeworks.com --name "Owner"
# forgot a password with no other admin around?
npm run admin:create -w server -- --email owner@factionbikeworks.com --reset
```

(Run `npm run build` first. With Docker: `docker compose exec app node server/dist/cli/admin.js --email … --name …`.) The password is asked for interactively, or read from `ADMIN_PASSWORD`. Admins can add each other in **Admin → Admins**.

### Backups

Back up **both** of these:

1. The database: `pg_dump` / `mysqldump` of the `faction` database.
2. The `UPLOAD_DIR` folder, which holds the photos.

### Old links

The old addresses (`/about.html`, `/gallery.html`, …) permanently redirect to the new pages. `/sitemap.xml` and `/robots.txt` are generated automatically.

> **Security note for the owner:** the old static site had a Google Maps API key in its public git history. That key isn't used any more. Delete or rotate it in Google Cloud Console.

---

## For the shop: using the Admin Panel

Go to `https://<your site>/admin` and sign in. Press **⌘K / Ctrl+K** anywhere to jump straight to a setting (try “hours” or “logo”).

- **Dashboard:** open/closed right now, this week’s hours, photos missing descriptions, quick actions and the latest activity.
- **Shop details:** name, address, WhatsApp number, opening hours, map, logos, accent colour, social links and small labels. Used all over the site.
- **Homepage:** one tab per block, top to bottom (Top banner, Ticker, Services, Numbers, How it works, Why us, Visit us, Closing banner).
- **Pages:** About, Media gallery, FAQ and Contact.
- **Menu & footer**, and **Search & sharing** (Google titles and descriptions, share image).
- **Photos:** upload (JPG, PNG or WebP up to 15 MB; resized automatically, location data removed). The description is used as the caption and for screen readers. Photos in use can't be deleted.
- **Admins** and **Activity:** who can sign in, and who changed what, with before/after and **restore**.

Editing works the same everywhere. Change things in the cards, watch the live preview, then press **Save changes**. Saved changes go live immediately, and **Discard** undoes everything you haven't saved. In lists (services, FAQs, links), press the pencil to edit an item in a pop-up, drag or use the arrows to reorder, and the bin to remove.

Big headlines understand two marks: `_word_` draws the word as an outline, and `*word*` makes it lime. For example, `Ride _hard._ We’ll keep you *rolling.*`. Normal text understands `**bold**` and `[link text](/contact)`, and in FAQ answers `{hours}` is replaced with the opening hours.

If someone else saved the same part while you were editing, you'll see *"Someone else changed this, reload to see their version."* Your edits stay on screen.

---

## For developers

```bash
npm install
docker compose -f compose.pg.yaml up -d      # dev/test PostgreSQL on :54321
docker compose -f compose.mysql.yaml up -d   # dev/test MySQL on :33061
cp .env.example .env                         # point DATABASE_URL at a dev database (not "faction", tests wipe it)
npm run dev -w server                        # API on :3000
npm run dev -w web                           # site on :5173 (proxies /api and /uploads)
```

| Command | What it does |
|---|---|
| `npm test` | Shared + server tests on **both** PostgreSQL and MySQL + web tests |
| `npm run e2e` / `E2E_DB=mysql npm run e2e` | Builds must exist (`npm run build`). Playwright against a throwaway `faction_e2e` database |
| `npm run typecheck` | TypeScript in every workspace |

Layout:

```
shared/   section schemas (zod, in @faction/shared/schemas), hours + rich-text helpers
server/   Express app: auth, sections, media, audit, SEO/HTML serving, migrations, seed
web/      React app: public site (src/site) and admin panel (src/admin, lazy-loaded)
e2e/      Playwright end-to-end tests
```

Database rules (they keep both databases working): only `varchar`, `text`/`longtext` and `integer` columns. Times are ISO strings, IDs are app-generated sortable strings, and there are no booleans. New migrations go in `server/src/db/migrations.ts`.
