/* Generates one page per feature under features/<slug>/index.html.
   Run with: npm run build:features */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FEATURES, ICONS, TICK } from "./features-data.js";
import { WHY_HAWCUS } from "./why-hawcus.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://hawcus.com";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------------- infographics ----------------
   Each is drawn with markup and CSS only. No images, so they stay sharp,
   theme with the rest of the site and cost nothing to load. */

const DIAGRAMS = {
  /* three linked stages, left to right */
  flow: (d) => `
          <div class="fig fig--flow">
            <div class="figflow">
${d.nodes
  .map(
    (n, i) => `              <div class="figflow__node">
                <span class="figflow__dot">${i + 1}</span>
                <b>${esc(n.label)}</b>
                <span>${esc(n.sub)}</span>
              </div>${i < d.nodes.length - 1 ? '\n              <span class="figflow__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' : ""}`
  )
  .join("\n")}
            </div>
            <p class="fig__cap">${esc(d.caption)}</p>
          </div>`,

  /* a kanban board */
  board: (d) => `
          <div class="fig fig--board">
            <div class="figboard">
${d.columns
  .map(
    (c) => `              <div class="figcol figcol--${c.tone}">
                <div class="figcol__head"><b>${esc(c.name)}</b><span>${c.count}</span></div>
${c.cards.map((name) => `                <div class="figcard"><span class="figcard__av">${esc(name.charAt(0))}</span><span class="figcard__name">${esc(name)}</span></div>`).join("\n")}
              </div>`
  )
  .join("\n")}
            </div>
            <p class="fig__cap">${esc(d.caption)}</p>
          </div>`,

  /* a vertical timeline of touches */
  cadence: (d) => `
          <div class="fig fig--cadence">
            <ol class="figcad">
${d.steps
  .map(
    (s) => `              <li class="figcad__row figcad__row--${s.tone}">
                <span class="figcad__day">${esc(s.day)}</span>
                <span class="figcad__mark" aria-hidden="true"></span>
                <span class="figcad__body"><b>${esc(s.label)}</b><span>${esc(s.sub)}</span></span>
              </li>`
  )
  .join("\n")}
            </ol>
            <p class="fig__cap">${esc(d.caption)}</p>
          </div>`,

  /* sources feeding a central hub */
  hub: (d) => `
          <div class="fig fig--hub">
            <div class="fighub">
              <div class="fighub__sources">
${d.sources.map((s) => `                <span class="fighub__src">${esc(s)}</span>`).join("\n")}
              </div>
              <span class="fighub__pipe" aria-hidden="true"></span>
              <div class="fighub__core">
                <img src="/hawcus-logo-white.png" alt="Hawcus" width="104" height="44" />
                <span>One pipeline</span>
              </div>
            </div>
            <p class="fig__cap">${esc(d.caption)}</p>
          </div>`,

  /* many inputs narrowing to one record */
  funnel: (d) => `
          <div class="fig fig--funnel">
            <div class="figfun">
              <div class="figfun__in">
${d.sources
  .map(
    (s) => `                <div class="figfun__src"><b>${esc(s.label)}</b><span>${esc(s.sub)}</span></div>`
  )
  .join("\n")}
              </div>
              <span class="figfun__merge" aria-hidden="true"></span>
              <div class="figfun__out">
                <span class="figfun__tick">${TICK}</span>
                <b>${esc(d.out.label)}</b>
                <span>${esc(d.out.sub)}</span>
              </div>
            </div>
            <p class="fig__cap">${esc(d.caption)}</p>
          </div>`,

  /* a phone conversation beside the lead record */
  split: (d) => `
          <div class="fig fig--split">
            <div class="figsplit">
              <div class="figsplit__chat">
                <div class="figsplit__bar"><span class="figsplit__av">${esc(d.panel.name.charAt(0))}</span><b>${esc(d.panel.name)}</b></div>
${d.chat.map((m) => `                <p class="figbub figbub--${m.side}">${esc(m.text)}</p>`).join("\n")}
              </div>
              <div class="figsplit__rec">
                <b class="figsplit__rechead">Lead record</b>
${d.panel.rows
  .map((r) => `                <div class="figsplit__row"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`)
  .join("\n")}
              </div>
            </div>
            <p class="fig__cap">${esc(d.caption)}</p>
          </div>`,

  /* a phone mid-call, with the log it writes behind it */
  dialer: (d) => `
          <div class="fig fig--dialer">
            <div class="figdial">
              <div class="figdial__phone">
                <span class="figdial__notch" aria-hidden="true"></span>
                <span class="figdial__av">${esc(d.screen.name.charAt(0))}</span>
                <b>${esc(d.screen.name)}</b>
                <span class="figdial__meta">${esc(d.screen.meta)}</span>
                <span class="figdial__rec"><i></i>${esc(d.screen.status)}</span>
                <div class="figdial__keys" aria-hidden="true">
                  <span class="figdial__key figdial__key--end"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-2.4 0-4.7.4-6.9 1.2v3.1c0 .4-.2.8-.6 1-.6.3-1.2.7-1.7 1.1-.2.2-.5.3-.7.3-.3 0-.6-.1-.8-.3l-1-2A1 1 0 0 1 .5 12C3.7 9.5 7.7 8 12 8s8.3 1.5 11.5 4a1 1 0 0 1 .2 1.4l-1 2c-.2.2-.5.3-.8.3-.2 0-.5-.1-.7-.3-.5-.4-1.1-.8-1.7-1.1a1 1 0 0 1-.6-1v-3.1C16.7 9.4 14.4 9 12 9z"/></svg></span>
                </div>
              </div>
              <ul class="figdial__log">
${d.log
  .map(
    (l) => `                <li class="figdial__row figdial__row--${l.tone}">
                  <span class="figdial__name"><b>${esc(l.name)}</b><span>${esc(l.detail)}</span></span>
                  <span class="figdial__tag">${esc(l.tag)}</span>
                </li>`
  )
  .join("\n")}
              </ul>
            </div>
            <p class="fig__cap">${esc(d.caption)}</p>
          </div>`,

  /* when / then rule cards */
  trigger: (d) => `
          <div class="fig fig--trigger">
            <div class="figtrig">
${d.rules
  .map(
    (r) => `              <div class="figrule figrule--${r.tone}">
                <div class="figrule__when"><span>When</span><b>${esc(r.when)}</b></div>
                <span class="figrule__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
                <div class="figrule__then"><span>Then</span><b>${esc(r.then)}</b></div>
              </div>`
  )
  .join("\n")}
            </div>
            <p class="fig__cap">${esc(d.caption)}</p>
          </div>`,
};

/* ---------------- page ---------------- */

function page(f, chrome) {
  const others = FEATURES.filter((o) => o.slug !== f.slug);
  const url = `${ORIGIN}/features/${f.slug}/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(f.seoTitle || f.name)} | Hawcus CRM</title>
  <meta name="description" content="${esc(f.metaDesc)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${url}" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(f.name)} | Hawcus CRM" />
  <meta property="og:description" content="${esc(f.metaDesc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${ORIGIN}/hawcus-logo.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(f.name)} | Hawcus CRM" />
  <meta name="twitter:description" content="${esc(f.tagline)}" />

  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/styles.css" />

  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: f.faqs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  })}
  </script>

  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "Features", item: `${ORIGIN}/#features` },
      { "@type": "ListItem", position: 3, name: f.name, item: url },
    ],
  })}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

${chrome.header}

  <main id="main">
    <!-- ============ HERO ============ -->
    <section class="section fhero">
      <div class="container">
        <nav class="fcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/#features">Features</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">${esc(f.name)}</span>
        </nav>

        <div class="fhero__grid">
          <div class="fhero__copy">
            <span class="eyebrow"><span class="fhero__ico">${ICONS[f.slug]}</span>${esc(f.name)}</span>
            <h1>${esc(f.title)}</h1>
            <p class="fhero__lead">${esc(f.heroLead)}</p>
            <div class="fhero__cta">
              <a class="btn btn--primary btn--lg" href="/book-a-demo.html">Book a demo</a>
              <a class="btn btn--ghost btn--lg" href="/pricing.html">See pricing</a>
            </div>
            <p class="fhero__note">Included in the single Hawcus plan at Rs 4,999 a month. No feature tiers.</p>
          </div>
          <div class="fhero__viz">
${DIAGRAMS[f.diagram](f.diagramData)}
          </div>
        </div>
      </div>
    </section>

    <!-- ============ EXPLANATION ============ -->
    <section class="section section--tint">
      <div class="container">
        <div class="fintro">
          <h2>${esc(f.intro.head)}</h2>
${f.intro.body.map((p) => `          <p>${esc(p)}</p>`).join("\n")}
        </div>

        <div class="fstats">
${f.stats
  .map(
    (s) => `          <div class="fstat">
            <b>${esc(s.n)}</b>
            <span class="fstat__l">${esc(s.l)}</span>
            <span class="fstat__s">${esc(s.s)}</span>
          </div>`
  )
  .join("\n")}
        </div>
      </div>
    </section>

    <!-- ============ HOW IT WORKS ============ -->
    <section class="section">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow">How it works</span>
          <h2>Live in an afternoon</h2>
        </div>
        <ol class="fsteps">
${f.steps
  .map(
    (s) => `          <li class="fstep">
            <span class="fstep__n">${esc(s.n)}</span>
            <h3>${esc(s.h)}</h3>
            <p>${esc(s.p)}</p>
          </li>`
  )
  .join("\n")}
        </ol>
      </div>
    </section>

    <!-- ============ BENEFITS ============ -->
    <section class="section section--tint">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow">What you get</span>
          <h2>Why teams turn this on first</h2>
        </div>
        <div class="fbens">
${f.benefits
  .map(
    (b) => `          <div class="fben">
            <span class="fben__tick">${TICK}</span>
            <b>${esc(b.h)}</b>
            <p>${esc(b.p)}</p>
          </div>`
  )
  .join("\n")}
        </div>
      </div>
    </section>

    <!-- ============ FAQ ============ -->
    <section class="section">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow">Questions</span>
          <h2>${esc(f.name)}, answered</h2>
        </div>
        <div class="ffaq">
${f.faqs
  .map(
    ([q, a]) => `          <div class="ffaq__item">
            <b>${esc(q)}</b>
            <p>${esc(a)}</p>
          </div>`
  )
  .join("\n")}
        </div>
      </div>
    </section>

    <!-- ============ OTHER FEATURES ============ -->
    <section class="section section--tint">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow">Explore</span>
          <h2>The rest of the product</h2>
        </div>
        <div class="frel">
${others
  .map(
    (o) => `          <a class="frelcard" href="/features/${o.slug}/">
            <span class="frelcard__ic">${ICONS[o.slug]}</span>
            <b>${esc(o.name)}</b>
            <span class="frelcard__p">${esc(o.tagline)}</span>
          </a>`
  )
  .join("\n")}
        </div>
      </div>
    </section>

${WHY_HAWCUS}

    <!-- ============ CTA ============ -->
    <section class="section">
      <div class="container">
        <div class="fcta">
          <h2>See ${esc(f.name)} on your own pipeline</h2>
          <p>A 15-minute walkthrough with your leads, your stages and your number. No slides.</p>
          <div class="fcta__btns">
            <a class="btn btn--primary btn--lg" href="/book-a-demo.html">Book a demo</a>
            <a class="btn btn--ghost btn--lg" href="/pricing.html">See pricing</a>
          </div>
        </div>
      </div>
    </section>
  </main>

${chrome.tail}
`;
}

/* ---------------- run ---------------- */

const chrome = JSON.parse(await fs.readFile(path.join(ROOT, "lib", "site-chrome.json"), "utf8"));

for (const f of FEATURES) {
  const dir = path.join(ROOT, "features", f.slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "index.html"), page(f, chrome), "utf8");
  console.log(`built  /features/${f.slug}/`);
}
console.log(`\n${FEATURES.length} feature pages written.`);

/* Keep book-a-demo.html in step with the same block, so the copy lives in one
   place instead of being duplicated by hand. */
const BOOKING = path.join(ROOT, "book-a-demo.html");
const START = "    <!-- WHY:START -->";
const END = "    <!-- WHY:END -->";

let booking = await fs.readFile(BOOKING, "utf8");
const block = `${START}\n${WHY_HAWCUS}\n${END}`;

if (booking.includes(START) && booking.includes(END)) {
  booking = booking.slice(0, booking.indexOf(START)) + block +
            booking.slice(booking.indexOf(END) + END.length);
} else {
  // first run: insert it just above the closing </main>
  booking = booking.replace("  </main>", `${block}\n  </main>`);
}
await fs.writeFile(BOOKING, booking, "utf8");
console.log("synced  /book-a-demo.html");
