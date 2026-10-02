import { seedActive } from "./_seed.js";
import { getUser, kvGet, kvSet } from "./_auth.js";
import { sbAdmin, asDiscover, tsQuery, familyOf, relatedFor, classify, TAXONOMY } from "./_opps.js";
import { protectedResident, PROTECTED_ALERT_MSG } from "./_protected.js";
import { bump } from "./_metrics.js";
import { limited } from "./_ratelimit.js";
import { orgVerified, isFounderEmail } from "./_orgcheck.js";
import { sendMail, owners, SUPPORT } from "./_waitlist.js";
import { isOpen, closesLabel } from "./_roles.js";
import { prefLabel, rolePayLabel, salaryFit, wantsType } from "./_comp.js";

// GET /api/opportunities?country=&profession=&market=
//   The original list: Qura Direct roles only. Older app builds call this.
// GET /api/opportunities?v=2&q=&family=&place=&type=&page=
//   Qura Opportunity Engine (2 October 2026): Qura Direct roles plus Qura
//   Discover adverts (api/_opps.js), ranked for this clinician. A search with
//   no results returns related roles and is counted as demand intelligence.
// GET /api/opportunities?v=2&id=nhsjobs:123   one Discover advert
// POST /api/opportunities { action: "alert_add", q, family, place }   save a search alert (max 10)
// POST /api/opportunities { action: "alert_remove", id }
// POST /api/opportunities { action: "click", id }   counts a click to the original advert
// POST /api/opportunities { action: "claim", id, note }   an organisation says the advert is theirs
// POST /api/opportunities { action: "claim_decide", id, approve }   founders only
//
// Roles a clinician can pursue. These are the real requirements posted by
// suppliers, hospitals and GP practices through /api/demand, reshaped into the
// clinician's language: a demand post says "MRI Radiographers x3", a clinician
// sees a role they can apply to.
//
// The illustrative set below fills the page before launch and switches itself
// off at 09:00 on 22 September, the same moment as everything else seeded. It
// is deliberately NOT extended past that date: illustrative content labelled
// as illustrative is honest, and the same content after launch, when people
// are signing up on the strength of it, is not.
//
// After that date this page shows what has genuinely been posted, which on day
// one may be very little. The client is told which it is looking at via
// `seeded` on each item and `live`/`awaitingPosts` on the response, so it can
// ask a clinician to complete their profile and set an alert rather than
// showing them an empty list with no explanation.
const SEED = [
  { id: "op_1", role: "MRI Radiographer", employer: "Community Diagnostic Centre", country: "United Kingdom", region: "London", market: "NHS", profession: "Radiographer", spec: "MRI", rate: "Band 7", start: "ASAP", fit: 96, closes: "6 days", summary: "Insourcing programme across three imaging sites. Immediate starts available." },
  { id: "op_2", role: "Sonographer (MSK)", employer: "Private provider", country: "United Kingdom", region: "Manchester", market: "Private", profession: "Sonographer", spec: "MSK", rate: "£320/day", start: "1 Sep", fit: 91, closes: "12 days", summary: "12-month contract, MSK and general lists, modern equipment." },
  { id: "op_3", role: "Echocardiographer", employer: "NHS trust", country: "United Kingdom", region: "Leeds", market: "NHS", profession: "Echocardiographer", spec: "Cardiac", rate: "Band 7", start: "Flexible", fit: 88, closes: "21 days", summary: "Backlog-clearance role, stress and TOE experience welcome." },
  { id: "op_4", role: "ICU Nurse", employer: "Private hospital group", country: "United Arab Emirates", region: "Dubai", market: "International", profession: "Nurse", spec: "Critical care", rate: "Tax-free package", start: "Q4", fit: 84, closes: "30 days", summary: "International relocation with full support. 2+ years ICU required." },
  { id: "op_5", role: "Biomedical Scientist", employer: "NHS trust", country: "United Kingdom", region: "Birmingham", market: "NHS", profession: "Biomedical Scientist", spec: "Blood sciences", rate: "Band 6", start: "ASAP", fit: 80, closes: "9 days", summary: "HCPC-registered, blood sciences rotation, pathology network." },
  { id: "op_6", role: "Diagnostic Radiographer", employer: "Mobile imaging partner", country: "United Kingdom", region: "South East", market: "NHS", profession: "Radiographer", spec: "General", rate: "£38/hr", start: "ASAP", fit: 78, closes: "5 days", summary: "Mobile unit sessions across the region, flexible shifts." },
];

// A real fit, computed from the signed-in clinician's profile rather than
// invented. Returns null when there is nothing to compare, because no number is
// better than one that means nothing: a clinician making a career decision on a
// figure we made up is the worst outcome this file can produce.
//
// The seeded examples carry a hardcoded fit and are flagged seeded:true, which
// the app labels as illustrative. Real posts had NO fit at all, so the detail
// screen would have printed "undefined%" the moment the seed switched off.
function fitFor(profile, o) {
  if (!profile || !profile.profession) return null;
  let score = 0, possible = 0;

  possible += 50;
  const prof = String(profile.profession || "").toLowerCase();
  const oprof = String(o.profession || "").toLowerCase();
  const targets = (Array.isArray(profile.targetRoles) ? profile.targetRoles : []).map((r) => String(r).toLowerCase());
  const role = String(o.role || "").toLowerCase();
  if (targets.some((t) => role.includes(t) || t.includes(role))) score += 50;
  else if (oprof && prof && (oprof === prof || oprof.includes(prof) || prof.includes(oprof))) score += 45;
  else if (oprof && prof && oprof.split(" ")[0] === prof.split(" ")[0]) score += 25;

  possible += 25;
  const markets = Array.isArray(profile.markets) && profile.markets.length
    ? profile.markets.map((m) => String(m.country || "").toLowerCase())
    : [String(profile.country || "").toLowerCase()];
  if (markets.filter(Boolean).some((c) => String(o.country || "").toLowerCase().includes(c) || c.includes(String(o.country || "").toLowerCase()))) score += 25;

  possible += 15;
  const yrs = Number(String(profile.experienceYears || "").replace(/[^0-9]/g, ""));
  if (isFinite(yrs) && yrs >= 5) score += 15; else if (isFinite(yrs) && yrs >= 2) score += 8;

  possible += 10;
  if (profile.verifiedAt) score += 10;

  // Type of work and salary (Permanent First, 1 October 2026). Each counts only
  // when both sides have said something, so nobody is marked down for a field
  // they have not filled in or a role that does not give it.
  const prefs = Array.isArray(profile.employmentPreferences) ? profile.employmentPreferences : [];
  if (o.employmentType && prefs.length) {
    possible += 10;
    if (wantsType(profile, o.employmentType)) score += 10;
  }
  if ((o.salaryMin || o.salaryMax) && profile.salaryBand) {
    possible += 10;
    const f = salaryFit(profile, o.salaryMin, o.salaryMax);
    if (f !== "outside") score += 10;
  }

  if (!possible) return null;
  return Math.max(20, Math.min(99, Math.round((score / possible) * 100)));
}

// A posted requirement, seen from the clinician's side.
function asRole(d) {
  return {
    id: d.id,
    role: d.title || d.profession || "Healthcare role",
    employer: d.buyer || "Healthcare organisation",
    country: d.country || (/international/i.test(String(d.market || "")) ? "International" : "United Kingdom"),
    region: d.region || "",
    market: d.market || "NHS",
    profession: d.profession || "",
    rate: d.rate || rolePayLabel(d) || "Rate on application",
    employmentType: d.employmentType || "",
    employmentLabel: prefLabel(d.employmentType),
    salaryMin: d.salaryMin == null ? null : d.salaryMin,
    salaryMax: d.salaryMax == null ? null : d.salaryMax,
    salaryLabel: rolePayLabel(d),
    need: d.need || "",
    start: d.start || "",
    closes: closesLabel(d),
    note: d.note || d.title || "",
    postedAt: d.at || null,
    seeded: false,
  };
}


const PAGE = 25;
const words = (q) => (String(q || "").toLowerCase().match(/[a-z0-9]+/g) || []).slice(0, 8);
const escH = (v) => String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clip = (v, n) => String(v == null ? "" : v).replace(/[<>]/g, "").trim().slice(0, n);

function directMatches(o, q, family, place, type) {
  const w = words(q);
  const hay = String([o.role, o.employer, o.region, o.profession, o.note].join(" ")).toLowerCase().split(/[^a-z0-9]+/);
  if (w.length && !w.every((x) => hay.some((h) => h.startsWith(x)))) return false;
  if (family && familyOf(o.profession || o.role) !== family) return false;
  if (place && !String(o.region || "").toLowerCase().includes(place.toLowerCase())) return false;
  if (type && o.employmentType !== type) return false;
  return true;
}

// Relevance first. A Qura Direct role gets a small lift, never enough to put an
// unrelated Direct role above a closely matching Discover one.
function rank(o, family) {
  let s = typeof o.fit === "number" ? o.fit : 50;
  if (family && familyOf(o.profession || o.role) === family) s += 15;
  const age = o.postedAt ? (Date.now() - Date.parse(o.postedAt)) / 86400000 : 30;
  if (age < 3) s += 8; else if (age < 7) s += 4;
  if (o.kind === "direct") s += 6;
  return s;
}

async function engine(req, res, user) {
  if (await limited(req, res, user, { bucket: "opps-search", limit: 300, windowSec: 3600 })) return;
  const sb = sbAdmin();
  const qy = req.query || {};
  let profile = null;
  try { profile = await kvGet(user.id, "clinician_profile"); } catch (e) {}

  if (qy.id) {
    if (!sb) return res.status(500).json({ error: "Not configured" });
    const { data: r } = await sb.from("opportunities").select("*").eq("id", String(qy.id)).maybeSingle();
    if (!r) return res.status(404).json({ error: "This advert is no longer on Qura." });
    await bump("opp_discover_viewed");
    const o = asDiscover(r);
    return res.status(200).json({ item: { ...o, fit: fitFor(profile, o), status: r.status } });
  }

  const q = clip(qy.q, 80);
  const family = TAXONOMY.some((x) => x.family === qy.family) ? qy.family : "";
  const place = clip(qy.place, 40).replace(/[^\p{L}\p{N} ]/gu, "");
  const type = ["permanent", "fixed_term", "locum_bank", "contract_insourcing"].includes(qy.type) ? qy.type : "";
  const page = Math.max(1, Math.min(40, Number(qy.page) || 1));
  // No search typed: start from the clinician's own profession.
  const myFamily = profile && profile.profession ? familyOf(profile.profession) : "";
  const useFamily = family || (!q ? myFamily : "");

  // Qura Direct
  const posted = (await kvGet("shared", "demand_posted")) || [];
  const direct = page === 1 ? (Array.isArray(posted) ? posted : []).filter(isOpen).map(asRole)
    .map((o) => ({ ...o, kind: "direct", label: "Qura Direct" }))
    .filter((o) => directMatches(o, q, useFamily, place, type)) : [];

  // Qura Discover
  let discover = [], total = 0;
  if (sb) {
    // Past closing dates are taken out of LIVE every hour by api/opps-refresh.js.
    let query = sb.from("opportunities").select("*", { count: "exact" }).eq("status", "LIVE").is("duplicate_of", null);
    if (q && tsQuery(q)) query = query.textSearch("search", tsQuery(q), { config: "english" });
    if (useFamily) query = query.eq("family", useFamily);
    if (place) query = query.or("city.ilike.%" + place + "%,postcode.ilike." + place + "%,region.ilike.%" + place + "%");
    if (type) query = query.eq("employment_type", type);
    const { data, count, error } = await query.order("posted_at", { ascending: false, nullsFirst: false }).range((page - 1) * PAGE, page * PAGE - 1);
    if (error) return res.status(500).json({ error: "Search failed. Please try again." });
    discover = (data || []).map(asDiscover);
    total = count || 0;
  }

  let items = [...direct, ...discover].map((o) => ({
    ...o,
    fit: fitFor(profile, o),
    salaryFit: (o.salaryMin || o.salaryMax) ? salaryFit(profile, o.salaryMin, o.salaryMax) : "open",
  }));
  items = items.map((o) => ({ ...o, _r: rank(o, useFamily) })).sort((a, b) => b._r - a._r).map(({ _r, ...o }) => o);

  // A search that finds nothing never dead-ends: related roles with live
  // counts, and the search itself is kept (without who made it) as a signal of
  // what clinicians want that the market is not showing.
  let related = [];
  if (!items.length && (q || family)) {
    await bump("opp_zero_result");
    try {
      const z = (await kvGet("shared", "opp_zero_queries")) || [];
      await kvSet("shared", "opp_zero_queries", [{ q, family, place, at: new Date().toISOString() }, ...(Array.isArray(z) ? z : [])].slice(0, 500));
    } catch (e) {}
    if (sb) {
      for (const t of relatedFor(q || (TAXONOMY.find((x) => x.family === family) || {}).profession || "")) {
        const { count } = await sb.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "LIVE").is("duplicate_of", null)
          .textSearch("search", tsQuery(t), { config: "english" });
        related.push({ title: t, count: count || 0 });
      }
      related = related.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
    }
  } else if (q) await bump("opp_searched");

  const alerts = (await kvGet(user.id, "opp_alerts")) || [];
  res.setHeader("Cache-Control", "private, max-age=30");
  return res.status(200).json({
    items, page, pageSize: PAGE, total: total + direct.length, directCount: direct.length, discoverTotal: total,
    hasMore: page * PAGE < total, related, family: useFamily, usedProfileFamily: Boolean(!family && !q && myFamily),
    alerts: (Array.isArray(alerts) ? alerts : []).map(({ email, ...a }) => a),
    sources: ["NHS Jobs"].concat(process.env.ADZUNA_APP_ID ? ["Adzuna"] : [], process.env.REED_API_KEY ? ["reed.co.uk"] : []),
  });
}

async function actions(req, res, user) {
  const b = req.body || {};
  const sb = sbAdmin();
  if (b.action === "alert_add") {
    if (await limited(req, res, user, { bucket: "opps-alert", limit: 30, windowSec: 86400 })) return;
    const q = clip(b.q, 80), place = clip(b.place, 40);
    const family = TAXONOMY.some((x) => x.family === b.family) ? b.family : "";
    if (!q && !family) return res.status(400).json({ error: "Type a role or choose a profession for the alert." });
    if (protectedResident(await kvGet(user.id, "clinician_profile"))) return res.status(403).json({ error: PROTECTED_ALERT_MSG, protectedCountry: true });
    const list = (await kvGet(user.id, "opp_alerts")) || [];
    const arr = Array.isArray(list) ? list : [];
    if (arr.some((a) => a.q.toLowerCase() === q.toLowerCase() && a.family === family && (a.place || "") === place)) return res.status(200).json({ ok: true, already: true, alerts: arr.map(({ email, ...a }) => a) });
    if (arr.length >= 10) return res.status(400).json({ error: "You can keep up to 10 alerts. Remove one first." });
    const next = [{ id: "al_" + Date.now(), q, family, place, email: user.email || "", createdAt: new Date().toISOString() }, ...arr];
    await kvSet(user.id, "opp_alerts", next);
    await bump("opp_alert_created");
    return res.status(200).json({ ok: true, alerts: next.map(({ email, ...a }) => a) });
  }
  if (b.action === "alert_remove") {
    const list = (await kvGet(user.id, "opp_alerts")) || [];
    const next = (Array.isArray(list) ? list : []).filter((a) => a.id !== String(b.id || ""));
    await kvSet(user.id, "opp_alerts", next);
    return res.status(200).json({ ok: true, alerts: next.map(({ email, ...a }) => a) });
  }
  if (b.action === "click") { await bump("opp_external_click"); return res.status(200).json({ ok: true }); }
  if (b.action === "claim") {
    if (!sb) return res.status(500).json({ error: "Not configured" });
    const acc = (await kvGet(user.id, "account")) || {};
    const lens = acc.lens || ({ agency: "supplier", supplier: "supplier", hospital: "healthcare_provider", gp: "healthcare_provider", care: "healthcare_provider" })[acc.role] || "";
    const founder = isFounderEmail(user.email);
    if (!founder && lens !== "supplier" && lens !== "healthcare_provider") return res.status(403).json({ error: "Only organisation accounts can claim an advert." });
    if (!founder && !(await orgVerified(user))) return res.status(403).json({ error: "We check every organisation before it can claim an advert, usually within 1 working day." });
    if (await limited(req, res, user, { bucket: "opps-claim", limit: 10, windowSec: 86400 })) return;
    const id = String(b.id || "");
    const { data: r } = await sb.from("opportunities").select("id,title,employer,source_name,source_url,claim_status").eq("id", id).maybeSingle();
    if (!r) return res.status(404).json({ error: "Advert not found." });
    if (r.claim_status === "CLAIMED") return res.status(409).json({ error: "This advert has already been claimed." });
    const org = clip(acc.org, 120) || user.email;
    await sb.from("opportunities").update({ claim_status: "CLAIM_REQUESTED", claimed_by: org, claim_note: clip(b.note, 400) + " [by " + user.email + "]", updated_at: new Date().toISOString() }).eq("id", id);
    await bump("opp_claim_requested");
    try {
      await sendMail(owners().length ? owners() : [SUPPORT], "Advert claim: " + r.title,
        "<p>" + escH(org) + " (" + escH(user.email) + ") says this advert is theirs:</p><p><b>" + escH(r.title) + "</b><br>" + escH(r.employer) + "<br>" + escH(r.source_name) + ": " + escH(r.source_url) + "</p><p>Note: " + escH(clip(b.note, 400)) +
        "</p><p>Check that they really are the employer before approving. Approve or reject with POST /api/opportunities {action: \"claim_decide\", id: \"" + id + "\", approve: true|false}.</p>", SUPPORT);
    } catch (e) {}
    return res.status(200).json({ ok: true, claimStatus: "CLAIM_REQUESTED" });
  }
  if (b.action === "claim_decide") {
    if (!isFounderEmail(user.email)) return res.status(403).json({ error: "Founders only." });
    if (!sb) return res.status(500).json({ error: "Not configured" });
    const ok = b.approve === true;
    await sb.from("opportunities").update({ claim_status: ok ? "CLAIMED" : "REJECTED", updated_at: new Date().toISOString() }).eq("id", String(b.id || ""));
    return res.status(200).json({ ok: true, claimStatus: ok ? "CLAIMED" : "REJECTED" });
  }
  return res.status(400).json({ error: "Unknown action." });
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (req.method === "POST") return actions(req, res, user);
  if (req.query && String(req.query.v) === "2") return engine(req, res, user);
  const { country, profession, market } = req.query || {};

  // Real posts first, newest first. These are requirements someone has
  // actually put up, so they lead whatever else is on the page.
  const posted = (await kvGet("shared", "demand_posted")) || [];
  const real = (Array.isArray(posted) ? posted : [])
    .filter(isOpen)
    .map(asRole)
    .sort((a, b) => String(b.postedAt || "").localeCompare(String(a.postedAt || "")));

  const filler = seedActive() ? SEED.map((o) => ({ ...o, seeded: true })) : [];
  let items = [...real, ...filler];

  // Score the real posts against this clinician. Seeded examples keep their
  // illustrative figure and are labelled as such in the app.
  let profile = null;
  try { profile = await kvGet(user.id, "clinician_profile"); } catch (e) {}
  items = items.map((o) => (o.seeded ? o : {
    ...o,
    fit: fitFor(profile, o),
    // How the role's salary sits against what the clinician asked for:
    // "overlap", "outside" or "open" (either side has not said).
    salaryFit: (o.salaryMin || o.salaryMax) ? salaryFit(profile, o.salaryMin, o.salaryMax) : "open",
  }));

  if (country && country !== "All") items = items.filter((o) => o.country === country);
  if (profession && profession !== "All") items = items.filter((o) => o.profession === profession);
  if (market && market !== "All") items = items.filter((o) => o.market === market);

  res.setHeader("Cache-Control", "private, max-age=30");
  return res.status(200).json({
    items,
    total: items.length,
    live: real.length,
    // True when there is genuinely nothing posted yet, so the client can show
    // a page that recruits rather than a page that apologises.
    awaitingPosts: real.length === 0 && !seedActive(),
  });
}
