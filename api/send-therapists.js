import { cronAllowed } from "./_cron.js";
import { sbAdmin, kvGet, kvSet } from "./_send.js";
import { shouldPush } from "./push-register.js";
import { sign, sendMail } from "./_waitlist.js";

export const config = { maxDuration: 120 };

// SEND Intelligence for Qura's own therapists (idea 23, week 6). Mondays at 08:40 UTC.
// Every VERIFIED clinician in the UK whose profession is physiotherapy, occupational therapy,
// speech and language therapy or psychology gets one email (and an app alert if they allow
// match alerts) listing school therapy roles Qura first saw in the last 7 days. Each email has
// a one-click opt-out. Decided by Olamide on 9 October 2026: on, verified therapists only.
// A founder can pause it with kv shared/send_therapist_alerts { enabled: false }.
// Clinician profiles hold a country but no home area, so the list is national, newest first.

const FAMILY = [
  [/physio/i, "physiotherapy", "physiotherapy"],
  [/occupational/i, "occupational_therapy", "occupational therapy"],
  [/speech|language therap|\bSALT\b|\bSLT\b/i, "speech_language", "speech and language therapy"],
  [/psycholog/i, "psychology", "psychology"],
];
const SITE = "https://www.qurahealth.org";
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ukDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }) : "";

export default async function handler(req, res) {
  if (!(await cronAllowed(req))) return res.status(401).json({ error: "Not allowed" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  const cfg = (await kvGet("shared", "send_therapist_alerts")) || {};
  if (cfg.enabled === false) return res.status(200).json({ ok: true, skipped: "paused by a founder" });
  const dry = String((req.query && req.query.dry) || "") === "1";
  const log = { at: new Date().toISOString(), clinicians: 0, eligible: 0, emailed: 0, pushed: 0, noRoles: 0, optedOut: 0, dry, errors: [] };

  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: vac, error } = await sb.from("send_vacancies").select("original_title,profession_family,salary_text,closing_at,source_url,first_seen_at,send_organisations(name,la_name,setting_group)")
    .eq("status", "LIVE").in("profession_family", FAMILY.map((f) => f[1])).gte("first_seen_at", since).order("first_seen_at", { ascending: false }).limit(400);
  if (error) return res.status(500).json({ error: error.message });

  const ids = (await kvGet("shared", "clinician_registrations")) || [];
  for (const uid of (Array.isArray(ids) ? ids : []).slice(0, 2000)) {
    log.clinicians++;
    try {
      const p = (await kvGet(uid, "clinician_profile")) || {};
      if (!p.verifiedAt || !p.email) continue;
      if (!/united kingdom|^uk$|england|scotland|wales|northern ireland/i.test(String(p.country || ""))) continue;
      const fam = FAMILY.find(([re]) => re.test(String(p.profession || "")));
      if (!fam) continue;
      log.eligible++;
      const pref = (await kvGet(uid, "send_role_alerts")) || {};
      if (pref.off) { log.optedOut++; continue; }
      if (pref.lastSent && Date.now() - Date.parse(pref.lastSent) < 6 * 86400000) continue;
      const roles = (vac || []).filter((v) => v.profession_family === fam[1]).slice(0, 15);
      if (!roles.length) { log.noRoles++; continue; }
      if (dry) continue;
      const unsub = SITE + "/api/send-unsub?k=therapist&u=" + encodeURIComponent(uid) + "&t=" + sign(uid, "send_therapist_unsub");
      const rows = roles.map((v) => { const o = v.send_organisations || {}; return '<tr><td style="padding:9px 0;border-bottom:1px solid #E3E8F2"><b>' + esc(v.original_title) + "</b><br>" + esc(o.name || "") + (o.la_name ? ", " + esc(o.la_name) : "") + (v.salary_text ? "<br>" + esc(v.salary_text) : "") + (v.closing_at ? "<br>Closes " + esc(ukDate(v.closing_at)) : "") + '<br><a href="' + esc(v.source_url) + '" style="color:#0E8C7E">Read the advert and apply with the school</a></td></tr>'; }).join("");
      const html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#12263F"><div style="background:#0A1730;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0"><b>Qura</b> · School roles in ' + esc(fam[2]) + '</div><div style="border:1px solid #E3E8F2;border-top:none;padding:20px;border-radius:0 0 12px 12px">' +
        "<p>Special schools, alternative provision and schools with SEN units are hiring. These " + roles.length + " " + esc(fam[2]) + " roles were first seen on schools' own websites in the last 7 days.</p>" +
        '<table style="width:100%;border-collapse:collapse;font-size:14px">' + rows + "</table>" +
        '<p style="font-size:13px;color:#5A6783">You apply directly with each school. Always check the advert, as details can change.</p>' +
        '<p style="font-size:12px;color:#8494AD;margin-top:20px">You get this because you are a verified ' + esc(p.profession) + ' on Qura. <a href="' + esc(unsub) + '" style="color:#8494AD">Stop school role emails</a>. Qura Ltd, company number 17310951.</p></div></div>';
      const m = await sendMail([p.email], roles.length + " new school " + fam[2] + " role" + (roles.length === 1 ? "" : "s") + " this week", html);
      if (m.ok) log.emailed++; else log.errors.push("mail: " + m.error);
      const reg = await kvGet(uid, "push_registration");
      if (shouldPush(reg, "matches")) {
        const r = await fetch("https://exp.host/--/api/v2/push/send", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify([{ to: reg.token, title: "New school " + fam[2] + " roles", body: roles.length + " new this week. Check your email for the list." }]) }).catch(() => null);
        if (r && r.ok) log.pushed++;
      }
      await kvSet(uid, "send_role_alerts", { ...pref, lastSent: new Date().toISOString(), lastCount: roles.length });
    } catch (e) { log.errors.push(String(e.message || e)); }
  }
  await kvSet("shared", "send_therapist_state", { lastRun: log.at, lastLog: { ...log, errors: log.errors.slice(0, 10) } });
  return res.status(200).json({ ok: true, log });
}
