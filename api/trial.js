import { getUser, kvGet, kvSet } from "./_auth.js";
import { TRIAL_DAYS, trialActive, tierOf } from "./_entitlements.js";
import { bump } from "./_metrics.js";

// GET  /api/trial                    -> { trial, active, daysLeft }
// POST /api/trial { action: "start" }  -> starts the 7-day trial, once per account
// POST /api/trial { action: "extend" } -> adds 3 days, once per account
//
// The trial used to be written by the browser, so anyone could restart it, and
// the server treated "trial" as Growth for ever. It is now started and timed
// here, and the database stops the browser writing qura_trial or qura_plan.

const PAID = ["starter", "growth", "enterprise", "team", "intelligence", "network", "career"];

function state(trial) {
  if (!trial || typeof trial.start !== "number") return { trial: null, active: false, daysLeft: null };
  const days = TRIAL_DAYS + (Number(trial.extra) || 0);
  const left = Math.max(0, Math.ceil((trial.start + days * 86400000 - Date.now()) / 86400000));
  return { trial, active: trialActive(trial), daysLeft: left };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  const trial = await kvGet(user.id, "qura_trial");
  if (req.method === "GET") return res.status(200).json(state(trial));
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body || {};

  if (action === "start") {
    if (trial && typeof trial.start === "number") return res.status(200).json({ ...state(trial), already: true });
    // Clinicians are free already; the trial is for the paying side.
    const role = await kvGet(user.id, "qura_role");
    const account = (await kvGet(user.id, "account")) || {};
    if (role === "clinician" || account.role === "clinician") {
      return res.status(400).json({ error: "Clinician accounts are free and do not need a trial." });
    }
    const plan = await kvGet(user.id, "qura_plan");
    const next = { start: Date.now(), extra: 0, extended: false };
    await kvSet(user.id, "qura_trial", next);
    if (!PAID.includes(tierOf(plan))) await kvSet(user.id, "qura_plan", JSON.stringify("trial"));
    await bump("trial_started");
    return res.status(200).json(state(next));
  }

  if (action === "extend") {
    if (!trial || typeof trial.start !== "number") return res.status(400).json({ error: "There is no trial to extend." });
    if (trial.extended) return res.status(409).json({ ...state(trial), error: "Your trial has already been extended once." });
    const next = { ...trial, extra: (Number(trial.extra) || 0) + 3, extended: true };
    // An extension after the end restarts the clock from today, so the 3 days
    // are real days rather than days already gone.
    if (!trialActive(trial)) next.start = Date.now() - TRIAL_DAYS * 86400000;
    await kvSet(user.id, "qura_trial", next);
    const plan = await kvGet(user.id, "qura_plan");
    if (!PAID.includes(tierOf(plan))) await kvSet(user.id, "qura_plan", JSON.stringify("trial"));
    await bump("trial_extended");
    return res.status(200).json(state(next));
  }

  return res.status(400).json({ error: "Unknown action." });
}
