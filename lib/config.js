import { randomBytes } from "node:crypto";

/* Central configuration. Every value can be overridden with an env var.
   Secrets belong in .env, which is gitignored and never web-served. */

// Node 20.12+ can read .env itself, so no dotenv dependency is needed
try {
  process.loadEnvFile();
} catch {
  /* no .env present, fall back to real env vars and defaults */
}

export const PORT = Number(process.env.PORT || 8080);

export const DB = {
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5433),
  user: process.env.PGUSER || "hawcus",
  password: process.env.PGPASSWORD || "hawcus_dev_pw",
  database: process.env.PGDATABASE || "hawcus",
};

/* Signs the admin session cookie. A hardcoded fallback in a public repository
   would let anyone forge an admin session, so generate a random one instead.
   Sessions then reset on restart, which is a nuisance but never a hole. */
export const SESSION_SECRET =
  process.env.SESSION_SECRET || randomBytes(32).toString("hex");

if (!process.env.SESSION_SECRET) {
  console.warn(
    "WARNING: SESSION_SECRET is not set. Using a random value, so admin logins " +
      "will not survive a restart. Set it in .env for production."
  );
}

export const SESSION_HOURS = Number(process.env.SESSION_HOURS || 12);

/* Seed admin, used only the first time the database is created. */
export const SEED_ADMIN = {
  email: process.env.ADMIN_EMAIL || "admin@hawcus.com",
  password: process.env.ADMIN_PASSWORD || "hawcus123",
  name: process.env.ADMIN_NAME || "Hawcus Admin",
};

export const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://hawcus.com";

/* Outbound mail for contact and demo enquiries. Credentials come from .env only,
   so nothing sensitive lives in the repository. */
export const MAIL = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  user: process.env.SMTP_USER || "",
  // Gmail shows app passwords in groups of four; the spaces are not part of it
  pass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
  to: process.env.LEAD_TO || process.env.SMTP_USER || "",
};

export const MAIL_READY = Boolean(MAIL.user && MAIL.pass && MAIL.to);

/* Forwards every contact and demo enquiry into the Hawcus CRM app through its
   workflow webhook. The URL carries the workflow id and the token authenticates
   the call, so both live in .env only and never in the repository. */
export const CRM = {
  url: process.env.CRM_WEBHOOK_URL || "",
  token: process.env.CRM_API_TOKEN || "",
};

export const CRM_READY = Boolean(CRM.url && CRM.token);
