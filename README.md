# Hawcus CRM site + blog CMS

Marketing site, a Postgres-backed blog, and an admin dashboard for writing posts and
reading their performance. No build step: plain HTML, CSS and vanilla JS, with a small
Node server in front.

## Requirements

- Node 18 or newer
- Docker Desktop (for Postgres)

## First run

```bash
npm install        # installs the pg driver (the only dependency)
npm run db:up      # pulls postgres:16-alpine and starts it on port 5433
npm run seed       # creates the admin user and imports the 3 existing articles
npm start          # serves the site on http://localhost:8080
```

| URL | What it is |
| --- | --- |
| `http://localhost:8080/` | Marketing site (static files) |
| `http://localhost:8080/blog/` | Blog index, rendered from Postgres |
| `http://localhost:8080/blog/<slug>/` | Article, rendered from Postgres |
| `http://localhost:8080/admin` | Admin dashboard |

**Default login:** `admin@hawcus.com` / `hawcus123`
Change it by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` before running `npm run seed`.

## Daily use

```bash
npm run db:up      # if Docker was restarted
npm start
```

`npm run db:down` stops the database. Data survives in the `hawcus-pgdata` Docker volume,
so posts and analytics are not lost between restarts.

## Admin dashboard

- **Dashboard** - total clicks, unique readers, average read time, a 14-day click chart,
  and your top posts.
- **Posts** - every post with status, publish date and click count. Edit or view any of them.
- **Write** - title, slug, excerpt, TL;DR, content (HTML, with a formatting toolbar and a
  live preview), FAQs, category, author, author picture and read time. Save as a draft or
  publish. Publishing is instant: the blog reads from the same database.

  The category dropdown lists the five built-in categories plus any you have invented.
  Pick "+ New category..." to type your own; it gets its own banner colour and appears as a
  filter on the blog index from then on.

  The author picture is uploaded to `assets/authors/`, named after a hash of its contents so
  the same image is never stored twice. PNG, JPG or WebP, up to 2 MB. Without one, the
  author's initial is shown in a circle as before.
- **Analytics** - clicks, unique visitors, average reading time, number of read sessions and
  average scroll depth, per post.

Drafts are not listed publicly and return 404 to visitors, but an admin can preview one at
`/blog/<slug>/?preview=1`.

## How the metrics are measured

**Clicks** - one row per visitor per post, deduplicated to one view per 30 minutes so a
refresh does not inflate the count. The visitor id is a salted hash of IP and user agent;
no raw IP is stored.

**Average reading minutes** - `js/track.js` counts only the time the tab is actually
visible, then reports once when the reader leaves via `navigator.sendBeacon`. Sessions
under 3 seconds or over 2 hours are discarded so bounces and forgotten tabs do not skew
the average. Scroll depth is recorded alongside it.

## Configuration

Everything has a working default; override with environment variables.

Secrets live in `.env` in the project root, which is gitignored and never web-served.
The server reads it automatically at startup.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port |
| `PGHOST` / `PGPORT` | `localhost` / `5433` | Database location |
| `PGUSER` / `PGPASSWORD` / `PGDATABASE` | `hawcus` / `hawcus_dev_pw` / `hawcus` | Credentials |
| `SESSION_SECRET` | dev value | Signs admin session cookies. **Set a real one in production.** |
| `SESSION_HOURS` | `12` | How long a login lasts |
| `SITE_ORIGIN` | `https://hawcus.com` | Used for canonical URLs, Open Graph and the sitemap |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `465` | Outbound mail server |
| `SMTP_USER` / `SMTP_PASS` | none | Mailbox that sends enquiries. **Set in `.env`, never in code.** |
| `LEAD_TO` | falls back to `SMTP_USER` | Where contact and demo enquiries are delivered |

## Layout

```
server.js              HTTP server and routing
lib/config.js          Configuration and defaults
lib/db.js              Schema, queries and analytics aggregation
lib/auth.js            scrypt password hashing, signed session cookies
lib/render.js          Server-side rendering for the blog index and articles
lib/chrome.js          Header and footer extracted from the static site
admin/                 Admin dashboard (HTML, CSS, JS)
scripts/seed.js        Creates the admin user and imports the original articles
js/track.js            Reading-time beacon on article pages
docker-compose.yml     Postgres 16
```

## SEO

Articles are server-rendered as complete HTML, so crawlers see the full content with no
JavaScript required. Each page emits canonical, Open Graph and Twitter tags plus
`BlogPosting` structured data, and FAQs are published as `FAQPage` data. `/sitemap.xml`
is generated from the database, so new posts appear in it as soon as they go live.

## Note on the old static blog files

The files under `blog/` are the original hand-built articles. They were imported into the
database by `npm run seed`, and the server now answers `/blog/...` from Postgres, so those
files are no longer served. They are kept as a reference and can be deleted once you are
happy with the database copies.
