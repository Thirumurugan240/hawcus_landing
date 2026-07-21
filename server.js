import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PORT, SITE_ORIGIN, MAIL_READY } from "./lib/config.js";
import { sendLead } from "./lib/mail.js";
import * as db from "./lib/db.js";
import { login, createSessionCookie, clearSessionCookie, readSession, visitorId } from "./lib/auth.js";
import { renderBlogIndex, renderArticle, slugify, estimateMinutes, gradFor, CATEGORIES } from "./lib/render.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

/* ---------------- helpers ---------------- */

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", ...headers });
  res.end(body);
}

function json(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), { "Content-Type": "application/json; charset=utf-8", ...headers });
}

async function readBody(req, limit = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("payload too large");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("invalid JSON body");
  }
}

function requireAuth(req, res) {
  const session = readSession(req);
  if (!session) {
    json(res, 401, { error: "Not signed in" });
    return null;
  }
  return session;
}

/* Only these directories are web-served. Everything else (lib/, scripts/, data/,
   node_modules/, server.js, package.json, docker-compose.yml) stays private. */
const PUBLIC_DIRS = new Set(["css", "js", "assets", "client-logos", "admin", "blog", "features"]);

/* Static pages built by scripts/build-features.js, listed here for the sitemap. */
const FEATURE_SLUGS = [
  "whatsapp-api",
  "lead-management",
  "auto-follow-ups",
  "integrations",
  "lead-capture",
  "whatsapp-crm",
  "smart-triggers",
  "dialer-app",
];
/* Root-level files may only be served with these extensions, which keeps
   server.js, package.json, docker-compose.yml and README.md unreachable. */
const PUBLIC_ROOT_EXT = new Set([".html", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".txt", ".xml", ".webmanifest"]);

function isPublicPath(rel) {
  const segments = rel.split(/[/\\]/).filter(Boolean);
  if (!segments.length) return false;
  if (segments.some((s) => s.startsWith("."))) return false;

  if (segments.length === 1) {
    return PUBLIC_ROOT_EXT.has(path.extname(segments[0]).toLowerCase());
  }
  return PUBLIC_DIRS.has(segments[0]);
}

async function serveStatic(req, res, urlPath) {
  // block traversal, then resolve inside the project root only
  const safe = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  if (!isPublicPath(safe)) return false;

  let filePath = path.join(ROOT, safe);
  if (!filePath.startsWith(ROOT + path.sep)) return false;

  try {
    let stat = await fsp.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      stat = await fsp.stat(filePath);
    }
    const ext = path.extname(filePath).toLowerCase();
    /* The admin panel changes often and is only used by us, so never cache it.
       A stale admin.js silently breaks buttons that look fine in the markup. */
    const isAdmin = safe.split(/[/\\]/).filter(Boolean)[0] === "admin";
    const isAsset = ext !== ".html";
    /* Stylesheets and scripts change on nearly every edit, and a stale copy of
       either breaks the page in ways that look like a bug in the markup. Serve
       them revalidating; images and fonts still cache properly.
       Set ASSET_CACHE=long once the site is stable to cache CSS and JS too. */
    const churns = ext === ".css" || ext === ".js";
    const longCache = process.env.ASSET_CACHE === "long";
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": isAdmin
        ? "no-store"
        : !isAsset || (churns && !longCache)
        ? "no-cache"
        : "public, max-age=3600",
      "Content-Length": stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

/* Normalises whatever the editor submitted into a valid post row. */
function normalisePost(body, existingSlug) {
  const title = String(body.title || "").trim();
  if (!title) throw new Error("Title is required");

  const content = String(body.content || "");
  /* Any category the author types is allowed, not just the built-in five.
     Collapse whitespace and cap the length so it stays usable as a filter pill. */
  const category = String(body.category || "").replace(/\s+/g, " ").trim().slice(0, 40) || CATEGORIES[0];
  const slug = slugify(body.slug || title) || existingSlug || `post-${Date.now()}`;
  const status = body.status === "published" ? "published" : "draft";

  return {
    slug,
    title,
    category,
    excerpt: String(body.excerpt || "").trim().slice(0, 400),
    tldr: String(body.tldr || "").trim().slice(0, 900),
    content,
    banner_grad: gradFor(category, null),
    read_minutes: Number(body.read_minutes) > 0 ? Math.min(120, Number(body.read_minutes)) : estimateMinutes(content),
    status,
    author_name: String(body.author_name || "The Hawcus Team").trim().slice(0, 80),
    /* Only paths we wrote ourselves, so a stored value can never be javascript: or
       point at a third-party tracker. */
    author_avatar: /^\/assets\/authors\/[A-Za-z0-9._-]+$/.test(String(body.author_avatar || ""))
      ? String(body.author_avatar)
      : "",
  };
}

/* ---------------- enquiry submissions ---------------- */

/* A public unauthenticated endpoint, so cap how often one address can post.
   Enough to stop a script filling the inbox, loose enough that a real person
   correcting a mistake is never blocked. */
const leadHits = new Map();
const LEAD_WINDOW_MS = 10 * 60 * 1000;
const LEAD_MAX = 5;

function recentLeads(ip) {
  const now = Date.now();
  const hits = (leadHits.get(ip) || []).filter((t) => now - t < LEAD_WINDOW_MS);
  leadHits.set(ip, hits);
  return hits;
}

function leadRateLimited(ip) {
  return recentLeads(ip).length >= LEAD_MAX;
}

/* Counted only once a submission is accepted, so someone mistyping their email
   several times is never locked out. */
function recordLead(ip) {
  const hits = recentLeads(ip);
  hits.push(Date.now());
  leadHits.set(ip, hits);
  if (leadHits.size > 5000) leadHits.clear(); // crude bound on memory
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function normaliseLead(body) {
  const kind = body.kind === "demo" ? "demo" : "contact";
  const lead = {
    kind,
    name: clean(body.name, 120),
    email: clean(body.email, 160),
    phone: clean(body.phone, 30).replace(/[^\d+ ]/g, ""),
    company: clean(body.company || body.business, 160),
    team_size: clean(body.team_size, 40),
    message: String(body.message ?? "").trim().slice(0, 2000),
  };

  if (!lead.name) throw new Error("Name is required");
  if (!EMAIL_RE.test(lead.email)) throw new Error("A valid email is required");
  if (kind === "demo") {
    if (!lead.company) throw new Error("Business name is required");
    if (lead.phone.replace(/\D/g, "").length < 10) throw new Error("A valid contact number is required");
  }
  return lead;
}

function leadFields(lead) {
  return [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone && `+91 ${lead.phone}`],
    ["Business", lead.company],
    ["Team size", lead.team_size],
    ["Message", lead.message],
  ];
}

/* ---------------- author picture uploads ---------------- */

const AVATAR_DIR = path.join(ROOT, "assets", "authors");
const AVATAR_TYPES = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

async function saveAvatar(dataUrl) {
  const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(dataUrl || ""));
  if (!m) throw new Error("Expected an image file");

  const ext = AVATAR_TYPES[m[1].toLowerCase()];
  if (!ext) throw new Error("Use a PNG, JPG or WebP image");

  const buf = Buffer.from(m[2], "base64");
  if (!buf.length) throw new Error("That file looks empty");
  if (buf.length > AVATAR_MAX_BYTES) throw new Error("Image must be under 2 MB");

  /* Name the file after its contents, so re-uploading the same picture reuses it. */
  const name = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16) + ext;
  await fsp.mkdir(AVATAR_DIR, { recursive: true });
  await fsp.writeFile(path.join(AVATAR_DIR, name), buf);
  return `/assets/authors/${name}`;
}

/* ---------------- routing ---------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  try {
    /* ---------- public blog (rendered from Postgres) ---------- */

    if (req.method === "GET" && (pathname === "/blog" || pathname === "/blog/")) {
      const posts = await db.listPosts({ status: "published" });
      return send(res, 200, renderBlogIndex(posts), { "Cache-Control": "no-cache" });
    }

    const articleMatch = /^\/blog\/([a-z0-9-]+)\/?$/.exec(pathname);
    if (req.method === "GET" && articleMatch) {
      const slug = articleMatch[1];
      const preview = url.searchParams.get("preview") === "1" && readSession(req);
      const post = await db.getPostBySlug(slug, { publishedOnly: !preview });
      if (!post) {
        return send(res, 404, notFoundPage(), { "Cache-Control": "no-cache" });
      }
      const [faqs, all] = await Promise.all([
        db.getFaqs(post.id),
        db.listPosts({ status: "published" }),
      ]);
      const related = all.filter((p) => p.id !== post.id).slice(0, 2);

      if (post.status === "published") {
        db.recordView(post.id, visitorId(req), req.headers.referer || "").catch(() => {});
      }
      return send(res, 200, renderArticle(post, faqs, related), { "Cache-Control": "no-cache" });
    }

    /* ---------- reading-time beacon ---------- */

    if (req.method === "POST" && pathname === "/api/track/read") {
      const body = await readBody(req, 5000);
      const postId = Number(body.postId);
      const seconds = Number(body.seconds);
      if (!Number.isFinite(postId) || !Number.isFinite(seconds) || seconds < 3) {
        return json(res, 204, {});
      }
      await db.recordRead(postId, visitorId(req), seconds, Number(body.scrolled) || 0);
      return json(res, 204, {});
    }

    /* ---------- dynamic sitemap ---------- */

    if (req.method === "GET" && pathname === "/sitemap.xml") {
      const posts = await db.listPosts({ status: "published" });
      const urls = [
        { loc: `${SITE_ORIGIN}/`, pri: "1.0" },
        { loc: `${SITE_ORIGIN}/pricing.html`, pri: "0.9" },
        { loc: `${SITE_ORIGIN}/book-a-demo.html`, pri: "0.9" },
        ...FEATURE_SLUGS.map((s) => ({ loc: `${SITE_ORIGIN}/features/${s}/`, pri: "0.8" })),
        { loc: `${SITE_ORIGIN}/blog/`, pri: "0.8" },
        { loc: `${SITE_ORIGIN}/privacy.html`, pri: "0.3" },
        { loc: `${SITE_ORIGIN}/terms.html`, pri: "0.3" },
        ...posts.map((p) => ({
          loc: `${SITE_ORIGIN}/blog/${p.slug}/`,
          pri: "0.7",
          lastmod: new Date(p.updated_at).toISOString().slice(0, 10),
        })),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<priority>${u.pri}</priority></url>`).join("\n")}
</urlset>`;
      return send(res, 200, xml, { "Content-Type": "application/xml; charset=utf-8" });
    }

    /* ---------- admin auth ---------- */

    if (req.method === "POST" && pathname === "/api/admin/login") {
      const { email, password } = await readBody(req, 10000);
      const user = await login(String(email || ""), String(password || ""));
      if (!user) return json(res, 401, { error: "Wrong email or password" });
      return json(res, 200, { ok: true, user: { name: user.name, email: user.email } }, {
        "Set-Cookie": createSessionCookie(user),
      });
    }

    if (req.method === "POST" && pathname === "/api/admin/logout") {
      return json(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
    }

    if (req.method === "GET" && pathname === "/api/admin/me") {
      const session = readSession(req);
      if (!session) return json(res, 401, { error: "Not signed in" });
      return json(res, 200, { user: { name: session.name, email: session.email } });
    }

    /* ---------- enquiries from the contact and demo forms ---------- */

    if (pathname === "/api/leads" && req.method === "POST") {
      const ip = req.socket.remoteAddress || "unknown";
      if (leadRateLimited(ip)) {
        return json(res, 429, { error: "Too many submissions. Please try again shortly." });
      }

      const body = await readBody(req, 20000);
      // a bot filling every field trips this; a human never sees it
      if (body.website) return json(res, 200, { ok: true });

      let lead;
      try {
        lead = normaliseLead(body);
      } catch (err) {
        return json(res, 400, { error: err.message });
      }

      /* Store first. If the mail fails the enquiry is still safe in the database
         rather than silently lost. */
      const row = await db.createLead(lead);
      recordLead(ip);

      if (!MAIL_READY) {
        console.warn("Lead saved but mail is not configured:", row.id);
        return json(res, 200, { ok: true, emailed: false });
      }

      try {
        await sendLead({ kind: lead.kind, fields: leadFields(lead) });
        await db.markLeadEmailed(row.id, true, "");
        return json(res, 200, { ok: true, emailed: true });
      } catch (err) {
        await db.markLeadEmailed(row.id, false, err.message);
        console.error("Lead email failed:", err.message);
        // the visitor has done nothing wrong, so still confirm to them
        return json(res, 200, { ok: true, emailed: false });
      }
    }

    if (pathname === "/api/admin/leads" && req.method === "GET") {
      const session = requireAuth(req, res);
      if (!session) return;
      return json(res, 200, { leads: await db.listLeads() });
    }

    /* ---------- author picture upload ---------- */

    if (pathname === "/api/admin/upload" && req.method === "POST") {
      const session = requireAuth(req, res);
      if (!session) return;
      // base64 inflates by a third, so allow room for a 2 MB image
      const body = await readBody(req, 3_500_000);
      try {
        const url = await saveAvatar(body.data);
        return json(res, 200, { url });
      } catch (err) {
        return json(res, 400, { error: err.message });
      }
    }

    /* ---------- admin posts CRUD ---------- */

    if (pathname === "/api/admin/posts") {
      const session = requireAuth(req, res);
      if (!session) return;

      if (req.method === "GET") {
        const [posts, used] = await Promise.all([db.listPosts(), db.listCategories()]);
        const categories = [...new Set([...CATEGORIES, ...used])];
        return json(res, 200, { posts, categories });
      }

      if (req.method === "POST") {
        const body = await readBody(req);
        const data = normalisePost(body);
        const existing = await db.getPostBySlug(data.slug, { publishedOnly: false });
        if (existing) data.slug = `${data.slug}-${Date.now().toString(36).slice(-4)}`;
        const post = await db.createPost(data);
        await db.replaceFaqs(post.id, Array.isArray(body.faqs) ? body.faqs : []);
        return json(res, 201, { post });
      }
    }

    const postIdMatch = /^\/api\/admin\/posts\/(\d+)$/.exec(pathname);
    if (postIdMatch) {
      const session = requireAuth(req, res);
      if (!session) return;
      const id = Number(postIdMatch[1]);

      if (req.method === "GET") {
        const post = await db.getPostById(id);
        if (!post) return json(res, 404, { error: "Post not found" });
        const faqs = await db.getFaqs(id);
        return json(res, 200, { post, faqs });
      }

      if (req.method === "PUT") {
        const body = await readBody(req);
        const current = await db.getPostById(id);
        if (!current) return json(res, 404, { error: "Post not found" });
        const data = normalisePost(body, current.slug);
        const clash = await db.getPostBySlug(data.slug, { publishedOnly: false });
        if (clash && clash.id !== id) data.slug = `${data.slug}-${id}`;
        const post = await db.updatePost(id, data);
        await db.replaceFaqs(id, Array.isArray(body.faqs) ? body.faqs : []);
        return json(res, 200, { post });
      }

      if (req.method === "DELETE") {
        await db.deletePost(id);
        return json(res, 200, { ok: true });
      }
    }

    /* ---------- admin analytics ---------- */

    if (req.method === "GET" && pathname === "/api/admin/analytics") {
      const session = requireAuth(req, res);
      if (!session) return;
      return json(res, 200, await db.analyticsOverview());
    }

    /* ---------- admin UI ---------- */

    if (pathname === "/admin" || pathname === "/admin/") {
      return serveStatic(req, res, "/admin/index.html").then((ok) => {
        if (!ok) send(res, 404, notFoundPage());
      });
    }

    /* ---------- static site ---------- */

    if (req.method === "GET" || req.method === "HEAD") {
      const served = await serveStatic(req, res, pathname === "/" ? "/index.html" : pathname);
      if (served) return;
    }

    return send(res, 404, notFoundPage(), { "Cache-Control": "no-cache" });
  } catch (err) {
    console.error(`[${req.method} ${pathname}]`, err.message);
    if (pathname.startsWith("/api/")) return json(res, 400, { error: err.message });
    return send(res, 500, "<h1>500 Server error</h1>");
  }
});

function notFoundPage() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />
<title>Not found | Hawcus</title><link rel="stylesheet" href="/css/styles.css" /></head>
<body><main style="display:grid;place-items:center;min-height:70vh;text-align:center;padding:2rem">
<div><h1 style="font-size:3rem">404</h1><p style="font-weight:600;margin:1rem 0 1.5rem">That page does not exist.</p>
<a class="btn btn--primary" href="/">Back to home</a></div></main></body></html>`;
}

/* ---------------- boot ---------------- */

async function start() {
  try {
    await db.migrate();
    console.log("Database ready.");
  } catch (err) {
    console.error("\nCould not reach Postgres.");
    console.error("  " + err.message);
    console.error("\nStart the database first:  npm run db:up\n");
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`\n  Hawcus site   http://localhost:${PORT}/`);
    console.log(`  Blog          http://localhost:${PORT}/blog/`);
    console.log(`  Admin panel   http://localhost:${PORT}/admin\n`);
  });
}

start();
