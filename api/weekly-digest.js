import { createClient } from "@supabase/supabase-js";
import { limited } from "./_ratelimit.js";
import { alertFounders } from "./_alert.js";

export const config = { maxDuration: 60 };

// The Monday morning digest.
//
// Goes ONLY to people who have saved a tender alert, because saving one is a
// clear request to be told about this, and removing your last alert stops the
// digest. That keeps the email wanted rather than broadcast, which matters both
// for deliverability and for the promise that Qura is not a spam machine.
//
// Contents: the week's procurement notices matching your alerts, and how many
// new notices arrived overall. Personalised per recipient, one email each,
// capped, and any single failure never stops the rest.

const RESEND = "https://api.resend.com/emails";

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function noticeRow(n) {
  return (
    '<tr><td style="padding:10px 0;border-bottom:1px solid #EDF1F8">' +
    '<div style="font-weight:600;font-size:14px;color:#12263F">' + esc(n.title) + "</div>" +
    '<div style="font-size:12.5px;color:#69768F;margin-top:2px">' + esc(n.buyer) + " · " + esc(n.region) +
    " · closes " + esc(n.closes) + " · " + esc(n.source) + "</div>" +
    (n.url ? '<div style="font-size:12.5px;margin-top:2px"><a href="' + esc(n.url) + '" style="color:#0E8C7E">Open the notice</a></div>' : "") +
    "</td></tr>"
  );
}

export default async function handler(req, res) {
  if (await limited(req, res, null, { bucket: "cron-digest", limit: 3, windowSec: 86400 })) return;

  const sbUrl = process.env.SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!sbUrl || !service || !resendKey) return res.status(500).json({ error: "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY." });
  const from = process.env.MAIL_FROM || "Qura <noreply@qurahealth.org>";

  const sb = createClient(sbUrl, service, { auth: { persistSession: false } });
  const kvRead = async (owner, key) => {
    const { data } = await sb.from("kv").select("value").eq("owner", owner).eq("key", key).maybeSingle();
    if (!data) return null;
    try { return JSON.parse(data.value); } catch { return data.value; }
  };

  try {
    const tenders = (await kvRead("shared", "tenders")) || {};
    const items = Array.isArray(tenders.items) ? tenders.items : [];
    const weekAgo = Date.now() - 7 * 86400000;
    const recent = items.filter((n) => n.publishedAt && Date.parse(n.publishedAt) >= weekAgo);

    const users = (await kvRead("shared", "tender_alert_users")) || [];
    let sent = 0, skipped = 0;

    for (const uid of (Array.isArray(users) ? users : []).slice(0, 300)) {
      try {
        const alerts = (await kvRead(uid, "tender_alerts")) || [];
        if (!Array.isArray(alerts) || alerts.length === 0) { skipped++; continue; }

        const hits = recent.filter((n) => alerts.some((a) => {
          const mOk = a.market === "All" || n.market === a.market;
          const q = String(a.query || "").toLowerCase();
          const qOk = !q || (n.title + " " + n.buyer + " " + n.profession + " " + n.note).toLowerCase().includes(q);
          return mOk && qOk;
        })).slice(0, 12);

        // Nothing matched this week: skip rather than send an empty email.
        if (hits.length === 0) { skipped++; continue; }

        // The recipient's address, from the auth system rather than anything user-editable.
        const ur = await fetch(sbUrl + "/auth/v1/admin/users/" + uid, {
          headers: { apikey: service, Authorization: "Bearer " + service },
        });
        if (!ur.ok) { skipped++; continue; }
        const u = await ur.json();
        const email = u && u.email;
        if (!email) { skipped++; continue; }

        const html =
          '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px 16px">' +
          '<div style="font-size:18px;font-weight:700;color:#12263F">Your week on Qura</div>' +
          '<div style="font-size:13px;color:#69768F;margin-top:4px">' + recent.length + " new procurement notices this week. " +
          hits.length + " matched your alerts.</div>" +
          '<table style="width:100%;border-collapse:collapse;margin-top:14px">' + hits.map(noticeRow).join("") + "</table>" +
          '<div style="font-size:12px;color:#69768F;margin-top:18px;line-height:1.6">' +
          "You receive this because you saved a tender alert on Qura. Remove your alerts in the app, on the Live demand screen, and this digest stops. " +
          'Questions: <a href="mailto:support@qurahealth.org" style="color:#0E8C7E">support@qurahealth.org</a>.</div>' +
          "</div>";

        const mr = await fetch(RESEND, {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: "Bearer " + resendKey },
          body: JSON.stringify({ from, to: email, subject: hits.length + (hits.length === 1 ? " tender matches" : " tenders match") + " your Qura alerts this week", html }),
        });
        if (mr.ok) sent++; else skipped++;
      } catch (e) { skipped++; }
    }

    return res.status(200).json({ ok: true, sent, skipped, recent: recent.length });
  } catch (e) {
    await alertFounders("cron-digest", "Weekly digest failed", String((e && e.message) || e));
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
