import { getUser, kvGet, kvSet } from "./_auth.js";
import { TRIAL_DAYS, trialActive, tierOf } from "./_entitlements.js";
import { bump } from "./_metrics.js";
import { orgVerified, orgCheckOf, ensurePending, emailFoundersOnce, startTrialFor } from "./_orgcheck.js";
import { joinedInTime } from "./_founding.js";

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
  if (req.method === "GET") {
    const chk = await orgCheckOf(user.id);
    return res.status(200).json({ ...state(trial), orgStatus: chk ? chk.status : null });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body || {};

  if (action === "start") {
    if (trial && typeof trial.start === "number") return res.status(200).json({ ...state(trial), already: true });
    // Clinicians are free already; the trial is for the paying side.
    const role = await kvGet(user.id, "qura_role");
    const account = (await kvGet(user.id, "account")) || {};
    // account is written only by the server; qura_role can be written from
    // the browser, so it can refuse a trial but never grant one.
    if (role === "clinician" || account.role === "clinician" || account.lens === "clinician") {
      return res.status(400).json({ error: "Clinician accounts are free and do not need a trial." });
    }
    // The organisation is checked by a founder first (27 September 2026). Until
    // then the account stays on the free plan and nothing starts; the founder's
    // confirmation starts the trial and emails the person.
    if (!(await orgVerified(user))) {
      const rec = await ensurePending(user.id);
      // Accounts from before the checks began were never in a sign-up alert,
      // so the founders are told about them directly, once.
      if (Date.now() - Date.parse(user.created_at || 0) > 86400000) {
        const m = user.user_metadata || {};
        try {
          await emailFoundersOnce(user.id, { email: user.email, name: m.full_name || [m.first_name, m.last_name].filter(Boolean).join(" "), company: m.company || "", phone: m.phone || "" });
        } catch (e) {}
      }
      return res.status(200).json({ ...state(null), pendingCheck: rec.status === "pending", orgStatus: rec.status,
        message: rec.status === "rejected"
          ? "We could not confirm your organisation. Reply to our email or write to support@qurahealth.org and we will look again."
          : joinedInTime(user)
            ? "You are in for the Founding Partner year: 12 months of our top plan, free. We check every organisation first, usually within 1 working day, and we will email you when it starts."
            : "We check every organisation before the free trial starts, usually within 1 working day. We will email you when it is on." });
    }
    const out = await startTrialFor(user.id);
    return res.status(200).json(state(out.trial));
  }

  if (action === "extend") {
    if (!trial || typeof trial.start !== "number") return res.status(400).json({ error: "There is no trial to extend." });
    const chk = await orgCheckOf(user.id);
    if (chk && chk.status === "rejected") return res.status(403).json({ ...state(trial), error: "We could not confirm your organisation, so the trial cannot be extended. Write to support@qurahealth.org and we will look again." });
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
