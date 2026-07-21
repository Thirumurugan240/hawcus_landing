import pg from "pg";
import { DB } from "./config.js";

export const pool = new pg.Pool({ ...DB, max: 10, idleTimeoutMillis: 30000 });

export function query(text, params) {
  return pool.query(text, params);
}

/* Creates the schema if it does not exist. Safe to run on every boot. */
export async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      pass_hash   TEXT NOT NULL,
      pass_salt   TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id            SERIAL PRIMARY KEY,
      slug          TEXT NOT NULL UNIQUE,
      title         TEXT NOT NULL,
      category      TEXT NOT NULL DEFAULT 'WhatsApp CRM',
      excerpt       TEXT NOT NULL DEFAULT '',
      tldr          TEXT NOT NULL DEFAULT '',
      content       TEXT NOT NULL DEFAULT '',
      banner_grad   TEXT NOT NULL DEFAULT 'linear-gradient(135deg,#c2410c,#f97316)',
      read_minutes  INTEGER NOT NULL DEFAULT 5,
      status        TEXT NOT NULL DEFAULT 'draft',
      author_name   TEXT NOT NULL DEFAULT 'The Hawcus Team',
      published_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS post_faqs (
      id        SERIAL PRIMARY KEY,
      post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      question  TEXT NOT NULL,
      answer    TEXT NOT NULL,
      position  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS post_views (
      id          BIGSERIAL PRIMARY KEY,
      post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      visitor     TEXT NOT NULL,
      referrer    TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS read_sessions (
      id           BIGSERIAL PRIMARY KEY,
      post_id      INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      visitor      TEXT NOT NULL,
      seconds      INTEGER NOT NULL DEFAULT 0,
      scrolled_pct INTEGER NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status   ON posts(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_views_post     ON post_views(post_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reads_post     ON read_sessions(post_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_faqs_post      ON post_faqs(post_id, position);

    /* Added after the first release, so it has to be an ALTER for existing databases. */
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_avatar TEXT NOT NULL DEFAULT '';

    /* Enquiries are stored as well as emailed, so a mail outage never loses a lead. */
    CREATE TABLE IF NOT EXISTS leads (
      id         SERIAL PRIMARY KEY,
      kind       TEXT NOT NULL DEFAULT 'contact',
      name       TEXT NOT NULL DEFAULT '',
      email      TEXT NOT NULL DEFAULT '',
      phone      TEXT NOT NULL DEFAULT '',
      company    TEXT NOT NULL DEFAULT '',
      team_size  TEXT NOT NULL DEFAULT '',
      message    TEXT NOT NULL DEFAULT '',
      emailed    BOOLEAN NOT NULL DEFAULT false,
      mail_error TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
  `);
}

export async function createLead(data) {
  const { rows } = await query(
    `INSERT INTO leads (kind, name, email, phone, company, team_size, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      data.kind, data.name, data.email, data.phone,
      data.company, data.team_size, data.message,
    ]
  );
  return rows[0];
}

export async function markLeadEmailed(id, ok, error) {
  await query("UPDATE leads SET emailed = $1, mail_error = $2 WHERE id = $3", [
    ok, String(error || "").slice(0, 500), id,
  ]);
}

export async function listLeads(limit = 200) {
  const { rows } = await query(
    "SELECT * FROM leads ORDER BY created_at DESC LIMIT $1", [limit]
  );
  return rows;
}

/* ---------------- posts ---------------- */

export async function listPosts({ status } = {}) {
  const where = status ? "WHERE p.status = $1" : "";
  const params = status ? [status] : [];
  const { rows } = await query(
    `SELECT p.*,
            COALESCE(v.views, 0)      AS views,
            COALESCE(r.avg_secs, 0)   AS avg_secs
       FROM posts p
       LEFT JOIN (SELECT post_id, COUNT(*)::int AS views FROM post_views GROUP BY post_id) v
              ON v.post_id = p.id
       LEFT JOIN (SELECT post_id, AVG(seconds)::float AS avg_secs FROM read_sessions
                   WHERE seconds BETWEEN 3 AND 7200 GROUP BY post_id) r
              ON r.post_id = p.id
       ${where}
      ORDER BY COALESCE(p.published_at, p.created_at) DESC`,
    params
  );
  return rows;
}

export async function getPostBySlug(slug, { publishedOnly = true } = {}) {
  const { rows } = await query(
    `SELECT * FROM posts WHERE slug = $1 ${publishedOnly ? "AND status = 'published'" : ""} LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

export async function getPostById(id) {
  const { rows } = await query("SELECT * FROM posts WHERE id = $1", [id]);
  return rows[0] || null;
}

/* Every category currently in use, so custom ones the author invented stay
   available in the editor dropdown instead of vanishing after one post. */
export async function listCategories() {
  const { rows } = await query(
    "SELECT DISTINCT category FROM posts WHERE category <> '' ORDER BY category"
  );
  return rows.map((r) => r.category);
}

export async function getFaqs(postId) {
  const { rows } = await query(
    "SELECT id, question, answer, position FROM post_faqs WHERE post_id = $1 ORDER BY position, id",
    [postId]
  );
  return rows;
}

export async function createPost(data) {
  const { rows } = await query(
    `INSERT INTO posts (slug, title, category, excerpt, tldr, content, banner_grad,
                        read_minutes, status, author_name, author_avatar, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      data.slug, data.title, data.category, data.excerpt, data.tldr, data.content,
      data.banner_grad, data.read_minutes, data.status, data.author_name,
      data.author_avatar || "",
      data.status === "published" ? new Date() : null,
    ]
  );
  return rows[0];
}

export async function updatePost(id, data) {
  const current = await getPostById(id);
  if (!current) return null;
  // stamp published_at the first time a post goes live, keep it stable after that
  const publishedAt =
    data.status === "published" ? current.published_at || new Date() : null;
  const { rows } = await query(
    `UPDATE posts SET slug=$1, title=$2, category=$3, excerpt=$4, tldr=$5, content=$6,
                      banner_grad=$7, read_minutes=$8, status=$9, author_name=$10,
                      author_avatar=$11, published_at=$12, updated_at=now()
      WHERE id=$13 RETURNING *`,
    [
      data.slug, data.title, data.category, data.excerpt, data.tldr, data.content,
      data.banner_grad, data.read_minutes, data.status, data.author_name,
      data.author_avatar || "", publishedAt, id,
    ]
  );
  return rows[0];
}

export async function deletePost(id) {
  await query("DELETE FROM posts WHERE id = $1", [id]);
}

export async function replaceFaqs(postId, faqs) {
  await query("DELETE FROM post_faqs WHERE post_id = $1", [postId]);
  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    if (!f || !String(f.question || "").trim()) continue;
    await query(
      "INSERT INTO post_faqs (post_id, question, answer, position) VALUES ($1,$2,$3,$4)",
      [postId, f.question, f.answer || "", i]
    );
  }
}

/* ---------------- analytics ---------------- */

export async function recordView(postId, visitor, referrer) {
  // one view per visitor per post per 30 minutes, so refreshes do not inflate counts
  const { rows } = await query(
    `SELECT 1 FROM post_views
      WHERE post_id = $1 AND visitor = $2 AND created_at > now() - interval '30 minutes'
      LIMIT 1`,
    [postId, visitor]
  );
  if (rows.length) return false;
  await query(
    "INSERT INTO post_views (post_id, visitor, referrer) VALUES ($1,$2,$3)",
    [postId, visitor, (referrer || "").slice(0, 300)]
  );
  return true;
}

export async function recordRead(postId, visitor, seconds, scrolledPct) {
  await query(
    "INSERT INTO read_sessions (post_id, visitor, seconds, scrolled_pct) VALUES ($1,$2,$3,$4)",
    [postId, visitor, Math.max(0, Math.min(7200, Math.round(seconds))), Math.max(0, Math.min(100, Math.round(scrolledPct || 0)))]
  );
}

export async function analyticsOverview() {
  const totals = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM posts WHERE status = 'published')      AS published,
      (SELECT COUNT(*)::int FROM posts WHERE status = 'draft')          AS drafts,
      (SELECT COUNT(*)::int FROM post_views)                            AS total_views,
      (SELECT COUNT(DISTINCT visitor)::int FROM post_views)             AS unique_visitors,
      (SELECT COALESCE(AVG(seconds), 0)::float FROM read_sessions
        WHERE seconds BETWEEN 3 AND 7200)                               AS avg_secs,
      (SELECT COUNT(*)::int FROM post_views
        WHERE created_at > now() - interval '7 days')                   AS views_7d
  `);

  const perPost = await query(`
    SELECT p.id, p.slug, p.title, p.category, p.status, p.published_at, p.read_minutes,
           COALESCE(v.views, 0)                                  AS views,
           COALESCE(v.uniques, 0)                                AS uniques,
           COALESCE(r.avg_secs, 0)                               AS avg_secs,
           COALESCE(r.reads, 0)                                  AS reads,
           COALESCE(r.avg_scroll, 0)                             AS avg_scroll
      FROM posts p
      LEFT JOIN (SELECT post_id, COUNT(*)::int AS views,
                        COUNT(DISTINCT visitor)::int AS uniques
                   FROM post_views GROUP BY post_id) v ON v.post_id = p.id
      LEFT JOIN (SELECT post_id, AVG(seconds)::float AS avg_secs,
                        COUNT(*)::int AS reads,
                        AVG(scrolled_pct)::float AS avg_scroll
                   FROM read_sessions WHERE seconds BETWEEN 3 AND 7200
                  GROUP BY post_id) r ON r.post_id = p.id
     ORDER BY views DESC, p.created_at DESC
  `);

  const daily = await query(`
    SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(c.views, 0)::int AS views
      FROM generate_series(current_date - interval '13 days', current_date, interval '1 day') AS d(day)
      LEFT JOIN (SELECT date_trunc('day', created_at) AS day, COUNT(*) AS views
                   FROM post_views
                  WHERE created_at > now() - interval '14 days'
                  GROUP BY 1) c ON c.day = d.day
     ORDER BY d.day
  `);

  return { totals: totals.rows[0], posts: perPost.rows, daily: daily.rows };
}

/* ---------------- users ---------------- */

export async function findUserByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
  return rows[0] || null;
}

export async function createUser({ email, name, hash, salt }) {
  const { rows } = await query(
    `INSERT INTO users (email, name, pass_hash, pass_salt) VALUES ($1,$2,$3,$4)
     ON CONFLICT (email) DO NOTHING RETURNING *`,
    [email, name, hash, salt]
  );
  return rows[0] || null;
}

export async function countUsers() {
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM users");
  return rows[0].n;
}
