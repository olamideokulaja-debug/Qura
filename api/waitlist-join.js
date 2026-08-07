// The landing-page form posts here instead of writing to storage from the
// browser. Two reasons: the browser cannot send you a notification, and a
// shared kv row written from the browser can be overwritten by anyone who
// opens the console. This endpoint owns the queue.

import { adminClient, getQueue, kvWrite, sendMail, owners, actionLinks } from "./_waitlist.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only." });

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
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) return res.status(400).json({ error: "That email address does not look right." });
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
    if (to.length) {
      const L = actionLinks(addr);
      const btn = (href, bg, fg, label) =>
        '<a href="' + href + '" style="background:' + bg + ";color:" + fg +
        ';font-weight:700;padding:13px 26px;border-radius:999px;text-decoration:none;display:inline-block;margin-right:10px">' + label + "</a>";
      const r = await sendMail(to, "Early access request: " + addr,
        '<div style="font-family:Inter,Arial,sans-serif;color:#0A1730;line-height:1.6">' +
        "<p><strong>" + addr + "</strong> has asked for early access as a <strong>" + role + "</strong>.</p>" +
        '<p style="margin:22px 0">' + btn(L.approve, "#00C2B8", "#04231F", "Approve") + btn(L.deny, "#EEF1F7", "#0A1730", "Deny") + "</p>" +
        '<p style="font-size:13px;color:#5A6783">Approving creates their account, emails them a link to set a password, and puts them on the free plan as a ' +
        role + ". You can also do this in the founder panel under Early access.</p></div>");
      notified = r.ok;
    }

    return res.status(200).json({ ok: true, notified });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
