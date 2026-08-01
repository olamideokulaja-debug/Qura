import { getUser, kvGet, kvSet } from "./_auth.js";
import { limited } from "./_ratelimit.js";

// The referral scheme: invite a colleague, both get Career+ for a month.
//
// Clinician networks are dense inside hospitals; every audiologist knows ten
// more. This is the cheapest supply growth available, and it costs a month of
// a feature rather than cash.
//
// Mechanics kept deliberately tight:
//   - Everyone gets a short code. Codes map to owners in a shared index.
//   - A code can be redeemed ONCE per new user, never your own, and only if
//     you have not redeemed one before. Both sides then get a qura_comp of
//     clinician:growth for 30 days, which planOf() honours only while they
//     have no paid plan, so a real purchase always wins.
//   - Comp months do not stack. Redeeming while a comp is running extends
//     nothing; the cap is one referral month in flight per person at a time,
//     which keeps the scheme a taster rather than a permanent free tier.

const CODE_KEY = "referral";
const INDEX = "referral_codes";
const COMP_DAYS = 30;

function makeCode() {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no confusable characters
  let c = "";
  for (let i = 0; i < 6; i++) c += abc[Math.floor(Math.random() * abc.length)];
  return c;
}

function compUntil() {
  return new Date(Date.now() + COMP_DAYS * 86400000).toISOString();
}

async function grantComp(uid) {
  const existing = (await kvGet(uid, "qura_comp")) || null;
  // Never shorten an existing comp, never stack a new one on top.
  if (existing && existing.until && Date.parse(existing.until) > Date.now()) return false;
  await kvSet(uid, "qura_comp", { plan: "clinician:growth", until: compUntil(), source: "referral" });
  return true;
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "referrals", limit: 30, windowSec: 3600 })) return;

  if (req.method === "GET") {
    let mine = (await kvGet(user.id, CODE_KEY)) || null;
    if (!mine || !mine.code) {
      // First visit: mint a code and index it.
      const index = (await kvGet("shared", INDEX)) || {};
      let code = makeCode();
      let guard = 0;
      while (index[code] && guard++ < 20) code = makeCode();
      index[code] = user.id;
      await kvSet("shared", INDEX, index);
      mine = { code, redeemedCount: 0, redeemedAt: null, usedCode: null };
      await kvSet(user.id, CODE_KEY, mine);
    }
    const comp = (await kvGet(user.id, "qura_comp")) || null;
    const compActive = !!(comp && comp.until && Date.parse(comp.until) > Date.now());
    return res.status(200).json({
      code: mine.code,
      redeemedCount: mine.redeemedCount || 0,
      hasRedeemed: !!mine.usedCode,
      compActive,
      compUntil: compActive ? comp.until : null,
    });
  }

  if (req.method === "POST") {
    const code = String((req.body || {}).code || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return res.status(400).json({ error: "That does not look like a Qura invite code." });

    const index = (await kvGet("shared", INDEX)) || {};
    const ownerId = index[code];
    if (!ownerId) return res.status(404).json({ error: "That code was not recognised. Check it with your colleague." });
    if (ownerId === user.id) return res.status(400).json({ error: "That is your own code. Share it with a colleague instead." });

    const mine = (await kvGet(user.id, CODE_KEY)) || { redeemedCount: 0 };
    if (mine.usedCode) return res.status(409).json({ error: "You have already used an invite code." });

    // Both sides get the month, without stacking.
    await grantComp(user.id);
    await grantComp(ownerId);

    mine.usedCode = code;
    mine.redeemedAt = new Date().toISOString();
    await kvSet(user.id, CODE_KEY, mine);

    const owner = (await kvGet(ownerId, CODE_KEY)) || {};
    owner.redeemedCount = (owner.redeemedCount || 0) + 1;
    await kvSet(ownerId, CODE_KEY, owner);

    return res.status(200).json({ ok: true, message: "Career+ is on for the next " + COMP_DAYS + " days, for both of you." });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
