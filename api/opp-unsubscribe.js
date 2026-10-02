import { kvGet, kvSet } from "./_auth.js";
import { verify } from "./_waitlist.js";
import { bump } from "./_metrics.js";

// One-click unsubscribe for role alert emails (api/opps-refresh.js).
//
// GET  /api/opp-unsubscribe?o=<user id>&t=<signature>   a page with one button
// POST /api/opp-unsubscribe?o=<user id>&t=<signature>   turns every role alert off
//
// The link is signed (HMAC, api/_waitlist.js) so it works without signing in.
// GET only shows the button, because mail scanners open links on their own and
// must not unsubscribe anyone. POST is what the button sends, and what Gmail and
// Outlook send for the List-Unsubscribe-Post header (RFC 8058).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function page(res, status, title, body) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(status).send('<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + ' | Qura</title></head>' +
    '<body style="margin:0;background:#F5F7FB;font-family:Inter,Arial,sans-serif;color:#0A1730"><div style="max-width:480px;margin:60px auto;padding:28px;background:#fff;border-radius:16px;border:1px solid #E3E8F2;line-height:1.6">' +
    '<div style="font-weight:800;font-size:20px;margin-bottom:12px">' + title + '</div>' + body +
    '<p style="font-size:12px;color:#8A96AD;margin-top:22px">Qura Ltd, company number 17310951. Questions: privacy@qurahealth.org</p></div></body></html>');
}

export default async function handler(req, res) {
  const o = String((req.query && req.query.o) || "");
  const t = String((req.query && req.query.t) || "");
  const valid = UUID.test(o) && verify(o, "opp_unsub", t);
  if (!valid) return page(res, 400, "This link has not worked", "<p>The unsubscribe link is incomplete or has been changed. Turn alerts off in Opportunities on Qura, or email privacy@qurahealth.org and we will do it for you.</p>");

  if (req.method === "GET") {
    const action = "/api/opp-unsubscribe?o=" + encodeURIComponent(o) + "&t=" + encodeURIComponent(t);
    return page(res, 200, "Stop role alerts?", '<p>You will get no more emails or notifications about new roles matching your saved searches. Your account and saved roles stay as they are.</p>' +
      '<form method="post" action="' + action + '"><button type="submit" style="background:#00C2B8;color:#04231F;font-weight:700;padding:12px 24px;border-radius:999px;border:none;font-size:15px;cursor:pointer">Unsubscribe from role alerts</button></form>');
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const list = (await kvGet(o, "opp_alerts")) || [];
  const had = Array.isArray(list) ? list.length : 0;
  if (had) { await kvSet(o, "opp_alerts", []); await bump("opp_alert_unsubscribed"); }
  return page(res, 200, "You are unsubscribed", "<p>Role alerts are off. You will not get any more alert emails or notifications. You can set a new alert at any time in Opportunities on Qura.</p>");
}
