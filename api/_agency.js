// Agency talent pools (1 October 2026).
//
// An agency adds the clinicians it represents. Each clinician is emailed and
// must confirm before anything is listed. While the representation runs:
//   - the clinician appears on Talent to hospitals and providers, marked
//     "Represented by a partner agency" (named if the agency chooses)
//   - no other agency can see them
//   - an introduction request goes to the agency, which introduces the
//     clinician on its own terms and keeps its own fee; Qura charges the
//     agency its introduction fee (recorded for invoicing)
//   - the agency is told when a posted role matches one of its clinicians
//
// Rules agreed for the first version:
//   - representation lasts 6 months from the clinician's confirmation, and the
//     clinician can renew it by confirming again
//   - the clinician can leave at any time for future introductions;
//     introductions already made stay with the agency
//   - the first representation a clinician confirms wins; a second agency's
//     invite cannot be confirmed while one is running
//   - a clinician who joined Qura directly stays direct unless they confirm
//
// Storage:
//   kv(owner = agency id, key = "agency_pool")
//     { showName, entries: [{ id, email, name, profession, country, status,
//       invitedAt, confirmedAt, until, endedAt, endedBy, introductions }] }
//     status: invited | confirmed | declined | ended | unavailable
//   kv(owner = "repmail:" + hash of the clinician's email, key = "rep")
//     { agencyId, entryId, agencyName, showName, confirmedAt, until, status }
// The second record is the one the rest of Qura reads. It is keyed by email
// so it works whether the clinician already has a Qura account or creates
// one afterwards. Neither key has a qura_ prefix, so the browser cannot write
// them.

import crypto from "node:crypto";
import { kvGet, kvSet, kvListByKey } from "./_auth.js";
import { sign, verify, sendMail, owners, SUPPORT } from "./_waitlist.js";

export const POOL_KEY = "agency_pool";
export const REP_KEY = "rep";
export const REP_MONTHS = 6;
export const INTRO_FEE = Number(process.env.INTRO_FEE_GBP || 99);
const SITE = "https://www.qurahealth.org";
const POOL_MAX = 2000;

export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const isEmail = (e) => /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i.test(normEmail(e));
export const repOwner = (email) => "repmail:" + crypto.createHash("sha256").update(normEmail(email)).digest("hex").slice(0, 32);

export function addMonths(ms, n) { const d = new Date(ms); d.setUTCMonth(d.getUTCMonth() + n); return d.getTime(); }
export const isActive = (rep, t = Date.now()) => Boolean(rep && rep.status === "active" && rep.until && t < Date.parse(rep.until));

export const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const ukDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }); } catch (e) { return String(iso || "").slice(0, 10); } };

export async function agencyAccount(agencyId) {
  const acc = (await kvGet(agencyId, "account")) || {};
  const org = acc.org && typeof acc.org === "object" ? acc.org.name : acc.org;
  return { name: String(org || "").trim() || "A Qura partner agency", email: normEmail(acc.email) };
}

export async function getPool(agencyId) {
  const p = await kvGet(agencyId, POOL_KEY);
  const pool = p && typeof p === "object" && !Array.isArray(p) ? p : {};
  return { showName: pool.showName !== false, entries: Array.isArray(pool.entries) ? pool.entries : [] };
}
export const savePool = (agencyId, pool) => kvSet(agencyId, POOL_KEY, { showName: pool.showName !== false, entries: pool.entries.slice(0, POOL_MAX) });

export async function repFor(email) {
  if (!isEmail(email)) return null;
  const r = await kvGet(repOwner(email), REP_KEY);
  return r && typeof r === "object" ? r : null;
}

// Every running representation, keyed by the owner used in kv.
export async function allReps() {
  const rows = await kvListByKey(REP_KEY);
  const out = {};
  for (const { owner, value } of rows) if (isActive(value)) out[owner] = value;
  return out;
}

// ------------------------------------------------------------ consent links
const tokenFor = (agencyId, entryId, d) => sign("rep:" + agencyId + ":" + entryId, d);
export const checkConsent = (agencyId, entryId, d, t) => verify("rep:" + agencyId + ":" + entryId, d, String(t || ""));
export const consentLink = (agencyId, entryId, d) =>
  SITE + "/api/agency-consent?a=" + encodeURIComponent(agencyId) + "&e=" + encodeURIComponent(entryId) + "&d=" + d + "&t=" + tokenFor(agencyId, entryId, d);

function btn(href, label, primary) {
  return '<a href="' + href + '" style="display:inline-block;margin:6px 6px 0 0;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700;' +
    (primary ? "background:#00C2B8;color:#04231F" : "background:#EEF1F7;color:#0A1730") + '">' + label + "</a>";
}

export function inviteHtml(agencyName, entry, agencyId) {
  const hi = entry.name ? "Hello " + esc(String(entry.name).split(" ")[0]) + "," : "Hello,";
  return '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6;max-width:600px">' +
    "<p>" + hi + "</p>" +
    "<p><b>" + esc(agencyName) + "</b> would like to represent you on Qura, the healthcare workforce marketplace.</p>" +
    "<p>If you confirm:</p><ul>" +
    "<li>hospitals and healthcare providers can find your profile on Qura, without your name or contact details</li>" +
    "<li>when one wants to meet you, the request goes to " + esc(agencyName) + ", who will speak to you first</li>" +
    "<li>the arrangement runs for " + REP_MONTHS + " months, and you can end it at any time in the Qura app</li>" +
    "<li>your Qura profile is free, always</li></ul>" +
    "<p>Only confirm if you know " + esc(agencyName) + " and want them to represent you.</p>" +
    "<p>" + btn(consentLink(agencyId, entry.id, "confirm"), "Yes, represent me", true) + btn(consentLink(agencyId, entry.id, "decline"), "No thanks", false) + "</p>" +
    '<p style="font-size:12px;color:#8A96AD">You received this because ' + esc(agencyName) + " added your email address on Qura. If you do nothing, nothing is listed. Questions: " + SUPPORT + ". Qura Ltd, company number 17310951.</p></div>";
}

export async function sendInvite(agencyId, agencyName, entry) {
  return sendMail([entry.email], agencyName + " would like to represent you on Qura", inviteHtml(agencyName, entry, agencyId), SUPPORT);
}

// ------------------------------------------------------------ introductions
// When a hospital asks to meet a represented clinician, the request goes to
// the agency. Returns null when the clinician is not represented, so the
// caller carries on as before.
export async function routeIntroduction(user, clinicianId, meta = {}) {
  const owner = String(clinicianId || "").replace(/^cl_/, "");
  if (!owner || owner === clinicianId) return null;
  const profile = await kvGet(owner, "clinician_profile");
  const rep = profile && profile.email ? await repFor(profile.email) : null;
  if (!isActive(rep)) return null;
  if (rep.agencyId === user.id) return { own: true, agencyName: rep.agencyName };

  const ag = await agencyAccount(rep.agencyId);
  const reqAcc = (await kvGet(user.id, "account")) || {};
  const reqOrg = (reqAcc.org && typeof reqAcc.org === "object" ? reqAcc.org.name : reqAcc.org) || "";
  const now = new Date().toISOString();
  const entry = {
    id: "intro_" + Date.now(), clinicianId, handle: meta.handle || "", profession: meta.profession || "",
    country: meta.country || "", status: "Sent to the clinician's agency", supplier: user.id, supplierEmail: user.email,
    fee: 0, routedTo: rep.agencyId, agencyName: ag.name, agencyFee: INTRO_FEE, agencyFeeStatus: "to invoice", at: now,
  };
  const queue = (await kvGet("shared", "intro_queue")) || [];
  await kvSet("shared", "intro_queue", [entry, ...(Array.isArray(queue) ? queue : [])]);
  const mine = (await kvGet(user.id, "supplier_introductions")) || [];
  const arr = Array.isArray(mine) ? mine : [];
  if (!arr.some((i) => i.clinicianId === clinicianId)) {
    await kvSet(user.id, "supplier_introductions", [{ id: entry.id, clinicianId, handle: entry.handle, status: entry.status, at: now }, ...arr]);
  }
  // Count it on the agency's pool entry, so they can see the interest.
  try {
    const pool = await getPool(rep.agencyId);
    const e = pool.entries.find((x) => x.id === rep.entryId);
    if (e) { e.introductions = (e.introductions || 0) + 1; e.lastIntroAt = now; await savePool(rep.agencyId, pool); }
  } catch (e) {}

  const poolEntry = (await getPool(rep.agencyId)).entries.find((x) => x.id === rep.entryId) || {};
  const who = poolEntry.name || profile.profession || "one of your clinicians";
  const html = '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6;max-width:600px">' +
    "<p>Hello,</p><p>An organisation on Qura would like an introduction to <b>" + esc(who) + "</b>" +
    (profile.profession ? " (" + esc(profile.profession) + ")" : "") + ", whom you represent.</p>" +
    '<div style="border:1px solid #E3E8F2;border-radius:12px;padding:14px 16px;margin:12px 0">' +
    "<div><b>" + esc(reqOrg || "Organisation") + "</b></div><div>Contact: " + esc(user.email) + "</div></div>" +
    "<p>Please contact them directly and introduce your clinician on your usual terms. Qura's introduction fee of £" + INTRO_FEE +
    " applies to your account and we will invoice you.</p>" +
    '<p style="font-size:12px;color:#8A96AD">Qura Ltd, company number 17310951. Questions: ' + SUPPORT + ".</p></div>";
  const to = ag.email ? [ag.email] : [];
  if (to.length) await sendMail(to, "Introduction request for " + who, html, user.email);
  const founders = owners();
  if (founders.length) {
    await sendMail(founders, "Introduction routed to an agency (£" + INTRO_FEE + " to invoice)",
      "<p>" + esc(reqOrg || user.email) + " asked to meet " + esc(who) + ", represented by " + esc(ag.name) + " (" + esc(ag.email || "no email on file") +
      "). The request went to the agency. Invoice the agency £" + INTRO_FEE + ".</p>", SUPPORT);
  }
  return { routed: true, agencyName: rep.showName === false ? "" : ag.name, emailed: Boolean(to.length) };
}

// ------------------------------------------------------------ role alerts
// Tells each agency, once per role, which of its clinicians match.
export async function alertAgencies(role, hits) {
  const out = { agencies: 0 };
  try {
    const byAgency = {};
    for (const h of hits) {
      const email = h.value && h.value.email;
      const rep = email ? await repFor(email) : null;
      if (!isActive(rep)) continue;
      (byAgency[rep.agencyId] = byAgency[rep.agencyId] || []).push(rep.entryId);
    }
    for (const [agencyId, entryIds] of Object.entries(byAgency)) {
      const ag = await agencyAccount(agencyId);
      if (!ag.email) continue;
      const pool = await getPool(agencyId);
      const names = entryIds.map((id) => (pool.entries.find((e) => e.id === id) || {}).name).filter(Boolean);
      const html = '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6;max-width:600px">' +
        "<p>Hello,</p><p>A role just posted on Qura matches " + entryIds.length + (entryIds.length === 1 ? " clinician" : " clinicians") + " you represent" +
        (names.length ? ": " + esc(names.slice(0, 10).join(", ")) : "") + ".</p>" +
        '<div style="border:1px solid #E3E8F2;border-radius:12px;padding:14px 16px;margin:12px 0"><b>' + esc(role.title) + "</b><div>" +
        esc([role.buyer, role.region, role.country].filter(Boolean).join(" · ")) + "</div></div>" +
        '<p><a href="' + SITE + '">See it on Qura</a></p><p style="font-size:12px;color:#8A96AD">Qura Ltd, company number 17310951.</p></div>';
      const r = await sendMail([ag.email], "New role matches " + entryIds.length + " of your clinicians", html, SUPPORT);
      if (r.ok) out.agencies += 1;
    }
  } catch (e) { console.error("[agency] alert failed: " + (e && e.message)); }
  return out;
}
