import { sbAdmin, sendAccess, kvGet, budgetLeft } from "./_send.js";

// SEND Intelligence read API (week 1). Founders, or suppliers with an active
// SEND entitlement in supplier_sector_entitlements.
//   GET  /api/send?view=summary
//   GET  /api/send?view=organisations&setting=special&la=207&q=oak&page=1
//   POST /api/send { action: "ground_truth_add", items: [{ title, school_name, url, seen_on }] }  (founders)
//   POST /api/send { action: "entitle", user_id, status, expires_at, note }                       (founders)

const PAGE = 50;

export default async function handler(req, res) {
  const access = await sendAccess(req);
  if (!access.user) return res.status(401).json({ error: "Sign in required" });
  if (!access.ok) return res.status(403).json({ error: "SEND Intelligence is not switched on for this account" });
  const sb = sbAdmin(); if (!sb) return res.status(500).json({ error: "Supabase not configured" });
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "POST") {
    if (!access.founder) return res.status(403).json({ error: "Founders only" });
    const b = req.body || {};
    if (b.action === "ground_truth_add") {
      const items = (Array.isArray(b.items) ? b.items : []).slice(0, 500).map((x) => ({ supplied_by: String(b.supplied_by || "Social Personnel").slice(0, 120), title: String(x.title || "").slice(0, 300) || null, school_name: String(x.school_name || "").slice(0, 300) || null, url: String(x.url || "").slice(0, 1000) || null, seen_on: x.seen_on || null }));
      if (!items.length) return res.status(400).json({ error: "No items" });
      const { error } = await sb.from("send_ground_truth").insert(items);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, added: items.length });
    }
    if (b.action === "entitle") {
      const row = { user_id: String(b.user_id || ""), sector_code: "SEND", plan_code: b.plan_code || "pilot", status: ["active", "pilot", "paused", "ended"].includes(b.status) ? b.status : "pilot", expires_at: b.expires_at || null, granted_by: access.user.email, note: String(b.note || "").slice(0, 300) || null };
      if (!row.user_id) return res.status(400).json({ error: "user_id required" });
      const { error } = await sb.from("supplier_sector_entitlements").upsert(row, { onConflict: "user_id,sector_code" });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown action" });
  }

  const view = String(req.query.view || "summary");
  if (view === "summary") {
    const count = async (q) => { const { count: c } = await q; return c || 0; };
    const base = () => sb.from("send_organisations").select("id", { count: "exact", head: true }).eq("nation", "england").eq("in_scope", true);
    const [special, ap, units, trusts, las, proprietors, opening, sources, discovered] = await Promise.all([
      count(base().eq("org_kind", "school").eq("setting_group", "special")),
      count(base().eq("org_kind", "school").eq("setting_group", "ap")),
      count(base().eq("org_kind", "school").eq("setting_group", "mainstream_unit")),
      count(base().eq("org_kind", "trust")),
      count(base().eq("org_kind", "local_authority")),
      count(base().eq("org_kind", "proprietor")),
      count(base().eq("org_kind", "school").eq("status", "Proposed to open")),
      count(sb.from("send_sources").select("id", { count: "exact", head: true })),
      count(sb.from("send_sources").select("id", { count: "exact", head: true }).neq("status", "to_discover")),
    ]);
    const { data: soon } = await sb.from("send_organisations").select("name,establishment_type,la_name,open_date,website").eq("status", "Proposed to open").eq("in_scope", true).order("open_date", { ascending: true }).limit(20);
    const state = (await kvGet("shared", "send_schools_state")) || {};
    const budget = access.founder ? await budgetLeft(sb) : undefined;
    return res.status(200).json({
      england: { special, ap, mainstream_units: units, schools: special + ap + units, trusts, local_authorities: las, independent_proprietors: proprietors, proposed_to_open: opening },
      opening_soon: soon || [],
      sources: { registered: sources, discovered, coverage_note: "Vacancy monitoring starts in week 2. Until then, no vacancy counts are shown." },
      last_sync: { at: state.lastSuccess || null, file: state.lastLog && state.lastLog.file },
      budget,
    });
  }
  if (view === "organisations") {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    let q = sb.from("send_organisations").select("id,name,setting_group,establishment_type,status,phase,age_low,age_high,town,postcode,la_name,region,website,phone,trust_name,proprietor_name,sen_provision,resourced_provision_type,pupils,sen_ehcp,sen_support,open_date,last_inspection,source_ref,last_verified_at", { count: "exact" })
      .eq("in_scope", true).eq("org_kind", "school");
    if (req.query.setting) q = q.eq("setting_group", String(req.query.setting));
    if (req.query.la) q = q.eq("la_code", String(req.query.la));
    if (req.query.region) q = q.eq("region", String(req.query.region));
    if (req.query.q) q = q.ilike("name", "%" + String(req.query.q).replace(/[%_]/g, "").slice(0, 60) + "%");
    const { data, count, error } = await q.order("name").range((page - 1) * PAGE, page * PAGE - 1);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ total: count || 0, page, pageSize: PAGE, items: data || [] });
  }
  if (view === "vacancies") {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    let q = sb.from("send_vacancies").select("id,original_title,taxonomy_code,profession_family,salary_text,salary_min,salary_max,contract_type,working_pattern,closing_at,source_url,first_seen_at,last_verified_at,confidence,status,organisation_id,send_organisations(name,setting_group,la_name,region,postcode)", { count: "exact" })
      .eq("status", String(req.query.status || "LIVE"));
    if (req.query.family) q = q.eq("profession_family", String(req.query.family));
    if (req.query.code) q = q.eq("taxonomy_code", String(req.query.code));
    const { data, count, error } = await q.order("first_seen_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ total: count || 0, page, pageSize: PAGE, items: data || [], note: "Vacancies come from school careers pages Qura is allowed to check. Coverage is partial; see view=coverage." });
  }
  if (view === "coverage") {
    const { data, error } = await sb.from("send_area_metrics").select("*").eq("nation", "england").eq("area_kind", "local_authority").order("area_name");
    if (error) return res.status(500).json({ error: error.message });
    const st = (await kvGet("shared", "send_discover_state")) || {};
    const vs = (await kvGet("shared", "send_vacancy_state")) || {};
    return res.status(200).json({ areas: data || [], discovery: st.totals || {}, vacancy_checks: access.founder ? vs.totals || {} : undefined });
  }
  return res.status(400).json({ error: "Unknown view" });
}
