import { getUser, kvGet, kvSet } from "./_auth.js";

// Which organisation does this account belong to?
//
// Qura had no answer to that. An account knew it was an agency; it did not know
// WHICH agency. Everything about supplier standing depends on it: without the
// link, a supplier cannot be shown their own rating, and "submit evidence for
// yourself" has nothing to attach to.
//
//   GET                        the caller's organisation link, or null
//   POST { org }               claim an organisation. Always starts pending.
//   GET  ?pending=1            founder only: claims awaiting approval
//   POST { claimId, decision } founder only: approve or decline
//
// A claim is never self-approving. Approving it is a founder saying "yes, this
// person represents this organisation", which is the same judgement that gates
// clinician verification and for the same reason: the badge is only worth
// something if a human stood behind it.

const LINK_KEY = "supplier_org";           // per account
const CLAIMS_KEY = "supplier_org_claims";  // shared queue
const INDEX_KEY = "supplier_org_index";    // org slug -> [account ids]

const OWNERS = (process.env.OWNER_EMAILS || process.env.VITE_OWNER_EMAILS || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const isOwner = (u) => Boolean(u && u.email && OWNERS.includes(String(u.email).toLowerCase()));

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const q = req.query || {};
  const body = req.body || {};

  // ------------------------------------------------ founder: pending claims
  if (q.pending) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const all = (await kvGet("shared", CLAIMS_KEY)) || [];
    const list = Array.isArray(all) ? all : [];
    return res.status(200).json({ claims: list.filter((c) => c.status === "pending") });
  }

  if (req.method === "GET") {
    const link = (await kvGet(user.id, LINK_KEY)) || null;
    return res.status(200).json({ link });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ------------------------------------------------ founder: decide a claim
  if (body.claimId) {
    if (!isOwner(user)) return res.status(403).json({ error: "Not authorised." });
    const all = (await kvGet("shared", CLAIMS_KEY)) || [];
    const list = Array.isArray(all) ? all : [];
    const c = list.find((x) => x.id === body.claimId);
    if (!c) return res.status(404).json({ error: "No such claim." });
    if (c.status !== "pending") return res.status(400).json({ error: "Already decided." });

    const approve = body.decision === "approve";
    c.status = approve ? "approved" : "declined";
    c.decidedBy = user.email;
    c.decidedAt = new Date().toISOString();

    if (approve) {
      // The link lives on the claimant's own record, so their next page load
      // knows who they are without consulting the queue.
      await kvSet(c.accountId, LINK_KEY, {
        org: c.org, slug: c.slug,
        approvedBy: user.email, approvedAt: c.decidedAt,
      });
      // And an index the other way, so a founder can see every account
      // attached to one organisation.
      try {
        const idx = (await kvGet("shared", INDEX_KEY)) || {};
        const map = idx && typeof idx === "object" && !Array.isArray(idx) ? idx : {};
        map[c.slug] = Array.from(new Set([...(map[c.slug] || []), c.accountId]));
        await kvSet("shared", INDEX_KEY, map);
      } catch (e) {
        console.error("[supplier-org] index write failed: " + (e && e.message));
      }
    }
    await kvSet("shared", CLAIMS_KEY, list);
    return res.status(200).json({ ok: true, claim: c });
  }

  // ------------------------------------------------------ claim an organisation
  const org = String(body.org || "").trim();
  if (org.length < 2) return res.status(400).json({ error: "Enter your organisation's name." });
  const slug = slugify(org);
  if (!slug) return res.status(400).json({ error: "That organisation name cannot be used." });

  const existing = (await kvGet(user.id, LINK_KEY)) || null;
  if (existing && existing.slug === slug) {
    return res.status(400).json({ error: "Your account is already linked to " + existing.org + "." });
  }

  const all = (await kvGet("shared", CLAIMS_KEY)) || [];
  const list = Array.isArray(all) ? all : [];
  if (list.some((c) => c.accountId === user.id && c.status === "pending")) {
    return res.status(400).json({ error: "You already have a claim with the Qura team. They will be in touch." });
  }

  const claim = {
    id: "og_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    org, slug,
    // Everything a founder needs to judge whether this person really works
    // there. The email domain is usually the strongest signal.
    accountId: user.id,
    email: user.email,
    role: String(body.role || "").slice(0, 120),
    note: String(body.note || "").slice(0, 600),
    at: new Date().toISOString(),
    status: "pending",
  };
  list.push(claim);
  const ok = await kvSet("shared", CLAIMS_KEY, list);
  if (!ok) return res.status(500).json({ error: "Could not submit that. Please try again." });

  return res.status(200).json({ ok: true, claim: { id: claim.id, org, status: "pending" } });
}
