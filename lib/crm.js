import { CRM } from "./config.js";

/* Posts a single enquiry to the Hawcus CRM workflow. Shape matches the webhook:
   { api_token, contact_name, contact_email, contact_phone }. */
export async function sendToCrm({ name, email, phone }) {
  const res = await fetch(CRM.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_token: CRM.token,
      contact_name: name || "",
      contact_email: email || "",
      contact_phone: phone || "",
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
