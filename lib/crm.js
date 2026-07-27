import { CRM } from "./config.js";

/* Posts a single enquiry to the Hawcus CRM workflow. Shape matches the webhook:
   { api_token, contact_name, contact_email, contact_phone } plus the marketing
   attribution (utm_source, utm_medium, utm_campaign, utm_term, utm_content,
   gclid, fbclid, referrer, landing_page) captured on the landing page, sent as
   top-level fields so the CRM workflow can map whichever ones it needs. */
export async function sendToCrm({ name, email, phone, attribution = {} }) {
  const res = await fetch(CRM.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_token: CRM.token,
      contact_name: name || "",
      contact_email: email || "",
      contact_phone: phone || "",
      utm_source: attribution.utm_source || "",
      utm_medium: attribution.utm_medium || "",
      utm_campaign: attribution.utm_campaign || "",
      utm_term: attribution.utm_term || "",
      utm_content: attribution.utm_content || "",
      gclid: attribution.gclid || "",
      fbclid: attribution.fbclid || "",
      referrer: attribution.referrer || "",
      landing_page: attribution.landing_page || "",
    }),
    // never let a slow or hung webhook hold up the visitor's submission
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CRM webhook ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}
