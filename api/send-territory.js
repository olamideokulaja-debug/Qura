import { sbAdmin, sendAccess, budgetLeft, recordUsage } from "./_send.js";
import { limited } from "./_ratelimit.js";

// SEND Intelligence territories, council heat view and outreach drafts (week 4).
//   GET  /api/send-territory?view=list            your territories with headline figures
//   GET  /api/send-territory?view=detail&id=...   one territory: schools, live vacancies, coverage, opening soon
//   GET  /api/send-territory?view=las             councils for the picker
//   GET  /api/send-territory?view=heat            council circles: live vacancies, SEN pupils, coverage
//   POST { action: "save", id?, name, la_codes[], settings[], families[], alerts, briefing }
//   POST { action: "delete", id }
//   POST { action: "outreach", vacancy_id? | organisation_id? }  AI first draft; a person edits and sends it
// Founders, or suppliers with an active SEND entitlement. Territories belong to the person who made them.

const SETTINGS = ["special", "ap", "mainstream_unit"];
const clean = (v, n = 120) => String(v == null ? "" : v).trim().slice(0, n);

async function pageAll(build) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data || [])); if (!data || data.length < 1000) break;
  }
  return out;
}

async function territoryFigures(sb, t, withLists) {
  let sq = () => { let q = sb.from("send_organisations").select("id,name,setting_group,la_name,sen_ehcp,status,open_date,website").eq("org_kind", "school").eq("in_scope", true); if (t.la_codes.length) q = q.in("la_code", t.la_codes); if (t.settings.length) q = q.in("setting_group", t.settings); return q; };
  const schools = await pageAll(sq);
  const ids = schools.map((s) => s.id);
  let live = [];
  for (let i = 0; i < ids.length; i += 300) {
    let q = sb.from("send_vacancies").select("id,original_title,profession_family,salary_text,closing_at,source_url,first_seen_at,organisation_id").eq("status", "LIVE").in("organisation_id", ids.slice(i, i + 300));
    if (t.families.length) q = q.in("profession_family", t.families);
    const { data } = await q; live.push(...(data || []));
  }
  const { data: areas } = t.la_codes.length ? await sb.from("send_area_metrics").select("area_code,area_name,schools,sources_monitored,coverage_pct").eq("area_kind", "local_authority").in("area_code", t.la_codes) : { data: [] };
  const monitored = (areas || []).reduce((a, r) => a + (r.sources_monitored || 0), 0), total = (areas || []).reduce((a, r) => a + (r.schools || 0), 0);
  const fig = { schools: schools.length, live_vacancies: live.length, new_7d: live.filter((v) => Date.now() - new Date(v.first_seen_at).getTime() < 7 * 86400000).length, sen_ehcp: schools.reduce((a, s) => a + (s.sen_ehcp || 0), 0), coverage_pct: total ? Math.round((monitored / total) * 1000) / 10 : null };
  if (!withLists) return fig;
  const byId = new Map(schools.map((s) => [s.id, s]));
  return { ...fig, vacancies: live.sort((a, b) => new Date(b.first_seen_at) - new Date(a.first_seen_at)).slice(0, 100).map((v) => ({ ...v, school: (byId.get(v.organisation_id) || {}).name, la_name: (byId.get(v.organisation_id) || {}).la_name })), opening_soon: schools.filter((s) => s.status === "Proposed to open").map((s) => ({ name: s.name, la_name: s.la_name, open_date: s.open_date, website: s.website })), areas: areas || [] };
}

export default async function handler(req, res) {
  const access = await sendAccess(req);
  if (!access.user) return res.status(401).json({ error: "Sign in required" });
  if (!access.ok) return res.status(403).json({ error: "SEND Intelligence is not switched on for this account" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  res.setHeader("Cache-Control", "no-store");
  const uid = String(access.user.id);

  try {
    if (req.method === "GET") {
      const view = String(req.query.view || "list");
      if (view === "las") {
        const { data } = await sb.from("send_organisations").select("la_code,name,region").eq("org_kind", "local_authority").eq("in_scope", true).order("name");
        return res.status(200).json({ las: (data || []).map((l) => ({ code: l.la_code, name: l.name, region: l.region })) });
      }
      if (view === "heat") {
        const schools = await pageAll(() => sb.from("send_organisations").select("id,la_code,la_name,lat,lng,sen_ehcp,sen_support").eq("org_kind", "school").eq("in_scope", true).not("lat", "is", null));
        const live = await pageAll(() => sb.from("send_vacancies").select("organisation_id").eq("status", "LIVE"));
        const vc = new Map(); for (const v of live) vc.set(v.organisation_id, (vc.get(v.organisation_id) || 0) + 1);
        const { data: areas } = await sb.from("send_area_metrics").select("area_code,coverage_pct").eq("area_kind", "local_authority");
        const cov = new Map((areas || []).map((a) => [a.area_code, a.coverage_pct]));
        const by = new Map();
        for (const s of schools) { const a = by.get(s.la_code) || { code: s.la_code, name: s.la_name, n: 0, lat: 0, lng: 0, live: 0, sen: 0 }; a.n++; a.lat += s.lat; a.lng += s.lng; a.live += vc.get(s.id) || 0; a.sen += (s.sen_ehcp || 0) + (s.sen_support || 0); by.set(s.la_code, a); }
        const out = [...by.values()].map((a) => ({ code: a.code, name: a.name, schools: a.n, lat: a.lat / a.n, lng: a.lng / a.n, live_vacancies: a.live, sen_pupils: a.sen, per_1000_sen: a.sen ? Math.round((a.live / a.sen) * 10000) / 10 : null, coverage_pct: cov.get(a.code) ?? null }));
        return res.status(200).json({ areas: out, note: "Vacancies per 1,000 SEN pupils counts only adverts Qura has seen; read it with the coverage figure." });
      }
      if (view === "detail") {
        const { data: t } = await sb.from("send_territories").select("*").eq("id", String(req.query.id || "")).eq("user_id", uid).maybeSingle();
        if (!t) return res.status(404).json({ error: "Territory not found" });
        return res.status(200).json({ territory: t, figures: await territoryFigures(sb, t, true) });
      }
      const { data: ts } = await sb.from("send_territories").select("*").eq("user_id", uid).order("created_at");
      const out = [];
      for (const t of ts || []) out.push({ ...t, figures: await territoryFigures(sb, t, false) });
      return res.status(200).json({ territories: out });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const b = req.body || {};
    if (b.action === "save") {
      const row = {
        user_id: uid, email: access.user.email || null, name: clean(b.name, 80) || "My territory",
        la_codes: (Array.isArray(b.la_codes) ? b.la_codes : []).map((x) => clean(x, 6)).filter(Boolean).slice(0, 60),
        settings: (Array.isArray(b.settings) ? b.settings : []).filter((x) => SETTINGS.includes(x)),
        families: (Array.isArray(b.families) ? b.families : []).map((x) => clean(x, 40)).filter(Boolean).slice(0, 20),
        alerts: b.alerts !== false, briefing: b.briefing !== false, updated_at: new Date().toISOString(),
      };
      if (!row.la_codes.length) return res.status(400).json({ error: "Choose at least one council" });
      if (b.id) {
        const { data, error } = await sb.from("send_territories").update(row).eq("id", String(b.id)).eq("user_id", uid).select("id").maybeSingle();
        if (error || !data) return res.status(404).json({ error: "Territory not found" });
        return res.status(200).json({ ok: true, id: data.id });
      }
      const { count } = await sb.from("send_territories").select("id", { count: "exact", head: true }).eq("user_id", uid);
      if ((count || 0) >= 20) return res.status(400).json({ error: "You can save up to 20 territories" });
      const { data, error } = await sb.from("send_territories").insert(row).select("id").single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, id: data.id });
    }
    if (b.action === "delete") {
      await sb.from("send_territories").delete().eq("id", String(b.id || "")).eq("user_id", uid);
      return res.status(200).json({ ok: true });
    }
    if (b.action === "outreach") {
      if (await limited(req, res, access.user, { bucket: "send_outreach", limit: 30, windowSec: 3600 })) return;
      const budget = await budgetLeft(sb);
      if (budget.stop) return res.status(429).json({ error: "Today's AI allowance for SEND Intelligence is used up. Try again tomorrow." });
      let vac = null, org = null;
      if (b.vacancy_id) { const { data } = await sb.from("send_vacancies").select("original_title,salary_text,closing_at,contract_type,organisation_id,source_url").eq("id", String(b.vacancy_id)).maybeSingle(); vac = data; }
      const orgId = (vac && vac.organisation_id) || b.organisation_id;
      if (orgId) { const { data } = await sb.from("send_organisations").select("name,establishment_type,setting_group,la_name,sen_provision,resourced_provision_type,trust_name").eq("id", String(orgId)).maybeSingle(); org = data; }
      if (!org) return res.status(404).json({ error: "School not found" });
      const key = process.env.ANTHROPIC_API_KEY; if (!key) return res.status(500).json({ error: "AI not configured" });
      const facts = { school: org.name, type: org.establishment_type, council: org.la_name, trust: org.trust_name || null, sen_provision: org.sen_provision || [], unit: org.resourced_provision_type || null, vacancy: vac ? { title: vac.original_title, pay: vac.salary_text || null, closing: vac.closing_at ? vac.closing_at.slice(0, 10) : null, contract: vac.contract_type || null } : null, sender_company: clean(b.company, 120) || null };
      const system = "You draft a short, professional first email from a UK specialist staffing supplier to a school. British English. No em dashes. 120 to 170 words. Use ONLY the facts given; never invent names, numbers, candidates, credentials or claims about the supplier. Address it to the headteacher or the person responsible for recruitment, without a name. Mention the specific vacancy if one is given. Offer a short call. Plain text, with a subject line first as 'Subject: ...'. Leave [square brackets] where the sender must add their own details.";
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: process.env.SEND_AI_MODEL || "claude-haiku-4-5", max_tokens: 500, system, messages: [{ role: "user", content: JSON.stringify(facts) }] }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || "AI request failed" });
      const u = data.usage || {}; const pence = ((u.input_tokens || 0) * 80 + (u.output_tokens || 0) * 400) / 1e6;
      await recordUsage(sb, "ai_outreach", 1, Math.round(pence * 100) / 100);
      const text = (data.content || []).filter((x) => x.type === "text").map((x) => x.text).join("").trim();
      return res.status(200).json({ draft: text, note: "AI first draft. Check every line, add your details, and send it yourself.", source_url: vac ? vac.source_url : null });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
