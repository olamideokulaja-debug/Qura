import { getUser, kvGet } from "./_auth.js";
import { adminClient } from "./_waitlist.js";
import { limited } from "./_ratelimit.js";
import { isFounderEmail, roleOf } from "./_orgcheck.js";
import { bump } from "./_metrics.js";
import { reprocurementEstimate } from "./_tenderarchive.js";

// Tender Intelligence Archive: search and records (1 October 2026).
//
// GET  /api/tender-archive?q=&status=LIVE|AWARDED|CLOSED&buyer=&supplier=&from=&to=&min=&max=&page=
// GET  /api/tender-archive?id=ft_...           one record: the tender, Award
//                                              Information, the original Tender
//                                              Snapshot if one was made, the
//                                              buyer's history, and a likely
//                                              reprocurement window (estimate)
// POST /api/tender-archive { action: "source", id }   counts a click to the official source
// POST /api/tender-archive { action: "status", id, status, note }  founders: correct the status (status null clears it)
// POST /api/tender-archive { action: "award", awardId, confirmed } founders: confirm or reject an award match
//
// Signed-in organisations only; clinicians do not see procurement records.
// The data is filled by api/archive-refresh.js; the rules are in
// api/_tenderarchive.js.

const STATUSES = ["LIVE", "AWARDED", "CLOSED"];
const PAGE = 25;
const COLS = "id,title,buyer,buyer_key,status,status_override,closing_date,published_at,advertised_value,advertised_value_max,currency,source,source_url,category,region,contract_start,contract_end,duration_days,extension_options,lots,procurement_route,cpv,first_seen,updated_at,status_note";
const AWARD_COLS = "id,tender_id,lot_id,supplier_name,award_date,awarded_value,currency,contract_start,contract_end,award_source_url,match,confirmed";

const safe = (v, n = 80) => String(v || "").replace(/[^\p{L}\p{N} &'\-./]/gu, " ").replace(/\s+/g, " ").trim().slice(0, n);
const effective = (t) => t.status_override || t.status;

function card(t, awards) {
  const mine = (awards || []).filter((a) => a.tender_id === t.id && a.confirmed !== false);
  return {
    id: t.id, title: t.title, buyer: t.buyer, status: effective(t), closingDate: t.closing_date, publishedAt: t.published_at,
    advertisedValue: t.advertised_value, advertisedValueMax: t.advertised_value_max, currency: t.currency || "GBP",
    source: t.source, sourceUrl: t.source_url, category: t.category, region: t.region,
    awards: mine.slice(0, 5).map((a) => ({ supplier: a.supplier_name, value: a.awarded_value, currency: a.currency, date: a.award_date, lot: a.lot_id })),
    awardCount: mine.length,
  };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const founder = isFounderEmail(user.email);
  if (!founder && (await roleOf(user.id)) === "clinician") return res.status(403).json({ error: "The tender archive is for organisations." });
  const sb = adminClient();
  if (!sb) return res.status(500).json({ error: "The archive is not configured." });

  if (req.method === "POST") {
    const b = req.body || {};
    if (b.action === "source") { await bump("archive_source_clicked"); return res.status(200).json({ ok: true }); }
    if (!founder) return res.status(403).json({ error: "Founders only." });
    if (b.action === "status") {
      const st = b.status == null || b.status === "" ? null : String(b.status).toUpperCase();
      if (st && !STATUSES.includes(st)) return res.status(400).json({ error: "Status must be LIVE, AWARDED or CLOSED." });
      const { error } = await sb.from("tenders").update({ status_override: st, status_note: st ? String(b.note || "Corrected by " + user.email).slice(0, 300) : null, updated_at: new Date().toISOString() }).eq("id", String(b.id || ""));
      return error ? res.status(500).json({ error: error.message }) : res.status(200).json({ ok: true });
    }
    if (b.action === "award") {
      const { error } = await sb.from("tender_awards").update({ confirmed: b.confirmed !== false }).eq("id", String(b.awardId || ""));
      return error ? res.status(500).json({ error: error.message }) : res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown action." });
  }
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (await limited(req, res, user, { bucket: "tender-archive", limit: 180, windowSec: 3600 })) return;
  const q = req.query || {};

  // ---------------------------------------------------------------- one record
  if (q.id) {
    const id = String(q.id);
    const { data: t } = await sb.from("tenders").select(COLS).eq("id", id).maybeSingle();
    if (!t) return res.status(404).json({ error: "Not in the archive." });
    const { data: awards } = await sb.from("tender_awards").select(AWARD_COLS).eq("tender_id", id).order("award_date", { ascending: false });
    const shown = (awards || []).filter((a) => founder || a.confirmed !== false);
    const stored = await kvGet("tender_snapshot", id);
    // The original Snapshot, as first made. Later versions are kept in its
    // history; the record shows the earliest one so it never silently changes.
    let snapshot = null;
    if (stored && stored.snapshot) {
      const hist = Array.isArray(stored.history) ? stored.history : [];
      const first = hist.length ? hist[hist.length - 1] : stored;
      snapshot = { snapshot: first.snapshot, generatedAt: first.generatedAt, versions: hist.length + 1 };
    }
    // The buyer's other tenders, newest first.
    let history = [], previous = null;
    if (t.buyer_key) {
      const { data: others } = await sb.from("tenders").select(COLS).eq("buyer_key", t.buyer_key).neq("id", id).order("closing_date", { ascending: false, nullsFirst: false }).limit(30);
      const oIds = (others || []).map((o) => o.id);
      const { data: oAwards } = oIds.length ? await sb.from("tender_awards").select(AWARD_COLS).in("tender_id", oIds) : { data: [] };
      history = (others || []).map((o) => card(o, oAwards));
      // Previous contract: the buyer's most recent awarded tender before this
      // one, preferring the same kind of service (first 3 digits of the CPV).
      const before = history.filter((h) => h.status === "AWARDED" && h.awardCount && (!t.published_at || !h.publishedAt || h.publishedAt < t.published_at));
      const cpv3 = String(t.cpv || "").slice(0, 3);
      const sameKind = cpv3 ? before.filter((h) => String((others.find((o) => o.id === h.id) || {}).cpv || "").startsWith(cpv3)) : [];
      const p = sameKind[0] || before[0];
      if (p) previous = { id: p.id, title: p.title, suppliers: [...new Set(p.awards.map((a) => a.supplier).filter(Boolean))], lastAwardValue: p.awards.map((a) => a.value).filter((v) => v != null)[0] ?? null, awardDate: p.awards.map((a) => a.date).filter(Boolean)[0] || null, advertisedValue: p.advertisedValue, sameService: Boolean(sameKind[0]) };
    }
    await bump("archive_viewed");
    return res.status(200).json({
      tender: { ...card(t, []), statusOverride: t.status_override, statusNote: t.status_note, contractStart: t.contract_start, contractEnd: t.contract_end, durationDays: t.duration_days, extensionOptions: t.extension_options, lots: t.lots || [], procurementRoute: t.procurement_route, firstSeen: t.first_seen },
      awards: shown.map((a) => ({ id: a.id, supplier: a.supplier_name, value: a.awarded_value, currency: a.currency, date: a.award_date, lot: a.lot_id, contractStart: a.contract_start, contractEnd: a.contract_end, sourceUrl: a.award_source_url, match: a.match, confirmed: a.confirmed })),
      snapshot, history, previous, reprocurement: reprocurementEstimate(t, awards || []), canEdit: founder,
    });
  }

  // ---------------------------------------------------------------- search
  let query = sb.from("tenders").select(COLS, { count: "exact" });
  const text = safe(q.q);
  if (text) query = query.or("title.ilike.%" + text + "%,buyer.ilike.%" + text + "%,category.ilike.%" + text + "%");
  const buyer = safe(q.buyer);
  if (buyer) query = query.ilike("buyer", "%" + buyer + "%");
  const st = String(q.status || "").toUpperCase();
  if (STATUSES.includes(st)) query = query.or("status_override.eq." + st + ",and(status_override.is.null,status.eq." + st + ")");
  const supplier = safe(q.supplier);
  if (supplier) {
    const { data: hits } = await sb.from("tender_awards").select("tender_id").ilike("supplier_name", "%" + supplier + "%").eq("confirmed", true).limit(500);
    const ids = [...new Set((hits || []).map((h) => h.tender_id))];
    if (!ids.length) return res.status(200).json({ items: [], total: 0, page: 1, pages: 0 });
    query = query.in("id", ids);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(q.from || ""))) query = query.gte("closing_date", q.from);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(q.to || ""))) query = query.lte("closing_date", q.to + "T23:59:59Z");
  if (isFinite(Number(q.min)) && q.min !== "" && q.min != null) query = query.gte("advertised_value", Number(q.min));
  if (isFinite(Number(q.max)) && q.max !== "" && q.max != null) query = query.lte("advertised_value", Number(q.max));
  const page = Math.max(1, Math.min(200, Number(q.page) || 1));
  query = query.order("published_at", { ascending: false, nullsFirst: false }).range((page - 1) * PAGE, page * PAGE - 1);
  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: "Search failed: " + error.message });
  const ids = (data || []).map((t) => t.id);
  const { data: awards } = ids.length ? await sb.from("tender_awards").select(AWARD_COLS).in("tender_id", ids) : { data: [] };
  await bump("archive_searched");
  const { data: totals } = await sb.rpc("tender_status_counts").then((r) => r, () => ({ data: null }));
  return res.status(200).json({
    items: (data || []).map((t) => card(t, awards)), total: count || 0, page, pages: Math.ceil((count || 0) / PAGE),
    counts: Array.isArray(totals) ? Object.fromEntries(totals.map((r) => [r.status, Number(r.n)])) : null,
  });
}
