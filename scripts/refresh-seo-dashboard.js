try {
  process.loadEnvFile();
} catch {
  /* allow running without a .env in dev */
}

import {
  analyticsOverview,
  listLeads,
  seoDashboardSnapshot,
  upsertSeoDailyMetrics,
  listPosts,
  getPostBySlug,
} from '../lib/db.js';

const GSC_SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:hawcus.com';
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '547069032';
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
const GOOGLE_OAUTH_REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '';

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function num(v) {
  return Number(v || 0);
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreOpportunity(impressions, ctr, position) {
  const imp = num(impressions);
  const clickPenalty = 1 - clamp(num(ctr), 0, 1);
  const posBoost = position ? clamp(num(position) / 6, 0.7, 2.5) : 1.2;
  return Math.round(imp * clickPenalty * posBoost * 10) / 10;
}

function cleanUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname || url;
  } catch {
    return String(url || '');
  }
}

function normalizePagePath(url) {
  const path = cleanUrl(url).replace(/\/?$/, '/');
  return path.startsWith('/') ? path : `/${path}`;
}

function matchPostForPath(posts, path) {
  const slug = path.split('/').filter(Boolean).pop() || '';
  return posts.find((p) => p.slug === slug) || null;
}

function matchPostForQuery(posts, query) {
  const qLower = String(query || '').toLowerCase().trim();
  const qSlug = qLower.replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const words = qLower.split(/\s+/).filter((w) => w.length > 2);
  const scored = posts.map((p) => {
    const title = String(p.title || '').toLowerCase();
    const slug = String(p.slug || '').toLowerCase();
    let score = 0;
    if (title.includes(qLower)) score += 10;
    if (slug.includes(qSlug)) score += 8;
    if (qLower.includes('crm') && (title.includes('what is a crm') || slug.includes('what-is-a-crm'))) score += 20;
    if (qLower.includes('lead response') && (title.includes('lead response') || slug.includes('lead-response-time'))) score += 20;
    if (qLower.includes('pricing') && title.includes('pricing')) score += 12;
    for (const w of words) {
      if (title.includes(w)) score += 1;
      if (slug.includes(w)) score += 1;
    }
    return { post: p, score };
  }).filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.post || null;
}

async function getAccessToken() {
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REFRESH_TOKEN) {
    return null;
  }
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    throw new Error(`OAuth token exchange failed: ${tokenRes.status} ${tokenData.error || ''} ${tokenData.error_description || ''}`.trim());
  }
  return tokenData.access_token;
}

async function gscQuery(accessToken, body) {
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GSC query failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function ga4Query(accessToken, body) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GA4 query failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

function parseGscRows(rows, kind) {
  return safeArray(rows).map((row) => {
    const key = Array.isArray(row.keys) ? row.keys[0] : '';
    return kind === 'page'
      ? {
          page: normalizePagePath(key),
          clicks: num(row.clicks),
          impressions: num(row.impressions),
          ctr: num(row.ctr),
          position: num(row.position),
        }
      : {
          query: String(key || '').trim(),
          clicks: num(row.clicks),
          impressions: num(row.impressions),
          ctr: num(row.ctr),
          position: num(row.position),
        };
  });
}

function buildRecommendations({ queries, pages, posts }) {
  const items = [];

  for (const q of queries) {
    if (q.impressions < 5) continue;
    const score = scoreOpportunity(q.impressions, q.ctr, q.position);
    const qLower = q.query.toLowerCase();
    const matched = matchPostForQuery(posts, q.query);

    if (matched) {
      items.push({
        kind: 'update',
        score,
        title: matched.title,
        path: `/${matched.slug}/`,
        why: `Search demand exists for “${q.query}” (${Math.round(q.impressions)} impressions, pos ${q.position.toFixed(1)}, CTR ${(q.ctr * 100).toFixed(1)}%).`,
        action: `Refresh the title/H1/meta to include the exact query phrase, add a tighter intro, and place a CTA above the fold.`,
      });
    } else {
      items.push({
        kind: 'new',
        score,
        title: q.query,
        path: null,
        why: `No strong matching article found for “${q.query}”, but Google is already showing Hawcus for it.`,
        action: `Create a dedicated post targeting this query, with a simple promise, examples, and FAQ schema.`,
      });
    }
  }

  for (const p of pages) {
    const path = p.page;
    if (p.impressions < 10 && path !== '/book-a-demo' && path !== '/book-a-demo/') continue;
    const score = scoreOpportunity(p.impressions, p.ctr, p.position) + (path === '/book-a-demo' || path === '/book-a-demo/' ? 60 : 0) + (path === '/pricing' || path === '/pricing/' ? 20 : 0);
    const post = matchPostForPath(posts, path);
    if (path === '/pricing/' || path === '/pricing') {
      items.push({
        kind: 'page',
        score,
        title: 'Hawcus CRM Pricing',
        path: '/pricing',
        why: `Pricing page has ${Math.round(p.impressions)} impressions, ${Math.round(p.clicks)} clicks, CTR ${(p.ctr * 100).toFixed(1)}%, position ${p.position.toFixed(1)}.`,
        action: 'Keep the Rs 4,999 price in the title, tighten the description around 3 users and all features included, and send more internal links to the pricing page from blog posts.',
      });
    } else if (path === '/book-a-demo' || path === '/book-a-demo/') {
      items.push({
        kind: 'page',
        score,
        title: 'Book a Hawcus CRM Demo',
        path: '/book-a-demo',
        why: `Demo page has ${Math.round(p.impressions)} impressions, ${Math.round(p.clicks)} clicks, CTR ${(p.ctr * 100).toFixed(1)}%, position ${p.position.toFixed(1)}.`,
        action: 'Keep the demo promise sharp, show the specific outcomes you will cover in the call, and link to this page from pricing and blog CTAs.',
      });
    } else if (post) {
      const improvement = path.includes('/blog/what-is-a-crm-guide')
        ? 'Tighten the CRM article to the exact “what is a CRM” intent and add an FAQ block near the end.'
        : path.includes('/blog/lead-response-time-speed-to-lead-data')
          ? 'Shift the title toward “lead response time” and “speed to lead” with a sharper first paragraph.'
          : 'Improve the title/meta and internal links so the page earns more clicks from its current impressions.';
      items.push({
        kind: 'page',
        score,
        title: post.title,
        path,
        why: `Page has ${Math.round(p.impressions)} impressions, ${Math.round(p.clicks)} clicks, CTR ${(p.ctr * 100).toFixed(1)}%, position ${p.position.toFixed(1)}.`,
        action: improvement,
      });
    }
  }

  return items
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

async function main() {
  const blog = await analyticsOverview();
  const leads = await listLeads(1000);
  const posts = await listPosts({ status: 'published' });

  let gscTotals = { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  let gscQueries = [];
  let gscPages = [];
  let ga = { users: 0, sessions: 0, pageviews: 0, engagementRate: 0, avgEngagementSeconds: 0, conversions: 0 };
  let notes = { source: 'local-sync', generated_at: new Date().toISOString(), google_data_status: 'not-started' };

  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      const totalsData = await gscQuery(accessToken, { startDate: '2026-07-01', endDate: utcDay(), rowLimit: 1 });
      const totalRow = safeArray(totalsData.rows)[0] || {};
      gscTotals = {
        clicks: num(totalRow.clicks),
        impressions: num(totalRow.impressions),
        ctr: num(totalRow.ctr),
        position: num(totalRow.position),
      };

      const queriesData = await gscQuery(accessToken, {
        startDate: '2026-07-01',
        endDate: utcDay(),
        rowLimit: 20,
        dimensions: ['query'],
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
      });
      gscQueries = parseGscRows(queriesData.rows, 'query');

      const pagesData = await gscQuery(accessToken, {
        startDate: '2026-07-01',
        endDate: utcDay(),
        rowLimit: 20,
        dimensions: ['page'],
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
      });
      gscPages = parseGscRows(pagesData.rows, 'page');

      for (const targetPage of ['https://hawcus.com/pricing', 'https://hawcus.com/book-a-demo']) {
        try {
          const specific = await gscQuery(accessToken, {
            startDate: '2026-07-01',
            endDate: utcDay(),
            rowLimit: 5,
            dimensions: ['page'],
            dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: targetPage }] }],
          });
          for (const row of parseGscRows(specific.rows, 'page')) {
            if (!gscPages.some((p) => p.page === row.page)) gscPages.push(row);
          }
        } catch {
          /* keep sync going if a single page lookup fails */
        }
      }

      try {
        const gaData = await ga4Query(accessToken, {
          dateRanges: [{ startDate: '2026-07-01', endDate: utcDay() }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'engagementRate' },
            { name: 'conversions' },
          ],
        });
        const row = safeArray(gaData.rows)[0] || { metricValues: [] };
        const metrics = safeArray(row.metricValues);
        ga = {
          users: num(metrics[0]?.value),
          sessions: num(metrics[1]?.value),
          pageviews: num(metrics[2]?.value),
          engagementRate: num(metrics[3]?.value),
          avgEngagementSeconds: 0,
          conversions: num(metrics[4]?.value),
        };
        notes.google_data_status = 'connected';
      } catch (err) {
        notes.google_data_status = `gsc-only: ${String(err?.message || err)}`;
      }
    } else {
      notes.google_data_status = 'missing-oauth-env';
    }
  } catch (err) {
    notes.google_data_status = `sync-failed: ${String(err?.message || err)}`;
  }

  const recommendations = buildRecommendations({ queries: gscQueries, pages: gscPages, posts });
  notes = {
    ...notes,
    blog_focus: recommendations[0] || null,
    recommendations,
    gsc_query_sample: gscQueries.slice(0, 5),
    gsc_page_sample: gscPages.slice(0, 5),
    generated_day: utcDay(),
  };

  const today = utcDay();
  const leadSubmissionsToday = leads.filter((l) => String(l.created_at || '').slice(0, 10) === today).length;

  const snapshot = {
    gsc_impressions: gscTotals.impressions,
    gsc_clicks: gscTotals.clicks,
    gsc_ctr: gscTotals.ctr,
    gsc_position: gscTotals.position,
    gsc_top_queries: gscQueries,
    gsc_top_pages: gscPages,
    ga_users: ga.users,
    ga_sessions: ga.sessions,
    ga_pageviews: ga.pageviews,
    ga_engagement_rate: ga.engagementRate,
    ga_avg_engagement_seconds: ga.avgEngagementSeconds,
    ga_conversions: ga.conversions,
    blog_views: num(blog.totals?.total_views),
    lead_submissions: leadSubmissionsToday,
    notes,
  };

  await upsertSeoDailyMetrics(utcDay(), snapshot);

  console.log(JSON.stringify({
    ok: true,
    day: utcDay(),
    google_data_status: notes.google_data_status,
    gsc_clicks: snapshot.gsc_clicks,
    gsc_impressions: snapshot.gsc_impressions,
    ga_users: snapshot.ga_users,
    top_recommendation: recommendations[0] || null,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
