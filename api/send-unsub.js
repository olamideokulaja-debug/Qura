import { sbAdmin } from "./_send.js";
import { verify } from "./_waitlist.js";

// One-click unsubscribe for SEND alerts and weekly briefings (signed link; no sign-in needed).
// GET shows a button (mail scanners open links on their own); POST turns them off, which is
// also what Gmail and Outlook send for the List-Unsubscribe-Post header.

const page = (res, status, title, body) => { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.setHeader("X-Robots-Tag", "noindex");
  return res.status(status).send('<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + ' | Qura</title></head><body style="margin:0;background:#F5F7FB;font-family:Arial,sans-serif;color:#0A1730"><div style="max-width:480px;margin:60px auto;padding:28px;background:#fff;border-radius:16px;border:1px solid #E3E8F2;line-height:1.6"><div style="font-weight:800;font-size:20px;margin-bottom:12px">' + title + '</div>' + body + '<p style="font-size:12px;color:#8A96AD;margin-top:22px">Qura Ltd, company number 17310951. Questions: privacy@qurahealth.org</p></div></body></html>'); };

export default async function handler(req, res) {
  const u = String((req.query && req.query.u) || ""), t = String((req.query && req.query.t) || "");
  if (!u || !verify(u, "send_unsub", t)) return page(res, 400, "This link has not worked", "<p>The link is incomplete or has been changed. Email privacy@qurahealth.org and we will turn alerts off for you.</p>");
  if (req.method === "GET") {
    const action = "/api/send-unsub?u=" + encodeURIComponent(u) + "&t=" + encodeURIComponent(t);
    return page(res, 200, "Stop SEND alerts?", '<p>You will get no more SEND vacancy alerts or weekly SEND briefings. Your saved territories stay in Qura.</p><form method="post" action="' + action + '"><button type="submit" style="background:#00C2B8;color:#04231F;font-weight:700;padding:12px 24px;border-radius:999px;border:none;font-size:15px;cursor:pointer">Stop SEND alerts and briefings</button></form>');
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const sb = sbAdmin(); if (sb) await sb.from("send_territories").update({ alerts: false, briefing: false, updated_at: new Date().toISOString() }).eq("user_id", u);
  return page(res, 200, "You are unsubscribed", "<p>SEND alerts and briefings are off. You can switch them back on for any territory in Qura.</p>");
}
