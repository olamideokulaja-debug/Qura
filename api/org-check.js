// Organisation checks (see api/_orgcheck.js).
//
//   GET  ?u&d&t          one-tap link from the founders' email: shows a confirm button
//   POST ?u&d&t          the confirm button: records the decision
//   GET                  signed in: this account's own status
//   GET  ?admin=1        founder: every business account and its status
//   POST { userId, decision: "verify" | "reject", note }   founder, from Admin

import { getUser } from "./_auth.js";
import { adminClient } from "./_waitlist.js";
import { KEY, checkToken, decide, isFounderEmail, orgCheckOf, FREE_MAIL } from "./_orgcheck.js";

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const page = (title, body, tone, form) =>
  '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Qura</title>' +
  '<div style="font-family:Inter,-apple-system,Arial,sans-serif;background:#050D1C;color:#EEF3FF;' +
  'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px">' +
  '<div style="max-width:460px;text-align:center">' +
  '<div style="font-size:26px;font-weight:700;color:' + tone + '">' + esc(title) + "</div>" +
  '<div style="margin-top:12px;font-size:15px;line-height:1.6;color:#9FB0D0">' + esc(body) + "</div>" +
  (form || "") +
  '<div style="margin-top:26px;font-size:13px;color:#5A6783">Qura · Healthcare Growth CRM</div>' +
  "</div></div>";

const ROLE_NAMES = {
  agency: "Workforce supplier", supplier: "Workforce supplier",
  hospital: "Hospital / Provider", healthcare_provider: "Hospital / Provider",
  gp: "GP practice", care: "Care provider",
};

async function describe(admin, userId) {
  const { data } = await admin.auth.admin.getUserById(userId);
  const u = data && data.user;
  if (!u) return null;
  const m = u.user_metadata || {};
  return { email: u.email, name: m.full_name || [m.first_name, m.last_name].filter(Boolean).join(" "), company: m.company || "" };
}

export default async function handler(req, res) {
  const q = req.query || {};

  // ---------------------------------------------------- one-tap links
  if (q.u && q.d && q.t) {
    res.setHeader("content-type", "text/html; charset=utf-8");
    const userId = String(q.u);
    const d = q.d === "verify" ? "verify" : q.d === "reject" ? "reject" : "";
    if (!d || !checkToken(userId, d, q.t)) {
      return res.status(403).send(page("Link not valid", "That link is not one we issued, or it has been altered.", "#F59E0B"));
    }
    const admin = adminClient();
    if (!admin) return res.status(500).send(page("Not configured", "The server is missing its Supabase credentials.", "#F59E0B"));
    const who = await describe(admin, userId);
    if (!who) return res.status(404).send(page("Not found", "That account no longer exists.", "#F59E0B"));
    const label = (who.company || who.name || who.email) + " (" + who.email + ")";
    const cur = await orgCheckOf(userId);
    if (cur && (cur.status === "verified" || cur.status === "rejected")) {
      return res.status(200).send(page("Already decided", label + " was " + (cur.status === "verified" ? "confirmed" : "not confirmed") +
        (cur.decidedBy ? " by " + cur.decidedBy : "") + ". Nothing has changed.", "#9FB0D0"));
    }
    if (req.method !== "POST") {
      const action = "/api/org-check?u=" + encodeURIComponent(userId) + "&d=" + d + "&t=" + encodeURIComponent(String(q.t));
      const form = '<form method="post" action="' + esc(action) + '" style="margin-top:22px">' +
        '<button style="font:inherit;font-weight:700;font-size:15px;border:0;border-radius:999px;padding:12px 26px;cursor:pointer;background:' +
        (d === "verify" ? "#00C2B8;color:#04231F" : "#EEF1F7;color:#0A1730") + '">' +
        (d === "verify" ? "Yes, confirm and start their trial" : "Yes, mark as not confirmed") + "</button></form>";
      return res.status(200).send(page(d === "verify" ? "Confirm this organisation?" : "Mark as not confirmed?", label, "#EEF3FF", form));
    }
    const out = await decide(userId, d, "email link");
    if (!out.ok) return res.status(500).send(page("That did not work", out.error || "Unknown error.", "#F59E0B"));
    if (d === "reject") return res.status(200).send(page("Not confirmed", label + " stays on the free plan. They have not been emailed; reply to them if you want to ask for more detail.", "#9FB0D0"));
    return res.status(200).send(page("Confirmed", label + ": their 7-day trial " + (out.trialStarted ? "has started" : "was already running") +
      (out.emailed ? " and they have been emailed." : ". The email to them did not send, so let them know yourself."), "#00C2B8"));
  }

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const founder = isFounderEmail(user.email) && Boolean(user.email_confirmed_at || user.confirmed_at);

  // ---------------------------------------------------- founder list
  if (q.admin) {
    if (!founder) return res.status(403).json({ error: "Not authorised." });
    const admin = adminClient();
    if (!admin) return res.status(500).json({ error: "Supabase is not configured." });
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return res.status(500).json({ error: error.message });
    const users = (data && data.users) || [];
    const { data: rows } = await admin.from("kv").select("owner,key,value").in("key", [KEY, "account", "qura_role", "qura_trial", "qura_plan"]);
    const kv = {};
    (rows || []).forEach((r) => { let v = r.value; try { v = JSON.parse(r.value); } catch (e) {} if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) {} } (kv[r.owner] = kv[r.owner] || {})[r.key] = v; });
    const out = [];
    for (const u of users) {
      if (!u.email_confirmed_at || isFounderEmail(u.email)) continue;
      const k = kv[u.id] || {};
      const acc = k.account || {};
      const m = u.user_metadata || {};
      const role = acc.lens === "supplier" ? "supplier" : acc.lens === "healthcare_provider" ? "healthcare_provider" : (acc.role || k.qura_role || m.signup_role || "");
      if (!ROLE_NAMES[role]) continue;
      const rec = k[KEY] || null;
      out.push({
        id: u.id, email: u.email, personalEmail: FREE_MAIL.test(u.email || ""),
        name: m.full_name || [m.first_name, m.last_name].filter(Boolean).join(" ") || [acc.firstName, acc.lastName].filter(Boolean).join(" "),
        company: m.company || (acc.org && typeof acc.org === "object" ? acc.org.name : acc.org) || "",
        phone: m.phone || "", role: ROLE_NAMES[role], joined: u.created_at,
        status: rec ? rec.status : "not asked", requestedAt: rec ? rec.requestedAt : null,
        decidedAt: rec ? rec.decidedAt || null : null, decidedBy: rec ? rec.decidedBy || "" : "", note: rec ? rec.note || "" : "",
        trial: Boolean(k.qura_trial && typeof k.qura_trial.start === "number"),
        plan: typeof k.qura_plan === "string" ? k.qura_plan : "",
      });
    }
    const order = { pending: 0, "not asked": 1, rejected: 2, verified: 3 };
    out.sort((a, b) => (order[a.status] - order[b.status]) || String(b.joined).localeCompare(String(a.joined)));
    return res.status(200).json({ accounts: out, pending: out.filter((x) => x.status === "pending").length });
  }

  if (req.method === "GET") {
    if (founder) return res.status(200).json({ status: "verified", founder: true });
    const rec = await orgCheckOf(user.id);
    return res.status(200).json({ status: rec ? rec.status : "not asked" });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!founder) return res.status(403).json({ error: "Not authorised." });
  const { userId, decision, note } = req.body || {};
  if (!userId || !["verify", "reject"].includes(decision)) return res.status(400).json({ error: "userId and a decision are required." });
  const out = await decide(String(userId), decision, user.email, note, true);
  if (!out.ok) return res.status(500).json({ error: out.error || "Could not save." });
  return res.status(200).json(out);
}
