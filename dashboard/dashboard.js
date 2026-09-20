/* Hawcus SEO dashboard */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Escape any value that ends up inside innerHTML. Lead fields (name, email,
     phone, company) come from public forms, so they are attacker controlled;
     without this a crafted submission runs script in the admin's session. */
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  /* Only allow site-relative or http(s) links, never javascript:/data: URIs. */
  function safeHref(u) {
    const s = String(u || '');
    return (/^\/[^/]/.test(s) || /^https?:\/\//i.test(s)) ? s : '#';
  }

  const state = { data: null };
  const toastEl = $('#toast');

  function toast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => { toastEl.hidden = true; }, 2800);
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  function fmtInt(v) { return Number(v || 0).toLocaleString('en-IN'); }
  function fmtFloat(v, digits = 1) { return Number(v || 0).toFixed(digits); }
  function fmtPct(v) { return `${fmtFloat(v, 1)}%`; }
  function fmtSecs(v) {
    const s = Math.max(0, Number(v || 0));
    if (s < 60) return `${Math.round(s)}s`;
    const m = Math.floor(s / 60);
    const r = Math.round(s % 60);
    return `${m}m ${r}s`;
  }
  function toDayLabel(s) {
    const d = new Date(`${s}T00:00:00Z`);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  const APP_PATH = '/dashboard/app/';

  function showLogin(show) { $('#view-login').hidden = !show; $('#view-app').hidden = show; }

  function setPanel(name) {
    $$('.seo-nav__item').forEach(btn => btn.classList.toggle('is-on', btn.dataset.panel === name));
    $$('.seo-panel').forEach(p => p.classList.toggle('is-on', p.dataset.panel === name));
  }

  function renderKpis(data) {
    const blog = data.blog || { totals: {} };
    const leads = data.leads?.totals || {};
    const latest = data.seo?.latest || {};
    const cards = [
      ['Blog views', fmtInt(blog.totals?.total_views), `${fmtInt(blog.totals?.views_7d)} last 7 days`],
      ['Unique readers', fmtInt(blog.totals?.unique_visitors), 'Distinct blog visitors'],
      ['Avg read time', fmtSecs(blog.totals?.avg_secs), 'Visible reading time'],
      ['Published posts', fmtInt(blog.totals?.published), `${fmtInt(blog.totals?.drafts)} drafts`],
      ['Leads', fmtInt(leads.total), `${fmtInt(leads.pending_email)} pending emails`],
      ['Search Console clicks', fmtInt(latest.gsc_clicks), `${fmtInt(latest.gsc_impressions)} impressions`],
      ['GA4 users', fmtInt(latest.ga_users), `${fmtInt(latest.ga_sessions)} sessions`],
      ['GA4 conversions', fmtInt(latest.ga_conversions), 'Tracked leads / actions'],
    ];
    $('#kpis').innerHTML = cards.map(([label, value, sub]) => `
      <div class="seo-kpi">
        <span class="seo-kpi__label">${label}</span>
        <span class="seo-kpi__value">${value}</span>
        <span class="seo-kpi__sub">${sub}</span>
      </div>
    `).join('');
  }

  function renderChart() {
    const daily = (state.data?.blog?.daily || []).slice(-14);
    const max = Math.max(1, ...daily.map(d => Number(d.views || 0)));
    $('#blog-chart').innerHTML = daily.map(row => `
      <div class="seo-chart__bar" title="${esc(row.day)}: ${fmtInt(row.views)} views">
        <i style="height:${Math.max(8, Math.round((Number(row.views || 0) / max) * 100))}%"></i>
        <span>${toDayLabel(row.day)}</span>
      </div>
    `).join('');
  }

  function snapshotRows(latest) {
    const data = latest || {};
    return [
      ['Day', data.day || '—'],
      ['Google impressions', fmtInt(data.gsc_impressions)],
      ['Google clicks', fmtInt(data.gsc_clicks)],
      ['CTR', fmtPct(data.gsc_ctr || 0)],
      ['Average position', fmtFloat(data.gsc_position || 0, 1)],
      ['GA4 users', fmtInt(data.ga_users)],
      ['GA4 sessions', fmtInt(data.ga_sessions)],
      ['GA4 pageviews', fmtInt(data.ga_pageviews)],
      ['GA4 engagement rate', fmtPct(data.ga_engagement_rate || 0)],
      ['GA4 avg engagement', fmtSecs(data.ga_avg_engagement_seconds || 0)],
      ['GA4 conversions', fmtInt(data.ga_conversions)],
      ['Blog views', fmtInt(data.blog_views)],
      ['Leads captured', fmtInt(data.lead_submissions)],
    ];
  }

  function renderSnapshot() {
    const latest = state.data?.seo?.latest;
    $('#snapshot-updated').textContent = latest?.updated_at
      ? `Updated ${new Date(latest.updated_at).toLocaleString('en-IN')}`
      : 'Waiting for the daily sync';
    $('#snapshot-box').innerHTML = snapshotRows(latest).map(([k, v]) => `
      <div class="seo-snapshot__item"><b>${v}</b><small>${k}</small></div>
    `).join('');
  }

  function tableHtml(rows, cols) {
    return `
      <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody>
    `;
  }

  function renderSearchTables() {
    const latest = state.data?.seo?.latest || {};
    const queries = Array.isArray(latest.gsc_top_queries) ? latest.gsc_top_queries : [];
    const pages = Array.isArray(latest.gsc_top_pages) ? latest.gsc_top_pages : [];

    $('#queries-table').innerHTML = tableHtml(
      queries.length ? queries.map((q, idx) => `
        <tr>
          <td><span class="seo-pill">#${idx + 1}</span></td>
          <td><strong>${esc(q.query || q.name || '—')}</strong><span class="seo-muted-row">${esc(q.page || q.url || '')}</span></td>
          <td>${fmtInt(q.clicks)}</td>
          <td>${fmtInt(q.impressions)}</td>
          <td>${fmtPct(q.ctr || 0)}</td>
          <td>${fmtFloat(q.position || 0, 1)}</td>
        </tr>
      `) : [`<tr><td colspan="6" class="seo-muted-row">No Search Console snapshot available yet.</td></tr>`],
      ['Rank', 'Query', 'Clicks', 'Impressions', 'CTR', 'Pos']
    );

    $('#pages-table').innerHTML = tableHtml(
      pages.length ? pages.map((p, idx) => `
        <tr>
          <td><span class="seo-pill">#${idx + 1}</span></td>
          <td><strong>${esc(p.page || p.url || '—')}</strong><span class="seo-muted-row">${esc(p.title || '')}</span></td>
          <td>${fmtInt(p.clicks)}</td>
          <td>${fmtInt(p.impressions)}</td>
          <td>${fmtPct(p.ctr || 0)}</td>
          <td>${fmtFloat(p.position || 0, 1)}</td>
        </tr>
      `) : [`<tr><td colspan="6" class="seo-muted-row">No top page data yet.</td></tr>`],
      ['Rank', 'Page', 'Clicks', 'Impressions', 'CTR', 'Pos']
    );
  }

  function renderBlogTable() {
    const posts = state.data?.blog?.posts || [];
    $('#blog-table').innerHTML = tableHtml(
      posts.map((p, idx) => `
        <tr>
          <td><span class="seo-pill">#${idx + 1}</span></td>
          <td><strong>${esc(p.title)}</strong><span class="seo-muted-row">/${esc(p.slug)}/</span></td>
          <td>${fmtInt(p.views)}</td>
          <td>${fmtInt(p.uniques)}</td>
          <td>${fmtSecs(p.avg_secs)}</td>
          <td>${esc(p.status)}</td>
        </tr>
      `),
      ['Rank', 'Post', 'Views', 'Unique readers', 'Avg read', 'Status']
    );
  }

  function renderLeads() {
    const leads = state.data?.leads?.recent || [];
    const totals = state.data?.leads?.totals || {};
    $('#lead-totals').innerHTML = [
      ['Total leads', fmtInt(totals.total)],
      ['Demo leads', fmtInt(totals.demos)],
      ['Contact leads', fmtInt(totals.contacts)],
      ['Last 7 days', fmtInt(totals.last_7_days)],
      ['Pending email', fmtInt(totals.pending_email)],
    ].map(([k, v]) => `<div class="seo-snapshot__item"><b>${v}</b><small>${k}</small></div>`).join('');

    $('#leads-table').innerHTML = tableHtml(
      leads.map((l) => `
        <tr>
          <td><strong>${esc(l.kind)}</strong><span class="seo-muted-row">${new Date(l.created_at).toLocaleString('en-IN')}</span></td>
          <td>${esc(l.name || '—')}</td>
          <td>${esc(l.email || '—')}</td>
          <td>${esc(l.phone || '—')}</td>
          <td>${esc(l.company || '—')}</td>
        </tr>
      `),
      ['Type', 'Name', 'Email', 'Phone', 'Company']
    );
  }

  function renderImprove() {
    const latest = state.data?.seo?.latest || {};
    const recs = Array.isArray(latest.notes?.recommendations) ? latest.notes.recommendations : [];
    const focus = latest.notes?.blog_focus || recs[0] || null;

    const focusHtml = focus ? `
      <div class="seo-focus">
        <span class="seo-pill">Top priority</span>
        <h3>${focus.kind === 'new' ? 'New content' : focus.kind === 'page' ? 'Page tune-up' : 'Content refresh'}</h3>
        <p><strong>${esc(focus.title)}</strong></p>
        <p class="seo-muted-row">${esc(focus.why)}</p>
        <p>${esc(focus.action)}</p>
        ${focus.path ? `<a href="${esc(safeHref(focus.path))}" target="_blank" rel="noopener noreferrer">Open target</a>` : ''}
      </div>
    ` : '<p class="seo-muted-row">No recommendations yet. Run the daily sync first.</p>';

    const listHtml = recs.length ? `
      <div class="seo-reco-list">
        ${recs.map((r) => `
          <article class="seo-reco-card">
            <div class="seo-reco-card__head">
              <span class="seo-pill">#${r.rank}</span>
              <b>${r.kind === 'new' ? 'Create' : 'Improve'}</b>
            </div>
            <h4>${esc(r.title)}</h4>
            <p>${esc(r.why)}</p>
            <p>${esc(r.action)}</p>
            ${r.path ? `<small>${esc(r.path)}</small>` : ''}
          </article>
        `).join('')}
      </div>
    ` : '';

    $('#improve-box').innerHTML = focusHtml + listHtml;
  }

  async function load() {
    const data = await api('/api/admin/dashboard');
    state.data = data;
    const who = data.user || {};
    $('#who-name').textContent = who.name || 'Admin';
    $('#who-email').textContent = who.email || '';
    $('#who-av').textContent = (who.name || 'A').trim().charAt(0).toUpperCase();

    renderKpis(data);
    renderChart();
    renderSnapshot();
    renderSearchTables();
    renderBlogTable();
    renderImprove();
    renderLeads();
  }

  async function boot() {
    try {
      const me = await api('/api/admin/me');
      if (!location.pathname.startsWith(APP_PATH)) {
        history.replaceState({}, '', APP_PATH);
      }
      showLogin(false);
      $('#who-name').textContent = me.user?.name || 'Admin';
      $('#who-email').textContent = me.user?.email || '';
      $('#who-av').textContent = (me.user?.name || 'A').trim().charAt(0).toUpperCase();
      await load();
    } catch {
      showLogin(true);
    }
  }

  $('#login-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = new FormData(ev.currentTarget);
    try {
      const out = await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      showLogin(false);
      $('#who-name').textContent = out.user?.name || 'Admin';
      $('#who-email').textContent = out.user?.email || '';
      $('#who-av').textContent = (out.user?.name || 'A').trim().charAt(0).toUpperCase();
      history.replaceState({}, '', APP_PATH);
      await load();
      toast('Signed in');
    } catch (err) {
      $('#login-error').textContent = err.message;
      $('#login-error').hidden = false;
    }
  });

  $('#logout').addEventListener('click', async () => {
    try { await api('/api/admin/logout', { method: 'POST', body: '{}' }); } catch {}
    showLogin(true);
  });

  $$('.seo-nav__item').forEach(btn => {
    btn.addEventListener('click', () => setPanel(btn.dataset.panel));
  });

  boot().catch((err) => {
    toast(err.message || 'Failed to load dashboard');
    showLogin(true);
  });
})();
