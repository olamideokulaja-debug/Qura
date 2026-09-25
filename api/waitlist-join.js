// The landing-page form posts here instead of writing to storage from the
// browser. Two reasons: the browser cannot send you a notification, and a
// shared kv row written from the browser can be overwritten by anyone who
// opens the console. This endpoint owns the queue.

import { adminClient, getQueue, kvWrite, sendMailEach, owners, actionLinks } from "./_waitlist.js";
import { limited } from "./_ratelimit.js";

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only." });
  // Public form: limited per visitor so it cannot be used to flood the founders.
  if (await limited(req, res, null, { bucket: "waitlist", limit: 5, windowSec: 3600 })) return;

  const admin = adminClient();
  if (!admin) return res.status(500).json({ error: "Not configured." });

  const body = req.body || {};
  const addr = String(body.email || "").trim().toLowerCase();
  // role is the product view the account opens on, and must be one the signup
  // picker knows. segment is the finer thing they actually are, which the
  // product has no view for but the founders want to know.
  const ROLES = ["agency", "hospital", "gp", "care", "clinician"];
  const SEGMENTS = ["clinician", "supplier", "provider", "gp", "care", "device", "healthtech", "consultancy", "other"];
  const role = ROLES.includes(body.role) ? body.role : "";
  const segment = SEGMENTS.includes(body.segment) ? body.segment : "";
  // Strict on purpose: the address is shown on a page and in an email, so it
  // may contain only ordinary email characters (25 September security review).
  if (addr.length > 254 || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(addr)) return res.status(400).json({ error: "That email address does not look right." });
  if (!role) return res.status(400).json({ error: "Tell us which one you are." });

  try {
    const queue = await getQueue(admin);
    const already = queue.find((e) => e && e.email === addr);
    if (already) return res.status(200).json({ ok: true, duplicate: true, status: already.status || "pending" });

    const entry = { email: addr, role, segment, ts: new Date().toISOString(), status: "pending" };
    queue.push(entry);
    await kvWrite(admin, "shared", "qura_waitlist_v2", queue);

    // notify the founders, with one-tap decisions that work from a phone
    const to = owners();
    let notified = false;
    let notifyDetail = null;
    if (to.length) {
      const L = actionLinks(addr);
      const btn = (href, bg, fg, label) =>
        '<a href="' + href + '" style="background:' + bg + ";color:" + fg +
        ';font-weight:700;padding:13px 26px;border-radius:999px;text-decoration:none;display:inline-block;margin-right:10px">' + label + "</a>";
      const r = await sendMailEach(to, "Early access request: " + addr.replace(/[^a-z0-9@._%+-]/g, ""),
        '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6">' +
        "<p><strong>" + esc(addr) + "</strong> has asked for early access as a <strong>" + esc(role) + "</strong>.</p>" +
        '<p style="margin:22px 0">' + btn(L.approve, "#00C2B8", "#04231F", "Approve") + btn(L.deny, "#EEF1F7", "#0A1730", "Deny") + "</p>" +
        '<p style="font-size:13px;color:#5A6783">Approving creates their account, emails them a link to set a password, and puts them on the free plan as a ' +
        esc(role) + ". You can also do this in the founder panel under Early access.</p></div>");
      notified = r.ok;
      // Surface a partial failure instead of hiding it behind one boolean.
      // If a founder address is suppressed or bouncing, that is now visible in
      // the response and in the server log rather than silently swallowed.
      if (r.failed && r.failed.length) {
        console.error("[waitlist-join] " + r.failed.length + " of " + to.length +
          " founder notifications failed for " + addr + ": " +
          r.failed.map((f) => f.to).join(", "));
      }
      notifyDetail = { delivered: r.delivered.length, failed: r.failed.map((f) => f.to) };
    }

    return res.status(200).json({ ok: true, notified, notify: notifyDetail });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
