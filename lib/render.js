import { HEADER, FOOTER } from "./chrome.js";
import { SITE_ORIGIN } from "./config.js";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 70);
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* Estimated read time when the author leaves it blank: 200 wpm. */
export function estimateMinutes(html) {
  const words = String(html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const GRADS = {
  "WhatsApp CRM": "linear-gradient(135deg,#075e54,#25d366)",
  "Follow-Ups": "linear-gradient(135deg,#c2410c,#f97316)",
  Pipeline: "linear-gradient(135deg,#111318,#475569)",
  Automation: "linear-gradient(135deg,#4c1d95,#7c3aed)",
  "Lead Management": "linear-gradient(135deg,#0f766e,#0d9488)",
};
export const CATEGORIES = Object.keys(GRADS);

/* Custom categories get a stable colour derived from their name, so two of them
   never look identical and the same one always looks the same. */
const CUSTOM_GRADS = [
  "linear-gradient(135deg,#9a3412,#f59e0b)",
  "linear-gradient(135deg,#1e3a8a,#3b82f6)",
  "linear-gradient(135deg,#831843,#ec4899)",
  "linear-gradient(135deg,#134e4a,#14b8a6)",
  "linear-gradient(135deg,#3f2d18,#a16207)",
  "linear-gradient(135deg,#312e81,#6366f1)",
];

function hashIndex(str, len) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % len;
}

export function gradFor(category, fallback) {
  if (fallback) return fallback;
  if (GRADS[category]) return GRADS[category];
  const name = String(category || "").trim();
  return name ? CUSTOM_GRADS[hashIndex(name, CUSTOM_GRADS.length)] : GRADS["Follow-Ups"];
}

const ICONS = {
  "WhatsApp CRM": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/></svg>',
  "Follow-Ups": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  Pipeline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-6"/></svg>',
  Automation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M9 14h.01M15 14h.01"/></svg>',
  "Lead Management": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
};
/* Custom categories get a neutral tag icon rather than borrowing another one. */
const ICON_CUSTOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/></svg>';

function iconFor(cat) {
  return ICONS[cat] || ICON_CUSTOM;
}

/* Author picture when one was uploaded, otherwise the initial as before. */
function authorAvatar(post, cls) {
  // trim before the fallback, so a name of only spaces still yields a letter
  const name = String(post.author_name || "").trim() || "Hawcus";
  if (post.author_avatar) {
    return `<img class="${cls} ${cls}--img" src="${esc(post.author_avatar)}" alt="${esc(name)}" width="80" height="80" loading="lazy" />`;
  }
  return `<span class="${cls}">${esc(name.charAt(0).toUpperCase())}</span>`;
}

function page({ title, description, canonical, body, jsonld = [], extraHead = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Hawcus CRM" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:image" content="${SITE_ORIGIN}/hawcus-logo.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" content="#ea580c" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/favicon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/styles.css" />
${jsonld.map((j) => `  <script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
${extraHead}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
${HEADER}
${body}
${FOOTER}
  <script src="/js/main.js" defer></script>
</body>
</html>`;
}

/* ---------------- blog index ---------------- */

export function renderBlogIndex(posts) {
  const featured = posts[0];
  const rest = posts.slice(1);

  const featuredBlock = featured
    ? `        <article class="bfeat reveal">
          <a class="bfeat__art" href="/blog/${esc(featured.slug)}/" aria-hidden="true" tabindex="-1" style="background:${esc(gradFor(featured.category, featured.banner_grad))}">
            <span class="bfeat__glyph">${iconFor(featured.category)}</span>
          </a>
          <div class="bfeat__body">
            <span class="bfeat__flag">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.1 6.1 20.2l1.2-6.6L2.5 9l6.6-.9z"/></svg>
              Featured guide
            </span>
            <h2><a href="/blog/${esc(featured.slug)}/">${esc(featured.title)}</a></h2>
            <p>${esc(featured.excerpt)}</p>
            <span class="bcat">${esc(featured.category)}</span>
            <div class="bmeta">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${featured.read_minutes} min read</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>${fmtDate(featured.published_at)}</span>
            </div>
            <a class="btn btn--primary" href="/blog/${esc(featured.slug)}/">Read full guide
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
        </article>`
    : `        <p class="bempty">No articles published yet.</p>`;

  const cards = rest.map((p) => postCard(p)).join("\n");

  const cats = [...new Set(posts.map((p) => p.category))];
  const pills = [`<button type="button" class="bpill is-on" data-filter="all" aria-pressed="true">All</button>`]
    .concat(cats.map((c) => `<button type="button" class="bpill" data-filter="${esc(slugify(c))}" aria-pressed="false">${esc(c)}</button>`))
    .join("\n          ");

  const topList = posts.slice(0, 5).map((p) => `                <li>
                  <a href="/blog/${esc(p.slug)}/">
                    <span class="btop__ic" style="background:${esc(gradFor(p.category, p.banner_grad))}">${iconFor(p.category)}</span>
                    <span><b>${esc(p.title)}</b><small>${fmtDate(p.published_at)}</small></span>
                  </a>
                </li>`).join("\n");

  const body = `  <main id="main">
    <section class="bhero">
      <div class="container">
        <nav class="breadcrumb bhero__crumb" aria-label="Breadcrumb"><a href="/">Home</a> / Blog</nav>
        <h1>The Hawcus Blog</h1>
        <p>Playbooks and practical guides on WhatsApp sales, CRM strategy, follow-ups and pipeline management, so you can close more and chase less.</p>

        <div class="bfilters" aria-label="Filter articles by category">
          ${pills}
        </div>

        <div class="bsearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input type="search" id="blog-search" placeholder="Search articles..." aria-label="Search articles" />
        </div>
      </div>
    </section>

    <section class="section bfeat-sec">
      <div class="container">
${featuredBlock}
      </div>
    </section>

    <section class="section blatest">
      <div class="container">
        <div class="blatest__head">
          <h2>Latest articles <span class="blatest__count">${posts.length} article${posts.length === 1 ? "" : "s"}</span></h2>
          <p>Stay updated with the latest insights and best practices.</p>
        </div>

        <div class="blayout">
          <div class="bgrid" id="blog-grid">
${cards}
          </div>

          <p class="bempty" id="blog-empty" hidden>No articles match that search yet. Try another keyword.</p>

          <aside class="bside">
            <div class="bside__card">
              <h3>Top blogs</h3>
              <ul class="btop">
${topList}
              </ul>
            </div>

            <div class="bside__card bside__cta">
              <h3>Put these ideas to work</h3>
              <p>Hawcus gives you the pipeline, follow-ups and WhatsApp inbox to turn every lead into a customer.</p>
              <a class="btn btn--primary btn--block" href="/book-a-demo">Book a free demo</a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </main>`;

  return page({
    title: "Hawcus CRM Blog - WhatsApp Sales, CRM Tips & Pipeline Playbooks",
    description: "Practical guides on WhatsApp sales, CRM strategy, lead follow-ups and pipeline management from the Hawcus team.",
    canonical: `${SITE_ORIGIN}/blog/`,
    body,
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Hawcus CRM Blog",
        url: `${SITE_ORIGIN}/blog/`,
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE_ORIGIN}/blog/${p.slug}/`,
          datePublished: p.published_at,
        })),
      },
    ],
  });
}

function postCard(p) {
  return `            <article class="bcard reveal" data-cat="${esc(slugify(p.category))}" data-title="${esc(p.title.toLowerCase())} ${esc((p.excerpt || "").toLowerCase())}">
              <a class="bcard__thumb" href="/blog/${esc(p.slug)}/" style="background:${esc(gradFor(p.category, p.banner_grad))}" aria-hidden="true" tabindex="-1">${iconFor(p.category)}</a>
              <div class="bcard__body">
                <span class="bcat">${esc(p.category)}</span>
                <h3><a href="/blog/${esc(p.slug)}/">${esc(p.title)}</a></h3>
                <p>${esc(p.excerpt)}</p>
                <div class="bmeta">
                  <span>${fmtDate(p.published_at)}</span>
                  <span>${p.read_minutes} min read</span>
                  <b>${esc(p.author_name)}</b>
                </div>
              </div>
            </article>`;
}

/* ---------------- article ---------------- */

/* Adds ids to headings that lack them and returns the TOC entries. */
export function withHeadingIds(html) {
  const toc = [];
  const out = String(html || "").replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (m, level, attrs, text) => {
      const plain = text.replace(/<[^>]+>/g, "").trim();
      const idMatch = /id="([^"]+)"/.exec(attrs);
      const id = idMatch ? idMatch[1] : slugify(plain);
      const newAttrs = idMatch ? attrs : `${attrs} id="${id}"`;
      toc.push({ level, id, text: plain });
      return `<h${level}${newAttrs}>${text}</h${level}>`;
    }
  );
  return { html: out, toc };
}

export function renderArticle(post, faqs, related) {
  const { html: content, toc } = withHeadingIds(post.content);
  if (faqs.length) toc.push({ level: "2", id: "faq", text: "Frequently Asked Questions" });

  const tocItems = toc
    .map((t) => `            <li class="atoc__l${t.level}"><a href="#${esc(t.id)}">${esc(t.text)}</a></li>`)
    .join("\n");

  const faqBlock = faqs.length
    ? `            <section class="afaq" id="faq">
              <h2 class="afaq__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3"/><path d="M12 17h.01"/></svg>
                Frequently Asked Questions
              </h2>
${faqs.map((f) => `              <div class="afaq__item">
                <button class="afaq__q" type="button" aria-expanded="false">
                  <span>${esc(f.question)}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div class="afaq__a"><p>${esc(f.answer)}</p></div>
              </div>`).join("\n")}
            </section>`
    : "";

  const tldrBlock = post.tldr
    ? `            <div class="atldr">
              <span class="atldr__tag">TL;DR</span>
              <p>${esc(post.tldr)}</p>
            </div>`
    : "";

  const relatedBlock = related.length
    ? `    <section class="section arel">
      <div class="container">
        <h2 class="arel__title">You might also like</h2>
        <div class="bgrid arel__grid">
${related.map((p) => postCard(p)).join("\n")}
        </div>
      </div>
    </section>`
    : "";

  const body = `  <main id="main">
    <article class="article" data-post-id="${post.id}">
      <div class="container">
        <div class="alayout">

          <aside class="atoc">
            <div class="atoc__inner">
              <b class="atoc__head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
                On this page
              </b>
              <ul class="atoc__list">
${tocItems}
              </ul>
            </div>
          </aside>

          <div class="amain">
            <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog/">Blog</a> / ${esc(post.category)}</nav>
            <a class="aback" href="/blog/">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
              Back to Blog
            </a>

            <span class="bcat acat">${esc(post.category)}</span>
            <h1 class="atitle">${esc(post.title)}</h1>

            <div class="abyline">
              ${authorAvatar(post, "abyline__av")}
              <span class="abyline__name">${esc(post.author_name)}</span>
              <span class="abyline__sep"></span>
              <span class="abyline__bit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>
                <time datetime="${post.published_at ? new Date(post.published_at).toISOString() : ""}">${fmtDate(post.published_at)}</time>
              </span>
              <span class="abyline__bit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                ${post.read_minutes} min read
              </span>
            </div>

            <div class="abanner" style="background:${esc(gradFor(post.category, post.banner_grad))}" aria-hidden="true">${iconFor(post.category)}</div>

${tldrBlock}

            <div class="prose">${content}</div>

            <div class="apromo">
              <span class="apromo__eyebrow">Ready to try Hawcus?</span>
              <h2>See the WhatsApp CRM Indian sales teams are switching to</h2>
              <p>Book a free demo. We will set Hawcus up on your WhatsApp number and walk through how leads, follow-ups and calls are handled, customised to how your team sells.</p>
              <a class="btn btn--primary btn--lg" href="/book-a-demo">Book a free demo
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <small>No credit card. 15-minute setup. Personalised to your business.</small>
            </div>

${faqBlock}

            <div class="abio">
              ${authorAvatar(post, "abio__av")}
              <div class="abio__body">
                <span class="abio__label">Written by</span>
                <b>${esc(post.author_name)}</b>
                <span class="abio__role">Product and Growth, Hawcus CRM</span>
                <p>The Hawcus team builds a WhatsApp-first CRM used by growing sales teams across India. We write about the things we see working in real pipelines, not theory.</p>
                <a class="abio__more" href="/blog/">More from Hawcus
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
              </div>
            </div>

            <div class="acite">
              <b class="acite__head">Citation format</b>
              <pre>${esc(post.author_name)}. "${esc(post.title)}". Hawcus CRM, ${fmtDate(post.published_at)}. ${SITE_ORIGIN}/blog/${esc(post.slug)}/</pre>
              <div class="acite__meta">
                <span><b>Author:</b> ${esc(post.author_name)}</span>
                <span><b>Published:</b> ${fmtDate(post.published_at)}</span>
                <span><b>Source:</b> Hawcus CRM</span>
              </div>
            </div>

            <div class="aallwrap">
              <a class="aback aback--btn" href="/blog/">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
                All articles
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>

${relatedBlock}
  </main>`;

  return page({
    title: `${post.title} | Hawcus CRM`,
    description: post.excerpt || post.tldr,
    canonical: `${SITE_ORIGIN}/blog/${post.slug}/`,
    body,
    extraHead: '  <script src="/js/track.js" defer></script>',
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: {
          "@type": "Organization",
          name: post.author_name,
          ...(post.author_avatar ? { image: `${SITE_ORIGIN}${post.author_avatar}` } : {}),
        },
        publisher: {
          "@type": "Organization",
          name: "Hawcus",
          logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/hawcus-logo.png` },
        },
        mainEntityOfPage: `${SITE_ORIGIN}/blog/${post.slug}/`,
      },
      ...(faqs.length
        ? [
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            },
          ]
        : []),
    ],
  });
}
