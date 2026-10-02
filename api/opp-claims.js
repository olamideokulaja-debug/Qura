import { getUser, kvGet, kvSet } from "./_auth.js";
import { sbAdmin, asDiscover } from "./_opps.js";
import { bump } from "./_metrics.js";
import { limited } from "./_ratelimit.js";
import { orgVerified, isFounderEmail } from "./_orgcheck.js";
import { sendMail, owners, SUPPORT } from "./_waitlist.js";
import { isOpen, closesLabel } from "./_roles.js";
import { rolePayLabel, prefLabel } from "./_comp.js";

// Qura Opportunity Engine, part 2 (2 October 2026): saved roles and
// "Is this your vacancy? Claim it".
//
// GET  /api/opp-claims?saved=1   the roles this person saved, Qura Direct and
//                                Discovered by Qura, in the order they saved them
// GET  /api/opp-claims?mine=1    adverts this organisation has claimed, with status
// GET  /api/opp-claims?all=1     founders: every claim, newest first
// POST /api/opp-claims { action: "claim", id, note }        a confirmed organisation says
//                                                           a discovered advert is theirs
// POST /api/opp-claims { action: "decide", id, approve }    founders only; the
//                                                           organisation is emailed
//
// A claim changes nothing until a founder confirms it. Once confirmed,
// clinicians see the advert marked "Claimed on Qura by" the organisation. To
// take applications through Qura the organisation posts the role itself.

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clip = (v, n) => String(v == null ? "" : v).replace(/[<>]/g, "").trim().slice(0, n);
const DISC = /^(nhsjobs|adzuna|reed):/;

function asDirect(d) {
  return {
    id: d.id, kind: "direct", label: "Qura Direct", role: d.title || d.profession || "Healthcare role", employer: d.buyer || "Healthcare organisation",
    region: d.region || "", market: d.market || "", profession: d.profession || "", employmentLabel: prefLabel(d.employmentType),
    rate: d.rate || rolePayLabel(d) || "", closes: closesLabel(d), summary: d.note || "", closed: !isOpen(d),
  };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const sb = sbAdmin();
  if (!sb) return res.status(500).json({ error: "Not configured" });
  const founder = isFounderEmail(user.email);

  if (req.method === "GET") {
    const q = req.query || {};
    if (q.saved) {
      const ids = ((await kvGet(user.id, "saved_opportunities")) || []).filter((x) => typeof x === "string").slice(0, 100);
      const posted = (await kvGet("shared", "demand_posted")) || [];
      const byId = {};
      for (const d of Array.isArray(posted) ? posted : []) if (ids.includes(d.id)) byId[d.id] = asDirect(d);
      const dIds = ids.filter((x) => DISC.test(x));
      if (dIds.length) {
        const { data } = await sb.from("opportunities").select("*").in("id", dIds);
        for (const r of data || []) byId[r.id] = { ...asDiscover(r), closed: r.status !== "LIVE" };
      }
      return res.status(200).json({ items: ids.map((x) => byId[x]).filter(Boolean) });
    }
    if (q.mine) {
      const { data } = await sb.from("opportunities").select("*").eq("claimed_by_user", user.id).order("claimed_at", { ascending: false }).limit(100);
      return res.status(200).json({ items: (data || []).map((r) => ({ ...asDiscover(r), claimStatus: r.claim_status, status: r.status })) });
    }
    if (q.all) {
      if (!founder) return res.status(403).json({ error: "Founders only." });
      const { data } = await sb.from("opportunities").select("*").neq("claim_status", "UNCLAIMED").order("claimed_at", { ascending: false, nullsFirst: false }).limit(200);
      return res.status(200).json({ items: (data || []).map((r) => ({ ...asDiscover(r), claimStatus: r.claim_status, claimant: r.claimed_by, claimNote: r.claim_note, claimedAt: r.claimed_at, decidedBy: r.claim_decided_by || null, status: r.status })) });
    }
    return res.status(400).json({ error: "Say what to list." });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const b = req.body || {};
  const id = String(b.id || "");

  if (b.action === "claim") {
    const acc = (await kvGet(user.id, "account")) || {};
    const lens = acc.lens || ({ agency: "supplier", supplier: "supplier", hospital: "healthcare_provider", gp: "healthcare_provider", care: "healthcare_provider" })[acc.role] || "";
    if (!founder && lens !== "supplier" && lens !== "healthcare_provider") return res.status(403).json({ error: "Only organisation accounts can claim an advert." });
    if (!founder && !(await orgVerified(user))) return res.status(403).json({ error: "We check every organisation before it can claim an advert, usually within 1 working day." });
    if (await limited(req, res, user, { bucket: "opps-claim", limit: 10, windowSec: 86400 })) return;
    const { data: r } = await sb.from("opportunities").select("id,title,employer,source_name,source_url,claim_status,claimed_by_user").eq("id", id).maybeSingle();
    if (!r) return res.status(404).json({ error: "Advert not found." });
    if (r.claim_status === "CLAIMED") return res.status(409).json({ error: "This advert has already been claimed." });
    if (r.claim_status === "CLAIM_REQUESTED" && r.claimed_by_user && r.claimed_by_user !== user.id) return res.status(409).json({ error: "Another organisation has already asked to claim this advert. We are checking it." });
    const org = clip(acc.org, 120) || user.email;
    const note = clip(b.note, 400);
    await sb.from("opportunities").update({ claim_status: "CLAIM_REQUESTED", claimed_by: org, claim_note: note + " [by " + user.email + "]",
      claimed_by_user: user.id, claimed_at: new Date().toISOString(), claim_decided_by: null, updated_at: new Date().toISOString() }).eq("id", id);
    await bump("opp_claim_requested");
    try {
      await sendMail(owners().length ? owners() : [SUPPORT], "Advert claim: " + r.title,
        "<p>" + esc(org) + " (" + esc(user.email) + ") says this advert is theirs:</p><p><b>" + esc(r.title) + "</b><br>" + esc(r.employer) + "<br>" +
        esc(r.source_name) + ": " + esc(r.source_url) + "</p><p>Their note: " + esc(note) + "</p><p>Check they really are the employer, then confirm or reject it under Admin, New organisations, Advert claims.</p>", SUPPORT);
    } catch (e) {}
    return res.status(200).json({ ok: true, claimStatus: "CLAIM_REQUESTED" });
  }

  if (b.action === "decide") {
    if (!founder) return res.status(403).json({ error: "Founders only." });
    const ok = b.approve === true;
    const { data: r } = await sb.from("opportunities").select("id,title,claimed_by,claim_note").eq("id", id).maybeSingle();
    if (!r) return res.status(404).json({ error: "Advert not found." });
    // A rejected claim does not stop the real employer claiming it later.
    await sb.from("opportunities").update({ claim_status: ok ? "CLAIMED" : "REJECTED", claim_decided_by: user.email, updated_at: new Date().toISOString() }).eq("id", id);
    let emailed = false;
    try {
      const m = String(r.claim_note || "").match(/\[by ([^\]]+)\]$/);
      if (m) {
        const sent = await sendMail([m[1]], ok ? "Your advert is confirmed on Qura" : "About your advert claim on Qura",
          ok ? "<p>Hello,</p><p>We have confirmed that <b>" + esc(r.title) + "</b> is your advert. Clinicians on Qura now see it marked as claimed by " + esc(r.claimed_by) + ".</p><p>To take applications through Qura as well, post the role from Post a role.</p><p>The Qura team</p>"
             : "<p>Hello,</p><p>We could not confirm that <b>" + esc(r.title) + "</b> belongs to your organisation, so the claim has not been approved. Reply to this email if you think this is wrong.</p><p>The Qura team</p>", SUPPORT);
        emailed = Boolean(sent && sent.ok);
      }
    } catch (e) {}
    return res.status(200).json({ ok: true, claimStatus: ok ? "CLAIMED" : "REJECTED", emailed });
  }
  return res.status(400).json({ error: "Unknown action." });
}
