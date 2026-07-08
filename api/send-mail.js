// Sends transactional email via Resend. Set RESEND_API_KEY (and optionally MAIL_FROM)
// in Vercel env vars, and verify your sending domain in Resend.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Qura <noreply@qurahealth.org>";
  if (!key) return res.status(500).json({ error: "RESEND_API_KEY is not set" });
  let body = req.body;
  if (!body || typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { body = {}; } }
  const { to, subject, text, html } = body || {};
  if (!to || !subject) return res.status(400).json({ error: "Missing 'to' or 'subject'" });
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, text: text || undefined, html: html || undefined }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (data && data.message) || "Send failed" });
    return res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
