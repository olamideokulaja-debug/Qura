import { kvGet } from "./_auth.js";
import { agencyAccount, esc } from "./_agency.js";
import { checkCardLink, checkPayLink, cardSetupSession, introPaySession } from "./_agencybill.js";

// Links in agency emails and buttons in "Your clinicians" (1 October 2026).
//
// GET /api/agency-pay?a=<agency id>&t=<sig>     save a card for introduction fees
// GET /api/agency-pay?i=<introduction id>&t=<sig>  pay for one introduction
// GET /api/agency-pay?done=card|paid|cancelled  where Stripe sends them back
//
// Each link makes a fresh Stripe page when opened, so an emailed link never
// expires the way a Stripe page does after 24 hours.

const page = (title, body, tone) =>
  '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Qura</title>' +
  '<div style="font-family:Inter,-apple-system,Arial,sans-serif;background:#050D1C;color:#EEF3FF;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px">' +
  '<div style="max-width:470px;text-align:center"><div style="font-size:26px;font-weight:700;color:' + tone + '">' + esc(title) + "</div>" +
  '<div style="margin-top:12px;font-size:15px;line-height:1.6;color:#9FB0D0">' + body + "</div>" +
  '<div style="margin-top:26px;font-size:13px;color:#5A6783">Qura · qurahealth.org</div></div></div>';

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const q = req.query || {};
  const html = (code, title, body, tone) => { res.setHeader("content-type", "text/html; charset=utf-8"); return res.status(code).send(page(title, body, tone)); };

  if (q.done === "card") return html(200, "Card saved", "Qura's introduction fee will now be charged to this card automatically whenever a hospital asks to meet one of your clinicians, and Stripe will email each receipt. You can close this page and go back to Qura.", "#00C2B8");
  if (q.done === "paid") return html(200, "Payment received", "Thank you. We are emailing you the organisation's details now, and Stripe will email your receipt. Your card is saved for future requests. You can close this page.", "#00C2B8");
  if (q.done === "cancelled") return html(200, "Nothing was charged", "You can use the same link again whenever you are ready.", "#9FB0D0");

  try {
    if (q.a) {
      const agencyId = String(q.a);
      if (!checkCardLink(agencyId, q.t)) return html(403, "Link not valid", "That link is not one we sent, or it has been changed.", "#F59E0B");
      const url = await cardSetupSession(agencyId, await agencyAccount(agencyId));
      res.setHeader("Location", url);
      return res.status(303).end();
    }
    if (q.i) {
      const introId = String(q.i);
      if (!checkPayLink(introId, q.t)) return html(403, "Link not valid", "That link is not one we sent, or it has been changed.", "#F59E0B");
      const queue = (await kvGet("shared", "intro_queue")) || [];
      const item = (Array.isArray(queue) ? queue : []).find((x) => x.id === introId);
      if (!item || !item.routedTo) return html(410, "No longer available", "We could not find this introduction request. Please email support@qurahealth.org.", "#9FB0D0");
      if (item.agencyFeeStatus === "paid") return html(200, "Already paid", "This introduction has been paid for and we have emailed you the details. Nothing more to do.", "#00C2B8");
      const url = await introPaySession(item.routedTo, await agencyAccount(item.routedTo), item, Number(item.agencyFee) || 99);
      res.setHeader("Location", url);
      return res.status(303).end();
    }
  } catch (e) {
    console.error("[agency-pay] " + (e && e.message));
    return html(500, "That did not work", "We could not open the payment page. Please try the link again in a minute, or email support@qurahealth.org.", "#F59E0B");
  }
  return html(400, "Link not valid", "That link is incomplete.", "#F59E0B");
}
