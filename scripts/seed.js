/* Creates the admin user and imports the three hand-built articles into Postgres.
   Safe to run more than once: existing slugs and users are skipped. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as db from "../lib/db.js";
import { hashPassword } from "../lib/auth.js";
import { SEED_ADMIN } from "../lib/config.js";
import { estimateMinutes, gradFor } from "../lib/render.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const SOURCES = [
  {
    slug: "whatsapp-crm-guide",
    title: "WhatsApp CRM: The Complete Guide to Selling on WhatsApp",
    category: "WhatsApp CRM",
    published_at: "2026-07-10",
    excerpt: "Why WhatsApp is the highest-converting sales channel you are probably underusing, and how to run it like a pro with a CRM.",
    tldr: "A WhatsApp CRM ties every chat to a contact and a deal, so conversations stop living on personal phones and start feeding your pipeline. Teams that adopt one typically reply in minutes instead of hours and see far fewer warm leads go cold.",
    faqs: [
      ["Do I need the WhatsApp Business API to use a WhatsApp CRM?", "Not always. The official API unlocks automated templates, multiple agents on one number, and higher send volumes. For smaller teams a QR-linked number is enough to start, and you can move to the API later without losing history."],
      ["What happens to my existing WhatsApp chats when I switch?", "Past conversations stay on the device they were sent from. From the moment you connect the number, new messages are logged against the right lead automatically, so the record builds from day one."],
      ["Can more than one person reply from the same number?", "Yes. A shared inbox lets several team members work the same number with assignment rules, so every conversation has one clear owner and nothing sits unanswered."],
      ["How quickly can a team get set up?", "Most teams connect a number, import their leads, and send their first templated follow-up within an afternoon."],
    ],
  },
  {
    slug: "lead-follow-up-system",
    title: "How to Build a Lead Follow-Up System That Actually Converts",
    category: "Follow-Ups",
    published_at: "2026-07-03",
    excerpt: "Most deals are lost in the follow-up, not the pitch. Here is a repeatable system to keep every lead warm without burning out.",
    tldr: "A working follow-up system needs three things: a defined cadence, an owner for every lead, and automation that fires the next touch without anyone having to remember it.",
    faqs: [
      ["How many follow-ups is too many?", "Persistence matters more than most teams assume, but relevance matters more than frequency. Five to seven touches across two to three weeks works for most B2B sales, provided each message adds something new."],
      ["Should follow-ups be automated or personal?", "Both. Automate the timing and the reminder so nothing is forgotten, then keep the message itself personal. The automation should prompt the rep, not replace them."],
      ["What is the best channel for a follow-up?", "Whichever one the lead used first. If they enquired on WhatsApp, following up by email adds friction."],
      ["How do I know if my follow-up system is working?", "Track follow-up completion rate alongside reply rate. High completion with low replies means the messaging needs work; low completion means the process does."],
    ],
  },
  {
    slug: "sales-pipeline-management",
    title: "Sales Pipeline Management: Stages, Metrics & Best Practices",
    category: "Pipeline",
    published_at: "2026-06-26",
    excerpt: "A clear pipeline is the difference between guessing and knowing. Learn the stages, metrics and habits that keep deals moving.",
    tldr: "A pipeline is only useful if the stages reflect what the buyer is doing, not what your team is doing. Define exit criteria per stage, review weekly, and track stage conversion and deal age so stalled deals surface before they die quietly.",
    faqs: [
      ["How many pipeline stages should we have?", "Four to six is enough for most teams. More stages create admin work without adding clarity. Each stage should represent a real change in buyer intent."],
      ["What is the most important pipeline metric?", "Stage conversion rate, closely followed by deal age. Together they show where deals get stuck and how long they sit there."],
      ["How often should a pipeline be reviewed?", "Weekly for the active pipeline and monthly for trends. A short weekly review focused only on deals that have not moved catches most problems while they are still fixable."],
      ["What should we do with stalled deals?", "Give them a defined exit. Either re-engage with a specific reason to talk, or move them to a nurture track."],
    ],
  },
];

/* Pulls the <div class="prose">...</div> body out of a built article page.
   Scans for the matching close tag so nested divs (callouts, tables) survive. */
export async function extractProse(slug) {
  const file = path.join(ROOT, "blog", slug, "index.html");
  const html = await fs.readFile(file, "utf8");

  const open = '<div class="prose">';
  const start = html.indexOf(open);
  if (start === -1) throw new Error(`Could not find prose in ${slug}`);

  let i = start + open.length;
  let depth = 1;
  const tag = /<\/?div\b/gi;
  tag.lastIndex = i;

  let m;
  while ((m = tag.exec(html))) {
    depth += m[0][1] === "/" ? -1 : 1;
    if (depth === 0) {
      return html.slice(start + open.length, m.index).trim();
    }
  }
  throw new Error(`Unbalanced prose div in ${slug}`);
}

async function run() {
  await db.migrate();
  console.log("Schema ready.");

  /* admin user */
  const { hash, salt } = hashPassword(SEED_ADMIN.password);
  const created = await db.createUser({
    email: SEED_ADMIN.email,
    name: SEED_ADMIN.name,
    hash,
    salt,
  });
  if (created) {
    console.log(`Admin created:  ${SEED_ADMIN.email}  /  ${SEED_ADMIN.password}`);
  } else {
    console.log(`Admin already exists: ${SEED_ADMIN.email}`);
  }

  /* posts */
  for (const src of SOURCES) {
    const existing = await db.getPostBySlug(src.slug, { publishedOnly: false });
    if (existing) {
      console.log(`Skipped (already imported): ${src.slug}`);
      continue;
    }

    let content;
    try {
      content = await extractProse(src.slug);
    } catch (err) {
      console.log(`Skipped ${src.slug}: ${err.message}`);
      continue;
    }

    const post = await db.createPost({
      slug: src.slug,
      title: src.title,
      category: src.category,
      excerpt: src.excerpt,
      tldr: src.tldr,
      content,
      banner_grad: gradFor(src.category, null),
      read_minutes: estimateMinutes(content),
      status: "published",
      author_name: "The Hawcus Team",
    });

    // createPost stamps published_at to now; restore the original date
    await db.query("UPDATE posts SET published_at = $1 WHERE id = $2", [src.published_at, post.id]);
    await db.replaceFaqs(post.id, src.faqs.map(([question, answer]) => ({ question, answer })));

    console.log(`Imported: ${src.slug}  (${estimateMinutes(content)} min read, ${src.faqs.length} FAQs)`);
  }

  const all = await db.listPosts();
  console.log(`\nDone. ${all.length} posts in the database.`);
  await db.pool.end();
}

/* Only seed when this file is run directly, so other scripts can import
   extractProse without kicking off an import. */
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  run().catch(async (err) => {
    console.error("\nSeed failed:", err.message);
    console.error("Is the database running?  npm run db:up\n");
    try { await db.pool.end(); } catch {}
    process.exit(1);
  });
}
