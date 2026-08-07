// GET /api/set-password?t=<token>
//
// The approval email must not contain a Supabase URL. A link reading
// jggvouhtmzciptqltjum.supabase.co/auth/v1/verify?token=... in a message from
// a healthcare platform looks exactly like a phishing attempt, and it is the
// one link in the whole product we most need people to trust.
//
// So approval mints a short opaque token, stores the real Supabase action link
// against it, and emails qurahealth.org/api/set-password?t=<token>. This
// endpoint looks it up and redirects. The recipient only ever sees a Qura
// address; Supabase appears in the address bar for a moment on the way to
// reset-password.html, which is where the recovery flow has to land.

import { adminClient, kvRead, kvWrite } from "./_waitlist.js";

const page = (title, body, tone) =>
  '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>' + title + ' · Qura</title>' +
  '<div style="font-family:Inter,-apple-system,Arial,sans-serif;background:#050D1C;color:#EEF3FF;' +
  'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px">' +
  '<div style="max-width:460px;text-align:center">' +
  '<div style="font-size:26px;font-weight:700;color:' + tone + '">' + title + "</div>" +
  '<div style="margin-top:12px;font-size:15px;line-height:1.6;color:#9FB0D0">' + body + "</div>" +
  '<div style="margin-top:26px;font-size:13px;color:#5A6783">' +
  '<a href="https://www.qurahealth.org" style="color:#00C2B8;text-decoration:none">qurahealth.org</a></div>' +
  "</div></div>";

export default async function handler(req, res) {
  const t = String((req.query || {}).t || "").trim();
  res.setHeader("content-type", "text/html; charset=utf-8");

  if (!/^[a-f0-9]{32}$/i.test(t)) {
    return res.status(400).send(page("Link not valid",
      "That link is not one we issued. If you were approved for early access, use the link in your welcome email.", "#F59E0B"));
  }

  const admin = adminClient();
  if (!admin) return res.status(500).send(page("Not configured", "The server is missing its credentials.", "#F59E0B"));

  try {
    const rec = await kvRead(admin, "shared", "pw_link_" + t);
    if (!rec || !rec.link) {
      return res.status(404).send(page("Link not found",
        "This link has already been used, or it has expired. Ask the founders to send another and it takes a moment.", "#F59E0B"));
    }
    if (rec.expires && Date.now() > rec.expires) {
      return res.status(410).send(page("Link expired",
        "Set-password links last seven days. Ask the founders for a fresh one and we will send it straight away.", "#F59E0B"));
    }
    // Single use. Clearing it first means a link cannot be replayed even if
    // the redirect itself fails.
    await kvWrite(admin, "shared", "pw_link_" + t, { used: true, at: new Date().toISOString(), email: rec.email });
    res.writeHead(302, { Location: rec.link });
    return res.end();
  } catch (e) {
    return res.status(500).send(page("Something went wrong", String(e.message || e), "#F59E0B"));
  }
}
