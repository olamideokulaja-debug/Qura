// One-tap decisions from the notification email. There is no session here, on
// purpose: the point is that it works from a phone the moment the email
// arrives. Access is controlled by an HMAC of the address and the decision,
// so a link only ever does the one thing it was minted for, and a request
// that has already been decided cannot be decided again.

import { adminClient, getQueue, kvWrite, verify, approve, deny } from "./_waitlist.js";

const page = (title, body, tone) =>
  '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<div style="font-family:Inter,-apple-system,Arial,sans-serif;background:#050D1C;color:#EEF3FF;' +
  'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px">' +
  '<div style="max-width:460px;text-align:center">' +
  '<div style="font-size:26px;font-weight:700;color:' + tone + '">' + title + "</div>" +
  '<div style="margin-top:12px;font-size:15px;line-height:1.6;color:#9FB0D0">' + body + "</div>" +
  '<div style="margin-top:26px;font-size:13px;color:#5A6783">Qura · Healthcare Growth CRM</div>' +
  "</div></div>";

export default async function handler(req, res) {
  const { e, d, t } = req.query || {};
  const addr = String(e || "").trim().toLowerCase();
  const decision = d === "approve" ? "approve" : d === "deny" ? "deny" : "";

  res.setHeader("content-type", "text/html; charset=utf-8");

  if (!addr || !decision || !verify(addr, decision, String(t || ""))) {
    return res.status(403).send(page("Link not valid", "That link is not one we issued, or it has been altered.", "#F59E0B"));
  }

  const admin = adminClient();
  if (!admin) return res.status(500).send(page("Not configured", "The server is missing its Supabase credentials.", "#F59E0B"));

  try {
    const queue = await getQueue(admin);
    const entry = queue.find((x) => x && x.email === addr);
    if (!entry) return res.status(404).send(page("Not found", "That request is no longer in the queue.", "#F59E0B"));

    if (entry.status && entry.status !== "pending") {
      return res.status(200).send(page(
        "Already " + entry.status,
        addr + " was " + entry.status + (entry.decidedAt ? " on " + String(entry.decidedAt).slice(0, 10) : "") + ". Nothing has changed.",
        "#9FB0D0"));
    }

    const out = decision === "approve" ? await approve(admin, entry, "email link") : deny(entry, "email link");
    if (!out.ok) return res.status(500).send(page("That did not work", out.error || "Unknown error.", "#F59E0B"));
    await kvWrite(admin, "shared", "qura_waitlist_v2", queue);

    if (decision === "deny") {
      return res.status(200).send(page("Denied", addr + " has been denied. They have not been emailed.", "#9FB0D0"));
    }
    return res.status(200).send(page(
      "Approved",
      out.emailed
        ? addr + " now has an account as a " + out.role + ", and a link to set their password is on its way to them."
        : addr + " now has an account as a " + out.role + ", but the email did not send. Open the founder panel to get the link.",
      "#00C2B8"));
  } catch (err) {
    return res.status(500).send(page("That did not work", String(err.message || err), "#F59E0B"));
  }
}
