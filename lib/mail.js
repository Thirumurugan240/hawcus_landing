/* Sends contact and demo enquiries to the sales inbox. */
import nodemailer from "nodemailer";

import { MAIL, MAIL_READY, SITE_ORIGIN } from "./config.js";

let transport = null;

function getTransport() {
  if (!MAIL_READY) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: MAIL.host,
      port: MAIL.port,
      secure: MAIL.port === 465, // 465 is implicit TLS, 587 upgrades with STARTTLS
      auth: { user: MAIL.user, pass: MAIL.pass },
    });
  }
  return transport;
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function rows(fields) {
  return fields
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:8px 14px;border-bottom:1px solid #e6e8ec;font:600 13px Arial,sans-serif;color:#6b7280;white-space:nowrap;vertical-align:top">${esc(k)}</td>
          <td style="padding:8px 14px;border-bottom:1px solid #e6e8ec;font:700 14px Arial,sans-serif;color:#111318">${esc(v).replace(/\n/g, "<br />")}</td>
        </tr>`
    )
    .join("");
}

function template({ heading, fields, source }) {
  return `<div style="background:#f5f6f8;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:2px solid #111318;border-radius:14px;overflow:hidden">
    <div style="height:6px;background:linear-gradient(90deg,#ea580c,#c2410c)"></div>
    <div style="padding:22px 24px 8px">
      <h1 style="margin:0 0 4px;font:800 19px Arial,sans-serif;color:#111318">${esc(heading)}</h1>
      <p style="margin:0 0 16px;font:600 13px Arial,sans-serif;color:#6b7280">From ${esc(source)} on hawcus.com</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px">${rows(fields)}</table>
    <div style="padding:14px 24px 22px">
      <p style="margin:0;font:600 12px Arial,sans-serif;color:#9aa0a8">Sent automatically by ${esc(SITE_ORIGIN)}</p>
    </div>
  </div>
</div>`;
}

/* Plain text alongside the HTML, so the mail does not look like spam and stays
   readable in clients that block HTML. */
function plain(fields) {
  return fields
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export async function sendLead({ kind, fields }) {
  const t = getTransport();
  if (!t) throw new Error("Mail is not configured");

  const isDemo = kind === "demo";
  const name = fields.find(([k]) => k === "Name")?.[1] || "Someone";
  const heading = isDemo ? "New demo booking" : "New website enquiry";
  const source = isDemo ? "the Book a Demo page" : "the contact form";
  const replyTo = fields.find(([k]) => k === "Email")?.[1];

  await t.sendMail({
    from: `"Hawcus website" <${MAIL.user}>`,
    to: MAIL.to,
    // replying in the inbox goes straight back to the lead
    replyTo: replyTo || undefined,
    subject: `${heading}: ${name}`,
    text: `${heading}\n\n${plain(fields)}\n`,
    html: template({ heading, fields, source }),
  });
}

/* Checks the credentials without sending anything. */
export async function verifyMail() {
  const t = getTransport();
  if (!t) return { ok: false, error: "Mail is not configured" };
  try {
    await t.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
