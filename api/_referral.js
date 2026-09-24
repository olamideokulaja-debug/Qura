import { kvRead, kvWrite, owners, sendMailEach } from "./_waitlist.js";

// Qura Refer & Reward: the tracking layer behind the clinician referral pilot.
//
// Every clinician gets a 6-character code and a personal link,
//   https://www.qurahealth.org/join?ref=CODE
// A new account that arrives through the link (web) or types the code (phone
// app) is attributed to the person who invited them. The referral then moves:
//
//   pending   attributed, not yet qualifying
//   eligible  the referred person has confirmed their email AND a founder has
//             verified their clinician profile in Admin (the profile cannot be
//             verified until it is complete). This is the moment a voucher is
//             owed, and the founders are emailed.
//   paid      a founder has issued the voucher by hand and marked it paid
//   capped    qualified, but the referrer had already reached the pilot cap
//   rejected  self-referral, duplicate registration number, or a founder's call
//
// Vouchers are issued by hand in this pilot. Nothing here pays anyone.
//
// Storage, all in the kv table:
//   <user>/referral           { code, usedCode, referredBy, referredAt, status, ... }
//                             one row per person: their own code, plus who
//                             referred them if anyone did
//   shared/referral_settings  { live, rewardGBP, cap }  set from Admin
//   metrics/referrals         daily counts: clicks, shares, signups, eligible, paid
//
// The browser can never write any of these: kv RLS only lets a user write keys
// that start with qura_ or cura_.

export const SITE = "https://www.qurahealth.org";
export const DEFAULTS = { live: false, rewardGBP: 10, cap: 10 };
export const CLAIM_WINDOW_DAYS = 14;
const CODE_RE = /^[A-Z0-9]{6}$/;

export const linkFor = (code) => SITE + "/join?ref=" + code;
export const cleanCode = (c) => String(c || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

export async function getSettings(admin) {
  const s = (await kvRead(admin, "shared", "referral_settings")) || {};
  return {
    live: !!s.live,
    rewardGBP: Number(s.rewardGBP) > 0 ? Number(s.rewardGBP) : DEFAULTS.rewardGBP,
    cap: Number(s.cap) > 0 ? Math.floor(Number(s.cap)) : DEFAULTS.cap,
    updatedAt: s.updatedAt || null, updatedBy: s.updatedBy || null,
  };
}

// Daily counts for the success measures. Counts only, no names.
export async function count(admin, event, n = 1) {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const all = (await kvRead(admin, "metrics", "referrals")) || {};
    const d = all[day] || {};
    d[event] = (d[event] || 0) + n;
    all[day] = d;
    const days = Object.keys(all).sort();
    while (days.length > 366) delete all[days.shift()];
    await kvWrite(admin, "metrics", "referrals", all);
  } catch (e) {}
}

// Gmail ignores dots and anything after a +, so these are the same inbox.
export function sameInbox(a, b) {
  const norm = (e) => {
    let [u, d] = String(e || "").toLowerCase().trim().split("@");
    if (!d) return u;
    u = u.split("+")[0];
    if (d === "googlemail.com") d = "gmail.com";
    if (d === "gmail.com") u = u.replace(/\./g, "");
    return u + "@" + d;
  };
  return !!a && !!b && norm(a) === norm(b);
}

function makeCode() {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no confusable characters
  let c = "";
  for (let i = 0; i < 6; i++) c += abc[Math.floor(Math.random() * abc.length)];
  return c;
}

// Every referral row. One per person who has ever opened their referral card
// or been referred: small enough to read whole, which is simpler and safer
// than matching on the stored text.
export async function allRows(admin) {
  const { data } = await admin.from("kv").select("owner,value").eq("key", "referral");
  return (data || []).map((r) => { let v = r.value; try { v = JSON.parse(v); } catch (e) {} return { owner: r.owner, value: v || {} }; });
}

export async function ownerOfCode(admin, code) {
  const rows = await allRows(admin);
  const hit = rows.find((r) => r.value && r.value.code === code);
  return hit ? hit.owner : null;
}

// The person's own code, minted on first use.
export async function ensureCode(admin, uid) {
  const mine = (await kvRead(admin, uid, "referral")) || {};
  if (mine.code) return mine;
  const taken = new Set((await allRows(admin)).map((r) => r.value && r.value.code).filter(Boolean));
  let code = makeCode();
  let guard = 0;
  while (taken.has(code) && guard++ < 50) code = makeCode();
  const next = { ...mine, code, createdAt: new Date().toISOString() };
  await kvWrite(admin, uid, "referral", next);
  return next;
}

// Attribute a new account to the owner of a code. Returns { ok } or
// { ok: false, status, error } with a sentence a person can act on.
export async function claim(admin, referee, rawCode, source) {
  const code = cleanCode(rawCode);
  if (!CODE_RE.test(code)) return { ok: false, status: 400, error: "That does not look like a Qura invite code. It is 6 letters and numbers." };
  const referrerId = await ownerOfCode(admin, code);
  if (!referrerId) return { ok: false, status: 404, error: "That invite code was not recognised. Check it with the colleague who sent it." };
  if (referrerId === referee.id) return { ok: false, status: 400, error: "That is your own invite code. Share it with a colleague instead." };

  const mine = (await kvRead(admin, referee.id, "referral")) || {};
  if (mine.referredBy) {
    if (mine.referredBy === referrerId) return { ok: true, already: true };
    return { ok: false, status: 409, error: "An invite code has already been applied to your account." };
  }

  // Codes are for new accounts. Without this, anyone already on Qura could
  // pair up with a friend and claim a voucher for nothing new.
  const created = Date.parse(referee.created_at || "");
  if (created && Date.now() - created > CLAIM_WINDOW_DAYS * 86400000) {
    return { ok: false, status: 400, error: "Invite codes can only be used within " + CLAIM_WINDOW_DAYS + " days of creating an account." };
  }
  if (owners().includes(String(referee.email || "").toLowerCase())) {
    return { ok: false, status: 400, error: "Founder accounts cannot be referred." };
  }

  // The same inbox under a second address is a self-referral.
  let referrerEmail = "";
  try {
    const { data } = await admin.auth.admin.getUserById(referrerId);
    referrerEmail = (data && data.user && data.user.email) || "";
  } catch (e) {}
  const self = sameInbox(referrerEmail, referee.email);

  const next = {
    ...mine,
    usedCode: code,
    referredBy: referrerId,
    referredAt: new Date().toISOString(),
    source: source || "",
    status: self ? "rejected" : "pending",
    reason: self ? "Same email inbox as the person who referred them" : "",
    history: [{ status: self ? "rejected" : "pending", at: new Date().toISOString(), by: "system" }],
  };
  await kvWrite(admin, referee.id, "referral", next);
  await count(admin, "signups");
  return { ok: true, status: next.status };
}

const norm = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// Recompute one referral from the facts. Run by the 10-minute sign-up job and
// whenever Admin opens the Referrals list, so a referral becomes eligible
// within 10 minutes of a founder verifying the profile, whichever of email
// confirmation and verification happened first.
// Paid and rejected are final unless a founder changes them.
export async function evaluate(admin, refereeId, opts = {}) {
  const rec = await kvRead(admin, refereeId, "referral");
  if (!rec || !rec.referredBy) return null;
  if (["paid", "rejected"].includes(rec.status)) return rec.status;

  const profile = (await kvRead(admin, refereeId, "clinician_profile")) || {};
  let confirmed = false;
  let refereeEmail = "";
  try {
    const { data } = await admin.auth.admin.getUserById(refereeId);
    confirmed = !!(data && data.user && data.user.email_confirmed_at);
    refereeEmail = (data && data.user && data.user.email) || "";
  } catch (e) {}
  const qualifies = confirmed && !!profile.verifiedAt;

  let status = rec.status || "pending";
  let reason = rec.reason || "";

  if (!qualifies) {
    // Verification withdrawn before the voucher went out: back to pending.
    if (status === "eligible" || status === "capped") { status = "pending"; reason = "Verification withdrawn"; }
  } else if (status === "pending") {
    // One registration, one reward. The same registration number on the
    // referrer's own profile, or on another verified account, is a duplicate.
    const reg = norm(profile.regNumber);
    let dup = "";
    if (reg) {
      const { data } = await admin.from("kv").select("owner,value").eq("key", "clinician_profile");
      for (const r of data || []) {
        if (r.owner === refereeId) continue;
        let p = r.value; try { p = JSON.parse(p); } catch (e) {}
        if (!p || norm(p.regNumber) !== reg) continue;
        if (r.owner === rec.referredBy) { dup = "Same registration number as the person who referred them"; break; }
        if (p.verifiedAt) { dup = "Same registration number as another verified account"; break; }
      }
    }
    if (dup) { status = "rejected"; reason = dup; }
    else {
      const settings = await getSettings(admin);
      const rows = await allRows(admin);
      const counted = rows.filter((r) => r.owner !== refereeId && r.value.referredBy === rec.referredBy &&
        ["eligible", "paid"].includes(r.value.status)).length;
      if (counted >= settings.cap) { status = "capped"; reason = "Referrer had already reached the pilot cap of " + settings.cap; }
      else { status = "eligible"; reason = ""; }
    }
  }

  if (status === rec.status && reason === (rec.reason || "")) return status;
  const now = new Date().toISOString();
  const next = {
    ...rec, status, reason,
    eligibleAt: status === "eligible" ? now : (status === "pending" ? null : rec.eligibleAt || null),
    history: [...(rec.history || []), { status, at: now, by: opts.by || "system", reason }].slice(-20),
  };
  await kvWrite(admin, refereeId, "referral", next);

  if (status === "eligible") {
    await count(admin, "eligible");
    await notifyEligible(admin, rec.referredBy, refereeId, refereeEmail).catch(() => {});
  }
  return status;
}

// Tell the founders a voucher is owed, with who to send it to.
async function notifyEligible(admin, referrerId, refereeId, refereeEmail) {
  const to = owners();
  if (!to.length) return;
  const settings = await getSettings(admin);
  let referrer = {};
  try { const { data } = await admin.auth.admin.getUserById(referrerId); referrer = (data && data.user) || {}; } catch (e) {}
  const m = referrer.user_metadata || {};
  const name = m.full_name || [m.first_name, m.last_name].filter(Boolean).join(" ") || referrer.email || "A clinician";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const html =
    '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.55;max-width:560px">' +
    "<p>A referral has qualified for a <b>&pound;" + settings.rewardGBP + " voucher</b>.</p>" +
    '<table cellpadding="0" cellspacing="0" style="font-size:14px">' +
    '<tr><td style="padding:3px 14px 3px 0;color:#5A6783">Send the voucher to</td><td><b>' + esc(name) + "</b> (" + esc(referrer.email || "") + ")</td></tr>" +
    '<tr><td style="padding:3px 14px 3px 0;color:#5A6783">For referring</td><td>' + esc(refereeEmail) + "</td></tr>" +
    "</table>" +
    "<p>They confirmed their email and their clinician profile has been verified. Once you have sent the voucher, open Qura, go to Admin, then Referrals, and mark it paid so it is never paid twice.</p></div>";
  await sendMailEach(to, "Referral qualified: £" + settings.rewardGBP + " voucher for " + name, html, referrer.email || undefined);
}

// Referrals for one person, as their card shows them.
export async function statsFor(admin, uid) {
  const rows = await allRows(admin);
  const mine = rows.filter((r) => r.value.referredBy === uid);
  const c = { pending: 0, eligible: 0, paid: 0, capped: 0, rejected: 0 };
  for (const r of mine) c[r.value.status || "pending"] = (c[r.value.status || "pending"] || 0) + 1;
  return { total: mine.length, counts: c };
}
