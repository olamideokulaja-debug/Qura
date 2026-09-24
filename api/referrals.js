import { getUser } from "./_auth.js";
import { limited } from "./_ratelimit.js";
import { adminClient, kvRead, kvWrite, owners } from "./_waitlist.js";
import {
  getSettings, ensureCode, claim, evaluate, statsFor, allRows, count, linkFor, cleanCode,
  CLAIM_WINDOW_DAYS, DEFAULTS, SITE,
} from "./_referral.js";

// Qura Refer & Reward. The rules live in api/_referral.js; this is the door.
//
//   GET  /api/referrals?v=2                  your code, link and referrals
//   GET  /api/referrals?admin=1              founders: every referral, with totals
//   POST { code }                            apply an invite code to a new account
//   POST { action: "click", code }           the /join page was opened (no sign-in)
//   POST { action: "shared" }                Copy or Share was pressed
//   POST { action: "mark", referee, status, note }   founders: paid, rejected, etc.
//   POST { action: "settings", live, rewardGBP, cap } founders
//
// Replaces the September scheme (both sides got a free month of Career+), which
// nobody had used. Codes people already had are kept.

const TERMS = SITE + "/referral-terms.html";
const STATUSES = ["pending", "eligible", "paid", "capped", "rejected"];

export default async function handler(req, res) {
  const admin = adminClient();
  if (!admin) return res.status(500).json({ error: "Supabase is not configured." });
  const body = req.body || {};

  // The only call that needs no account: a count of /join page visits.
  if (req.method === "POST" && body.action === "click") {
    if (await limited(req, res, null, { bucket: "ref-click", limit: 60, windowSec: 3600 })) return;
    if (/^[A-Z0-9]{6}$/.test(cleanCode(body.code))) await count(admin, "clicks");
    return res.status(200).json({ ok: true });
  }

  // Whether the programme is switched on, for the sign-up screens. Nothing else.
  if (req.method === "GET" && req.query && req.query.public) {
    const s = await getSettings(admin);
    return res.status(200).json({ live: s.live });
  }

  const user = await getUser(req);
  if (!user || user._preview) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "referrals", limit: 60, windowSec: 3600 })) return;
  const isFounder = owners().includes(String(user.email || "").toLowerCase());

  if (req.method === "GET" && req.query && req.query.admin) {
    if (!isFounder) return res.status(403).json({ error: "Founders only" });
    return res.status(200).json(await adminView(admin));
  }

  if (req.method === "GET") {
    // Phone apps from before this change still show the old "free month of
    // Career+" card. They do not send v=2, so they get nothing and hide it.
    if (!req.query || String(req.query.v) !== "2") return res.status(410).json({ error: "Please update Qura to see your referral link." });
    const settings = await getSettings(admin);
    const mine = await ensureCode(admin, user.id);
    const { total, counts } = await statsFor(admin, user.id);
    const created = Date.parse(user.created_at || "");
    const canClaim = !mine.referredBy && !(created && Date.now() - created > CLAIM_WINDOW_DAYS * 86400000);
    return res.status(200).json({
      live: settings.live,
      // Founders see the card while it is switched off, so it can be checked.
      show: settings.live || isFounder,
      preview: !settings.live && isFounder,
      code: mine.code,
      link: linkFor(mine.code),
      rewardGBP: settings.rewardGBP,
      cap: settings.cap,
      total, counts,
      earnedGBP: (counts.paid || 0) * settings.rewardGBP,
      owedGBP: (counts.eligible || 0) * settings.rewardGBP,
      qualifyingLeft: Math.max(0, settings.cap - (counts.eligible || 0) - (counts.paid || 0)),
      canClaim,
      referred: !!mine.referredBy,
      terms: TERMS,
      shareText: "I'm on Qura, where healthcare professionals build a verified profile and hear about roles from hospitals and suppliers. It's free. Join with my personal link: " + linkFor(mine.code),
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (body.action === "shared") {
    const mine = await ensureCode(admin, user.id);
    await kvWrite(admin, user.id, "referral", { ...mine, shared: (mine.shared || 0) + 1, lastSharedAt: new Date().toISOString() });
    await count(admin, "shares");
    return res.status(200).json({ ok: true });
  }

  if (body.action === "mark") {
    if (!isFounder) return res.status(403).json({ error: "Founders only" });
    const { referee, status, note } = body;
    if (!referee || !STATUSES.includes(status)) return res.status(400).json({ error: "referee and a valid status are required." });
    const rec = await kvRead(admin, referee, "referral");
    if (!rec || !rec.referredBy) return res.status(404).json({ error: "No referral for that account." });
    // Paid only from eligible, and never twice: the guard against paying the
    // same voucher twice.
    if (status === "paid" && rec.status === "paid") return res.status(409).json({ error: "Already marked paid on " + String(rec.paidAt || "").slice(0, 10) + " by " + (rec.paidBy || "a founder") + "." });
    if (status === "paid" && rec.status !== "eligible") return res.status(400).json({ error: "Only an eligible referral can be marked paid." });
    const now = new Date().toISOString();
    const by = String(user.email || "").toLowerCase();
    const next = {
      ...rec, status,
      reason: status === "rejected" ? String(note || "Rejected by a founder").slice(0, 200) : (status === "paid" ? "" : rec.reason || ""),
      paidAt: status === "paid" ? now : (status === "pending" || status === "eligible" ? null : rec.paidAt || null),
      paidBy: status === "paid" ? by : (status === "pending" || status === "eligible" ? null : rec.paidBy || null),
      paidNote: status === "paid" ? String(note || "").slice(0, 200) : rec.paidNote || "",
      history: [...(rec.history || []), { status, at: now, by, note: String(note || "").slice(0, 200) }].slice(-20),
    };
    await kvWrite(admin, referee, "referral", next);
    if (status === "paid") await count(admin, "paid");
    // Moving one back to pending lets the rules decide again.
    if (status === "pending") await evaluate(admin, referee, { by });
    return res.status(200).json({ ok: true, status: (await kvRead(admin, referee, "referral")).status });
  }

  if (body.action === "settings") {
    if (!isFounder) return res.status(403).json({ error: "Founders only" });
    const cur = await getSettings(admin);
    const rewardGBP = body.rewardGBP === undefined ? cur.rewardGBP : Number(body.rewardGBP);
    const cap = body.cap === undefined ? cur.cap : Math.floor(Number(body.cap));
    if (!(rewardGBP > 0 && rewardGBP <= 500) || !(cap > 0 && cap <= 1000)) return res.status(400).json({ error: "Reward must be between 1 and 500 pounds, and the cap between 1 and 1000." });
    const next = { live: body.live === undefined ? cur.live : !!body.live, rewardGBP, cap, updatedAt: new Date().toISOString(), updatedBy: String(user.email || "").toLowerCase() };
    await kvWrite(admin, "shared", "referral_settings", next);
    return res.status(200).json({ ok: true, settings: next });
  }

  // Default: apply an invite code to this account.
  const r = await claim(admin, user, body.code, body.source || "code");
  if (!r.ok) return res.status(r.status || 400).json({ error: r.error });
  return res.status(200).json({ ok: true, message: r.already ? "Your invite code is already applied." : "Invite code applied. Thank you for joining Qura." });
}

async function adminView(admin) {
  const settings = await getSettings(admin);
  let rows = await allRows(admin);
  // Pick up anything that has qualified since it was last looked at, such as an
  // email confirmed after the profile was verified.
  const open = rows.filter((r) => r.value.referredBy && ["pending", "eligible", "capped"].includes(r.value.status || "pending"));
  let changed = false;
  for (const r of open) {
    const before = r.value.status;
    const after = await evaluate(admin, r.owner);
    if (after && after !== before) changed = true;
  }
  if (changed) rows = await allRows(admin);

  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = {};
  for (const u of (data && data.users) || []) {
    const m = u.user_metadata || {};
    users[u.id] = { email: u.email || "", name: m.full_name || [m.first_name, m.last_name].filter(Boolean).join(" "), confirmed: !!u.email_confirmed_at, created: u.created_at };
  }
  const { data: profs } = await admin.from("kv").select("owner,value").eq("key", "clinician_profile");
  const profile = {};
  for (const p of profs || []) { let v = p.value; try { v = JSON.parse(v); } catch (e) {} profile[p.owner] = v || {}; }
  const codeOf = {};
  for (const r of rows) if (r.value.code) codeOf[r.owner] = r.value.code;

  const referrals = rows.filter((r) => r.value.referredBy).map((r) => {
    const v = r.value;
    const ref = users[v.referredBy] || {};
    const who = users[r.owner] || {};
    const p = profile[r.owner] || {};
    return {
      referee: r.owner,
      refereeName: who.name || "", refereeEmail: who.email || "(account deleted)",
      registeredAt: who.created || v.referredAt,
      emailConfirmed: !!who.confirmed,
      profileComplete: !!p.registeredAt,
      verifiedAt: p.verifiedAt || null,
      referrer: v.referredBy,
      referrerName: ref.name || "", referrerEmail: ref.email || "(account deleted)",
      code: v.usedCode || codeOf[v.referredBy] || "",
      link: linkFor(v.usedCode || codeOf[v.referredBy] || ""),
      status: v.status || "pending", reason: v.reason || "",
      eligibleAt: v.eligibleAt || null, paidAt: v.paidAt || null, paidBy: v.paidBy || null, paidNote: v.paidNote || "",
      source: v.source || "",
    };
  });
  const order = { eligible: 0, pending: 1, capped: 2, paid: 3, rejected: 4 };
  referrals.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || String(b.registeredAt).localeCompare(String(a.registeredAt)));

  const referrers = {};
  for (const x of referrals) {
    const k = x.referrer;
    const t = referrers[k] || (referrers[k] = { referrer: k, name: x.referrerName, email: x.referrerEmail, code: x.code, total: 0, pending: 0, eligible: 0, paid: 0, capped: 0, rejected: 0 });
    t.total++; t[x.status] = (t[x.status] || 0) + 1;
  }
  for (const r of rows) {
    if (r.value.shared && referrers[r.owner]) referrers[r.owner].shared = r.value.shared;
  }

  const metrics = (await kvRead(admin, "metrics", "referrals")) || {};
  const totals = {};
  for (const counts of Object.values(metrics)) for (const [k, v] of Object.entries(counts || {})) totals[k] = (totals[k] || 0) + v;
  const verifiedReferred = referrals.filter((x) => ["eligible", "paid", "capped"].includes(x.status)).length;
  const paid = referrals.filter((x) => x.status === "paid").length;

  return {
    settings: { ...DEFAULTS, ...settings },
    referrals,
    referrers: Object.values(referrers).sort((a, b) => (b.eligible + b.paid) - (a.eligible + a.paid) || b.total - a.total),
    summary: {
      linkVisits: totals.clicks || 0,
      shares: totals.shares || 0,
      registrations: referrals.length,
      qualified: verifiedReferred,
      conversionPct: referrals.length ? Math.round((verifiedReferred / referrals.length) * 100) : 0,
      paid,
      spentGBP: paid * settings.rewardGBP,
      owedGBP: referrals.filter((x) => x.status === "eligible").length * settings.rewardGBP,
      costPerVerifiedGBP: verifiedReferred ? Math.round((paid * settings.rewardGBP / verifiedReferred) * 100) / 100 : 0,
      referrersActive: Object.keys(referrers).length,
      repeatReferrers: Object.values(referrers).filter((t) => t.total > 1).length,
      rejected: referrals.filter((x) => x.status === "rejected").length,
    },
  };
}
