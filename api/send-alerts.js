import { cronAllowed } from "./_cron.js";
import { sbAdmin, kvGet, kvSet } from "./_send.js";
import { shouldPush } from "./push-register.js";
import { owners, sign } from "./_waitlist.js";

export const config = { maxDuration: 300 };

// SEND Intelligence: territory alerts (daily) and the weekly SEND briefing (Mondays), week 4.
// Daily at 07:20 UTC (vercel.json). For each saved territory with alerts on, new LIVE SEND
// vacancies first seen since the last alert are sent by email (with one-click unsubscribe)
// and, where the person has the app and allows it, a push notification. On Mondays,
// territories with the briefing on also get a weekly summary. Vercel Cron or a founder only.

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const SITE = "https://www.qurahealth.org";

async function mail(to, subject, html, unsub) {
  const key = process.env.RESEND_API_KEY; if (!key) return false;
  const from = process.env.MAIL_FROM || "noreply@qurahealth.org";
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    body: JSON.stringify({ from: "Qura <" + from + ">", to: [to], subject, html, reply_to: owners()[0] || "support@qurahealth.org", headers: { "List-Unsubscribe": "<" + unsub + ">", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }) }).catch(() => null);
  return Boolean(r && r.ok);
}
async function push(userId, title, body) {
  const reg = await kvGet(userId, "push_registration");
  if (!shouldPush(reg, "tenders")) return false;
  const r = await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify([{ to: reg.token, title, body, data: { url: SITE + "/?open=send&tab=vacancies" } }]) }).catch(() => null);
  return Boolean(r && r.ok);
}
const shell = (title, inner, unsub) => '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#12263F"><div style="background:#0A1730;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0"><b>Qura SEND Intelligence</b></div><div style="border:1px solid #E3E8F2;border-top:none;padding:20px;border-radius:0 0 12px 12px"><h2 style="font-size:18px;margin:0 0 12px">' + esc(title) + '</h2>' + inner + '<p style="font-size:12px;color:#8494AD;margin-top:24px">Vacancies come from school, trust and council pages Qura is allowed to check, so coverage is partial. <a href="' + esc(unsub) + '" style="color:#8494AD">Stop SEND alerts and briefings</a>. Qura Ltd, company number 17310951.</p></div></div>';
const vacRows = (list) => '<table style="width:100%;border-collapse:collapse;font-size:13px">' + list.map((v) => '<tr><td style="padding:8px 0;border-bottom:1px solid #E3E8F2"><b>' + esc(v.original_title) + '</b><br>' + esc(v.school || "") + (v.la_name ? ", " + esc(v.la_name) : "") + (v.salary_text ? "<br>" + esc(v.salary_text) : "") + (v.closing_at ? "<br>Closes " + esc(v.closing_at.slice(0, 10)) : "") + '<br><a href="' + esc(v.source_url) + '" style="color:#0E8C7E">View the advert</a></td></tr>').join("") + "</table>";

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const log = { at: new Date().toISOString(), territories: 0, alertEmails: 0, pushes: 0, briefings: 0, errors: [] };
  const monday = new Date().getUTCDay() === 1;
  const { data: ts, error } = await sb.from("send_territories").select("*").or("alerts.eq.true,briefing.eq.true");
  if (error) return res.status(500).json({ error: error.message });

  for (const t of ts || []) {
    log.territories++;
    // Still entitled?
    const isFounder = owners().includes(String(t.email || "").toLowerCase());
    if (!isFounder) {
      const { data: ent } = await sb.from("supplier_sector_entitlements").select("status,expires_at").eq("user_id", t.user_id).eq("sector_code", "SEND").maybeSingle();
      if (!ent || !["active", "pilot"].includes(ent.status) || (ent.expires_at && new Date(ent.expires_at) < new Date())) continue;
    }
    const unsub = SITE + "/api/send-unsub?u=" + encodeURIComponent(t.user_id) + "&t=" + sign(t.user_id, "send_unsub");
    const schools = [];
    for (let from = 0; ; from += 1000) {
      let q = sb.from("send_organisations").select("id,name,la_name,status,open_date").eq("org_kind", "school").eq("in_scope", true).in("la_code", t.la_codes);
      if (t.settings && t.settings.length) q = q.in("setting_group", t.settings);
      const { data } = await q.range(from, from + 999); schools.push(...(data || [])); if (!data || data.length < 1000) break;
    }
    const byId = new Map(schools.map((s) => [s.id, s])); const ids = schools.map((s) => s.id);
    const since = t.last_alert_at || new Date(Date.now() - 86400000).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const fresh = [], week = [];
    for (let i = 0; i < ids.length; i += 300) {
      let q = sb.from("send_vacancies").select("original_title,profession_family,salary_text,closing_at,source_url,first_seen_at,organisation_id").eq("status", "LIVE").in("organisation_id", ids.slice(i, i + 300)).gte("first_seen_at", weekAgo);
      if (t.families && t.families.length) q = q.in("profession_family", t.families);
      const { data } = await q;
      for (const v of data || []) { const o = byId.get(v.organisation_id) || {}; const row = { ...v, school: o.name, la_name: o.la_name }; week.push(row); if (v.first_seen_at > since) fresh.push(row); }
    }
    if (t.alerts && fresh.length && t.email) {
      const ok = await mail(t.email, fresh.length + " new SEND vacanc" + (fresh.length === 1 ? "y" : "ies") + " in " + t.name, shell("New in " + t.name, vacRows(fresh.slice(0, 40)) + (fresh.length > 40 ? "<p>And " + (fresh.length - 40) + " more in Qura.</p>" : "") + '<p><a href="' + SITE + '/?open=send&amp;tab=territories" style="color:#0E8C7E">Open your territory in Qura</a></p>', unsub), unsub);
      if (ok) log.alertEmails++;
      if (await push(t.user_id, "New SEND vacancies in " + t.name, fresh.length + " new since your last alert")) log.pushes++;
    }
    if (t.alerts) await sb.from("send_territories").update({ last_alert_at: new Date().toISOString() }).eq("id", t.id);
    if (monday && t.briefing && t.email) {
      const opening = schools.filter((s) => s.status === "Proposed to open");
      const fam = {}; for (const v of week) fam[v.profession_family] = (fam[v.profession_family] || 0) + 1;
      const inner = "<p><b>" + week.length + "</b> new SEND vacancies in the last 7 days across " + schools.length + " schools in this territory.</p>" +
        (Object.keys(fam).length ? "<p>" + Object.entries(fam).sort((a, b) => b[1] - a[1]).map(([k, n]) => esc(k.replace(/_/g, " ")) + ": " + n).join(" &middot; ") + "</p>" : "") +
        (opening.length ? "<p><b>Opening soon:</b> " + opening.map((s) => esc(s.name) + (s.open_date ? " (" + esc(s.open_date) + ")" : "")).join("; ") + "</p>" : "") +
        (week.length ? "<h3 style=\"font-size:15px\">Latest</h3>" + vacRows(week.slice(0, 15)) : "") +
        '<p><a href="' + SITE + '/?open=send&amp;tab=territories" style="color:#0E8C7E">See the full picture in Qura</a></p>';
      if (await mail(t.email, "Your weekly SEND briefing: " + t.name, shell("Weekly SEND briefing: " + t.name, inner, unsub), unsub)) log.briefings++;
    }
  }
  await kvSet("shared", "send_alerts_state", { lastRun: log.at, lastLog: log });
  return res.status(200).json({ ok: true, log });
}
