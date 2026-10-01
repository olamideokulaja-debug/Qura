import { getUser, kvListByKey, kvSet } from "./_auth.js";
import { limited } from "./_ratelimit.js";
import { orgVerified, isFounderEmail, roleOf } from "./_orgcheck.js";
import { getPool, savePool, agencyAccount, repFor, repOwner, isActive, isEmail, normEmail, sendInvite, REP_KEY } from "./_agency.js";

export const config = { maxDuration: 60 };

// GET  /api/agency-pool                       this agency's clinicians and their status
// POST /api/agency-pool { action: "invite", clinicians: [{ email, name, profession, country }] }
// POST /api/agency-pool { action: "resend", id }
// POST /api/agency-pool { action: "remove", id }
// POST /api/agency-pool { action: "settings", showName }
//
// Workforce suppliers only. Inviting needs an organisation a founder has
// checked. See api/_agency.js for the rules.

const SUPPLIER = new Set(["supplier", "agency"]);
const clip = (v, n) => String(v == null ? "" : v).replace(/[<>]/g, "").trim().slice(0, n);

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const founder = isFounderEmail(user.email);
  const role = await roleOf(user.id);
  if (!founder && !SUPPLIER.has(role)) return res.status(403).json({ error: "Talent pools are for workforce suppliers and agencies." });
  const checked = founder || (await orgVerified(user));

  if (req.method === "GET") {
    const pool = await getPool(user.id);
    // Which confirmed clinicians have finished their Qura profile, and been
    // checked against the register. Matched by email, the only link we have.
    const profiles = await kvListByKey("clinician_profile");
    const byEmail = {};
    for (const { value } of profiles) if (value && value.email) byEmail[normEmail(value.email)] = value;
    const now = Date.now();
    const entries = pool.entries.map((e) => {
      const p = byEmail[normEmail(e.email)] || null;
      const expired = e.status === "confirmed" && e.until && now >= Date.parse(e.until);
      return {
        id: e.id, email: e.email, name: e.name || "", profession: e.profession || (p && p.profession) || "", country: e.country || "",
        status: expired ? "expired" : e.status, invitedAt: e.invitedAt || null, confirmedAt: e.confirmedAt || null, until: e.until || null,
        introductions: e.introductions || 0,
        onQura: Boolean(p), registered: Boolean(p && p.registeredAt), checked: Boolean(p && p.verifiedAt),
      };
    });
    const count = (s) => entries.filter((e) => e.status === s).length;
    return res.status(200).json({
      showName: pool.showName, canInvite: checked, entries,
      totals: { all: entries.length, confirmed: count("confirmed"), invited: count("invited"), declined: count("declined"), visible: entries.filter((e) => e.status === "confirmed" && e.checked).length },
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = req.body || {};
  const pool = await getPool(user.id);

  if (body.action === "settings") {
    pool.showName = body.showName !== false;
    await savePool(user.id, pool);
    // Running representations carry the choice, so Talent reads it directly.
    for (const e of pool.entries) {
      if (e.status !== "confirmed") continue;
      const rep = await repFor(e.email);
      if (isActive(rep) && rep.agencyId === user.id) await kvSet(repOwner(e.email), REP_KEY, { ...rep, showName: pool.showName });
    }
    return res.status(200).json({ ok: true, showName: pool.showName });
  }

  if (body.action === "remove") {
    const e = pool.entries.find((x) => x.id === String(body.id || ""));
    if (!e) return res.status(404).json({ error: "Not found." });
    const rep = await repFor(e.email);
    if (rep && rep.agencyId === user.id && rep.entryId === e.id && rep.status === "active") {
      await kvSet(repOwner(e.email), REP_KEY, { ...rep, status: "ended", endedAt: new Date().toISOString(), endedBy: "agency" });
    }
    e.status = "ended"; e.endedAt = new Date().toISOString(); e.endedBy = "agency";
    await savePool(user.id, pool);
    return res.status(200).json({ ok: true });
  }

  if (!checked) {
    return res.status(403).json({ error: "We check every organisation before it can add clinicians, usually within 1 working day. We will email you when it is done." });
  }
  const ag = await agencyAccount(user.id);

  if (body.action === "resend") {
    const e = pool.entries.find((x) => x.id === String(body.id || ""));
    if (!e || e.status !== "invited") return res.status(400).json({ error: "Only an invitation that is still waiting can be sent again." });
    if ((e.resends || 0) >= 2) return res.status(400).json({ error: "This invitation has already been sent 3 times." });
    if (await limited(req, res, user, { bucket: "agency-resend", limit: 50, windowSec: 86400 })) return;
    const r = await sendInvite(user.id, ag.name, e);
    e.resends = (e.resends || 0) + 1; e.lastSentAt = new Date().toISOString();
    await savePool(user.id, pool);
    return res.status(200).json({ ok: r.ok });
  }

  if (body.action === "invite") {
    const list = Array.isArray(body.clinicians) ? body.clinicians.slice(0, 200) : [];
    if (!list.length) return res.status(400).json({ error: "Add at least one clinician with an email address." });
    if (await limited(req, res, user, { bucket: "agency-invite", limit: 10, windowSec: 86400 })) return;
    const out = { invited: [], already: [], unavailable: [], invalid: [], failed: [] };
    const seen = new Set();
    const toSend = [];
    for (const raw of list) {
      const email = normEmail(raw && raw.email);
      if (!isEmail(email)) { out.invalid.push(clip(raw && raw.email, 120)); continue; }
      if (seen.has(email)) continue;
      seen.add(email);
      const existing = pool.entries.find((x) => normEmail(x.email) === email && (x.status === "invited" || x.status === "confirmed"));
      if (existing) { out.already.push(email); continue; }
      const rep = await repFor(email);
      if (isActive(rep) && rep.agencyId !== user.id) {
        // Represented by another agency. Nothing is sent and nothing is said
        // about who: another agency's pool is private.
        out.unavailable.push(email);
        continue;
      }
      const entry = {
        id: "rp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), email,
        name: clip(raw.name, 80), profession: clip(raw.profession, 80), country: clip(raw.country, 60),
        status: "invited", invitedAt: new Date().toISOString(),
      };
      pool.entries.unshift(entry);
      toSend.push(entry);
    }
    await savePool(user.id, pool);
    for (let i = 0; i < toSend.length; i += 10) {
      const rs = await Promise.all(toSend.slice(i, i + 10).map((e) => sendInvite(user.id, ag.name, e)));
      rs.forEach((r, j) => (r.ok ? out.invited : out.failed).push(toSend[i + j].email));
    }
    return res.status(200).json({
      invited: out.invited.length, already: out.already.length, unavailable: out.unavailable.length,
      invalid: out.invalid, failed: out.failed,
    });
  }

  return res.status(400).json({ error: "Unknown action." });
}
