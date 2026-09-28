// Posted roles: shared helpers for api/demand.js (organisations post and
// manage roles) and api/opportunities.js (clinicians see them), plus the alert
// that tells matching clinicians a role has been posted.
//
// A role is stored in kv(shared, demand_posted) as
//   { id, title, buyer, country, region, market, profession, rate, need, start,
//     closes, closesAt, note, postedBy, at, closed, closedAt, notified }
// closesAt is the real closing date; "closes" is kept for older records and
// for anything that still reads the text.

import { kvListByKey } from "./_auth.js";
import { shouldPush } from "./push-register.js";
import { sendMail, owners, SUPPORT } from "./_waitlist.js";

export const COUNTRIES = ["United Kingdom", "Ireland", "Australia", "New Zealand", "Canada", "United States",
  "UAE", "Saudi Arabia", "Qatar", "Nigeria", "Ghana", "Kenya", "South Africa", "Brazil", "European Union", "Other"];

// Days left until a role closes, or null when it has no date.
export function daysLeft(r) {
  if (!r || !r.closesAt) return null;
  const t = Date.parse(r.closesAt);
  if (!isFinite(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

// Open = not closed by the poster and not past its closing date.
export function isOpen(r) {
  if (!r || r.closed) return false;
  const d = daysLeft(r);
  return d === null || d >= 0;
}

export function closesLabel(r) {
  const d = daysLeft(r);
  if (d === null) return r.closes || "";
  if (d <= 0) return "today";
  return d + (d === 1 ? " day" : " days");
}

const SITE = "https://www.qurahealth.org";
const low = (v) => String(v || "").trim().toLowerCase();
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Does this clinician's profile match the role? Profession or a target role,
// and, when the role names a country, one of the clinician's markets.
// The web and phone registration forms name some professions differently
// ("Registered General Nurse (RGN, Adult)" against "Adult Nurse (RGN)"), so
// professions are also compared by family.
const FAMILIES = ["midwife", "nurse", "sonographer", "therapeutic radiographer", "radiographer", "echocardiograph",
  "physiotherap", "occupational therap", "speech", "podiatr", "dietitian", "paramedic", "operating department",
  "orthoptist", "prosthetist", "psycholog", "pharmacy technician", "pharmacist", "biomedical scientist",
  "clinical scientist", "genomic", "audiolog", "perfusion", "nuclear medicine", "clinical research", "radiolog",
  "anaesthe", "general practi", "psychiatr", "cardiolog", "oncolog"];
const familyOf = (p) => FAMILIES.find((f) => low(p).includes(f)) || "";
// Nurses and doctors cover very different jobs, so a family match only counts
// when the role itself is posted generically ("Nurse", "Registered Nurse").
const BROAD = new Set(["nurse"]);

function professionMatches(prof, rp) {
  if (!prof || !rp) return false;
  if (rp === prof || rp.includes(prof) || prof.includes(rp)) return true;
  const f = familyOf(rp);
  if (!f || f !== familyOf(prof)) return false;
  if (!BROAD.has(f)) return true;
  if (/^(registered\s+)?nurse$/.test(rp.trim())) return true;
  const t1 = nurseType(rp), t2 = nurseType(prof);
  return Boolean(t1 && t1 === t2);
}

// The kind of nurse, from either form's wording.
const NURSE_TYPES = [["adult", /rgn|adult|general/], ["mental", /rmn|mental/], ["ld", /rnld|learning/],
  ["child", /rscn|child|paediatric/], ["icu", /icu|critical/], ["theatre", /theatre|scrub/],
  ["community", /district|community/], ["neonatal", /neonatal/], ["ae", /a&e|emergency/], ["oncology", /oncology/]];
function nurseType(p) { const hit = NURSE_TYPES.find(([, re]) => re.test(p)); return hit ? hit[0] : ""; }

export function matches(profile, role) {
  if (!profile) return false;
  const prof = low(profile.profession);
  const rp = low(role.profession);
  const title = low(role.title);
  const targets = (Array.isArray(profile.targetRoles) ? profile.targetRoles : []).map(low).filter(Boolean);
  const profOk = professionMatches(prof, rp) ||
    targets.some((t) => (rp && (rp.includes(t) || t.includes(rp))) || (title && title.includes(t)));
  if (!profOk) return false;
  const rc = low(role.country);
  if (!rc || rc === "other" || /international/.test(low(role.market))) return true;
  const markets = [low(profile.country), ...(Array.isArray(profile.markets) ? profile.markets.map((m) => low(m && m.country)) : [])].filter(Boolean);
  if (!markets.length) return true;
  return markets.some((c) => c === rc || c.includes(rc) || rc.includes(c) ||
    (rc === "united kingdom" && /^(uk|england|scotland|wales|northern ireland)$/.test(c)));
}

async function sendExpo(messages) {
  if (!messages.length) return 0;
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    return messages.length;
  } catch (e) { return 0; }
}

// Tell matching clinicians. Push to anyone with the app and matches switched
// on; email the rest (capped per role, one email per role per person). Never
// throws: a failed alert must not fail the post.
export async function alertMatches(role) {
  const out = { matched: 0, pushed: 0, emailed: 0 };
  try {
    const profiles = await kvListByKey("clinician_profile");
    const hits = profiles.filter((p) => p.value && p.value.registeredAt && matches(p.value, role));
    out.matched = hits.length;
    const regs = await kvListByKey("push_registration");
    const regOf = {};
    for (const r of regs) regOf[r.owner] = r.value;
    const where = [role.region, role.country].filter(Boolean).join(", ");
    const pushes = [];
    const emailTo = [];
    for (const h of hits) {
      const reg = regOf[h.owner];
      if (reg && reg.token && shouldPush(reg, "matches")) {
        pushes.push({ to: reg.token, sound: "default", channelId: "default",
          title: "New role: " + (role.title || role.profession),
          body: (role.buyer || "A healthcare organisation") + (where ? " · " + where : "") + (role.rate ? " · " + role.rate : ""),
          data: { type: "role", id: role.id } });
      } else if (h.value.email) {
        emailTo.push(h.value.email);
      }
    }
    for (let i = 0; i < pushes.length; i += 90) out.pushed += await sendExpo(pushes.slice(i, i + 90));
    const html = (first) => '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6;max-width:600px">' +
      "<p>Hello,</p><p>A role matching your Qura profile has just been posted:</p>" +
      '<div style="border:1px solid #E3E8F2;border-radius:12px;padding:14px 16px;margin:12px 0">' +
      '<div style="font-weight:700;font-size:16px">' + esc(role.title) + "</div>" +
      '<div style="font-size:13.5px;color:#5A6783;margin-top:4px">' + esc([role.buyer, where, role.market].filter(Boolean).join(" · ")) + "</div>" +
      (role.rate || role.start ? '<div style="font-size:13.5px;margin-top:6px">' + esc([role.rate, role.start ? "Start " + role.start : ""].filter(Boolean).join(" · ")) + "</div>" : "") +
      (role.note ? '<div style="font-size:13.5px;margin-top:8px">' + esc(String(role.note).slice(0, 400)) + "</div>" : "") +
      "</div>" +
      '<p style="margin:20px 0"><a href="' + SITE + '" style="background:#00C2B8;color:#04231F;font-weight:700;padding:12px 24px;border-radius:999px;text-decoration:none;display:inline-block">See the role on Qura</a></p>' +
      '<p style="font-size:12px;color:#8A96AD">You receive this because your Qura profile matches the role. Reply "stop" and we will not email you about roles again. Qura Ltd, company number 17310951.</p></div>';
    const list = [...new Set(emailTo)].slice(0, 80);
    for (let i = 0; i < list.length; i += 10) {
      const rs = await Promise.all(list.slice(i, i + 10).map((to) =>
        sendMail([to], "New role on Qura: " + (role.title || role.profession), html(), owners()[0] || SUPPORT)));
      out.emailed += rs.filter((r) => r.ok).length;
    }
  } catch (e) { console.error("[roles] alert failed: " + (e && e.message)); }
  return out;
}
