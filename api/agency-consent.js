import { kvListByKey, kvSet } from "./_auth.js";
import { getPool, savePool, agencyAccount, repFor, repOwner, isActive, checkConsent, normEmail, addMonths, ukDate, esc, REP_KEY, REP_MONTHS } from "./_agency.js";

// GET  /api/agency-consent?a&e&d&t   the link in the invitation email: shows a button
// POST /api/agency-consent?a&e&d&t   the button: records the clinician's answer
//
// A button rather than acting on the GET, because email security scanners open
// links on their own and would confirm on the clinician's behalf.

const page = (title, body, tone, extra) =>
  '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Qura</title>' +
  '<div style="font-family:Inter,-apple-system,Arial,sans-serif;background:#050D1C;color:#EEF3FF;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px">' +
  '<div style="max-width:470px;text-align:center"><div style="font-size:26px;font-weight:700;color:' + tone + '">' + esc(title) + "</div>" +
  '<div style="margin-top:12px;font-size:15px;line-height:1.6;color:#9FB0D0">' + body + "</div>" + (extra || "") +
  '<div style="margin-top:26px;font-size:13px;color:#5A6783">Qura · qurahealth.org</div></div></div>';

const button = (action, label, primary) =>
  '<form method="post" action="' + esc(action) + '" style="margin-top:22px"><button style="font:inherit;font-weight:700;font-size:15px;border:0;border-radius:999px;padding:12px 26px;cursor:pointer;background:' +
  (primary ? "#00C2B8;color:#04231F" : "#EEF1F7;color:#0A1730") + '">' + esc(label) + "</button></form>";
const link = (href, label) => '<div style="margin-top:22px"><a href="' + href + '" style="display:inline-block;font-weight:700;border-radius:999px;padding:12px 26px;background:#00C2B8;color:#04231F;text-decoration:none">' + esc(label) + "</a></div>";

export default async function handler(req, res) {
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const q = req.query || {};
  const agencyId = String(q.a || ""), entryId = String(q.e || "");
  const d = q.d === "confirm" ? "confirm" : q.d === "decline" ? "decline" : "";
  if (!agencyId || !entryId || !d || !checkConsent(agencyId, entryId, d, q.t)) {
    return res.status(403).send(page("Link not valid", "That link is not one we sent, or it has been changed.", "#F59E0B"));
  }
  const pool = await getPool(agencyId);
  const entry = pool.entries.find((x) => x.id === entryId);
  if (!entry || entry.status === "ended") {
    return res.status(410).send(page("No longer available", "This invitation has been withdrawn by the agency. Nothing is listed.", "#9FB0D0"));
  }
  const ag = await agencyAccount(agencyId);
  const name = esc(ag.name);

  if (req.method !== "POST") {
    const action = "/api/agency-consent?a=" + encodeURIComponent(agencyId) + "&e=" + encodeURIComponent(entryId) + "&d=" + d + "&t=" + encodeURIComponent(String(q.t));
    return res.status(200).send(d === "confirm"
      ? page("Confirm " + ag.name + " as your agency?", "They will represent you on Qura for " + REP_MONTHS + " months. Hospitals see your profile without your name or contact details, and requests to meet you go to " + name + ". You can end it at any time in the Qura app.", "#EEF3FF", button(action, "Yes, represent me", true))
      : page("Decline this invitation?", name + " will not represent you on Qura, and nothing is listed.", "#EEF3FF", button(action, "Yes, decline", false)));
  }

  const now = Date.now();
  if (d === "decline") {
    entry.status = "declined"; entry.declinedAt = new Date(now).toISOString();
    await savePool(agencyId, pool);
    return res.status(200).send(page("Declined", name + " will not represent you on Qura. Nothing has been listed.", "#9FB0D0"));
  }

  const rep = await repFor(entry.email);
  if (isActive(rep, now) && rep.agencyId !== agencyId) {
    return res.status(409).send(page("You already have an agency on Qura",
      esc(rep.agencyName) + " represents you until " + esc(ukDate(rep.until)) + ". To change agency, end that first in the Qura app (Home, then Your agency), then use this link again.", "#F59E0B"));
  }
  const until = new Date(addMonths(now, REP_MONTHS)).toISOString();
  const record = { agencyId, entryId, agencyName: ag.name, showName: pool.showName, confirmedAt: new Date(now).toISOString(), until, status: "active" };
  const ok = await kvSet(repOwner(entry.email), REP_KEY, record);
  if (!ok) return res.status(500).send(page("That did not save", "Please try the link again in a minute.", "#F59E0B"));
  entry.status = "confirmed"; entry.confirmedAt = record.confirmedAt; entry.until = until;
  await savePool(agencyId, pool);

  // Do they have a Qura profile yet? Matched by email.
  const profiles = await kvListByKey("clinician_profile");
  const has = profiles.some((p) => p.value && normEmail(p.value.email) === normEmail(entry.email));
  return res.status(200).send(page("Confirmed",
    name + " represents you on Qura until " + esc(ukDate(until)) + "." +
    (has ? " Your profile is already on Qura." : " Next, create your free Qura profile with this email address (" + esc(entry.email) + ") so hospitals can find you."),
    "#00C2B8", has ? link("https://www.qurahealth.org", "Open Qura") : link("https://www.qurahealth.org/?join=clinician", "Create my free profile")));
}
