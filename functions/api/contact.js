/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Body: { firstName, lastName, email, message, company }
 * `company` is the honeypot — a real visitor never sees it.
 *
 * Chosen deliberately over a third-party form service (Formspree and friends):
 * the visitor's browser only ever talks to wasimahin.com, so privacy.html's
 * "no third-party requests" promise stays literally true and the CSP needs only
 * form-action 'self' / connect-src 'self'.
 *
 * SETUP (one step, and only Wasi can do it):
 *   1. Create a free account at https://resend.com and verify a sending domain
 *      (or use their onboarding@resend.dev sender while testing).
 *   2. Cloudflare dashboard -> Pages -> wasimahin -> Settings -> Environment
 *      variables -> add a SECRET named  RESEND_API_KEY
 *   3. Optionally set  CONTACT_TO  (defaults to wasimahin@gmail.com) and
 *      CONTACT_FROM (defaults to onboarding@resend.dev).
 *
 * Without RESEND_API_KEY the endpoint returns a clear 503 and the form tells the
 * visitor to email directly — it never fails silently.
 */

const MAX = { name: 80, email: 200, message: 5000 };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
// Deliberately permissive: this is a sanity check, not an address validator.
const looksLikeEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

async function handlePost(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Malformed request." });
  }

  // Honeypot: a real person never sees this field, so anything in it is a bot.
  // Return 200 so the bot believes it succeeded and does not retry.
  if (clean(body.company, 100) !== "") return json(200, { ok: true });

  const firstName = clean(body.firstName, MAX.name);
  const lastName = clean(body.lastName, MAX.name);
  const email = clean(body.email, MAX.email);
  const message = clean(body.message, MAX.message);
  const name = `${firstName} ${lastName}`.trim();

  if (!firstName || !lastName || !email || !message) {
    return json(400, { error: "Please fill in every field." });
  }
  if (!looksLikeEmail(email)) return json(400, { error: "That email address doesn't look right." });
  if (message.length < 10) return json(400, { error: "Please add a little more detail." });

  const key = env.RESEND_API_KEY;
  if (!key) {
    return json(503, { error: "Messaging isn't configured yet — please email wasimahin@gmail.com." });
  }

  const to = env.CONTACT_TO || "wasimahin@gmail.com";
  const from = env.CONTACT_FROM || "wasimahin.com <onboarding@resend.dev>";
  const meta = [
    `From: ${firstName} ${lastName} <${email}>`,
    `Country: ${request.headers.get("cf-ipcountry") || "unknown"}`,
    `Received: ${new Date().toISOString()}`,
  ].join("\n");

  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `wasimahin.com — message from ${name}`,
        text: `${meta}\n\n${message}\n`,
      }),
    });
  } catch {
    return json(502, { error: "Could not send right now — please email wasimahin@gmail.com." });
  }

  if (!res.ok) {
    return json(502, { error: "Could not send right now — please email wasimahin@gmail.com." });
  }
  return json(200, { ok: true });
}

// Single entry point. Exporting onRequest *and* onRequestPost would make the
// method handler unreachable — onRequest wins for every method in Pages Functions.
export async function onRequest({ request, env }) {
  if (request.method === "POST") return handlePost(request, env);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
  }
  return json(405, { error: "Method not allowed." });
}
