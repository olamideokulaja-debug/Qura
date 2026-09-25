// Sends transactional email via Resend. Set RESEND_API_KEY (and optionally MAIL_FROM)
// in Vercel env vars, and verify your sending domain in Resend.
import { getUser } from "./_auth.js";
import { limited } from "./_ratelimit.js";

// This route was previously open to anyone who found the address, which meant
// anyone could send email from the qurahealth.org domain to any recipient. It
// now requires a signed-in user and is rate limited.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "mail", limit: 20, windowSec: 3600 })) return;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Qura <noreply@qurahealth.org>";
  if (!key) return res.status(500).json({ error: "RESEND_API_KEY is not set" });
  let body = req.body;
  if (!body || typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { body = {}; } }
  const { subject, text } = body || {};
  // A copy to yourself only (the weekly report). It used to accept any
  // recipients and any HTML, which let any account send mail as Qura
  // (25 September security review).
  const to = user.email;
  if (!to || !subject) return res.status(400).json({ error: "Missing subject" });
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: String(subject).slice(0, 150), text: String(text || "").slice(0, 20000) }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (data && data.message) || "Send failed" });
    return res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
