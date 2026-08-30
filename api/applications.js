// Clinician application tracking.
//
// The rule this file exists to enforce:
//
//   Qura controls what Qura knows.
//   AI recommends and matches.
//   The employer makes employment decisions.
//
// So the status of an application only ever reflects something that actually
// happened. Qura can say an application was submitted, because it submitted it.
// It cannot say a clinician was shortlisted, because only the employer knows
// that — and at launch no employer is logging in to tell us.
//
// The match score is kept in a separate field for the same reason. "Strong
// match" is Qura's opinion of a profile against a vacancy. Letting it drift
// into the status column would mean telling a clinician an employer had acted
// when nobody had.

import { getUser, kvGet, kvSet } from "./_auth.js";

const KEY = "clinician_applications";

// Statuses Qura may set by itself, because each is a fact about Qura's own
// activity rather than a claim about the employer.
export const QURA_STATUSES = ["Applied", "Submitted to organisation", "Awaiting employer review"];

// Statuses that require genuine employer confirmation. Nothing automatic may
// ever write one of these, which is why they are checked against the caller
// rather than trusted from the request.
export const EMPLOYER_STATUSES = ["Viewed", "Under review", "Shortlisted", "Interview", "Offer", "Hired", "Not successful"];

const OWNERS = (process.env.OWNER_EMAILS || process.env.VITE_OWNER_EMAILS || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const isOwner = (u) => Boolean(u && u.email && OWNERS.includes(String(u.email).toLowerCase()));

const clean = (v, n) => String(v == null ? "" : v).trim().slice(0, n || 160);

// The timeline a clinician sees. Steps Qura owns are ticked from what it did;
// the employer step stays open until an employer actually says something.
export function timelineFor(app) {
  const s = app.status || "Applied";
  const employerActed = EMPLOYER_STATUSES.includes(s);
  return [
    { label: "Application submitted", done: true, at: app.at },
    { label: "Sent to organisation", done: Boolean(app.submittedAt), at: app.submittedAt },
    { label: "Awaiting employer review", done: Boolean(app.submittedAt), current: !employerActed },
    { label: employerActed ? s : "Employer response", done: employerActed, at: app.employerAt },
  ];
}

// What the clinician should do next, in plain words. Never implies the employer
// has done anything.
export function nextStepFor(app) {
  const s = app.status || "Applied";
  if (s === "Applied") return "Your application is being prepared for the organisation.";
  if (s === "Submitted to organisation") return "Sent. The organisation has it.";
  if (s === "Awaiting employer review") return "Waiting for the organisation to review your application.";
  if (s === "Not successful") return "This one did not go further. Your profile stays visible for other opportunities.";
  if (s === "Hired") return "Congratulations.";
  if (EMPLOYER_STATUSES.includes(s)) return "The organisation has been in touch. Check your messages.";
  return "";
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  const body = req.body || {};

  if (req.method === "GET") {
    const list = (await kvGet(user.id, KEY)) || [];
    const apps = (Array.isArray(list) ? list : []).map((a) => ({
      ...a,
      timeline: timelineFor(a),
      nextStep: nextStepFor(a),
      // Stated every time it is sent, so no screen can present the match as
      // though the employer had endorsed it.
      matchIsQuraOpinion: true,
    }));
    return res.status(200).json({ applications: apps });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const list = (await kvGet(user.id, KEY)) || [];
  const arr = Array.isArray(list) ? list : [];

  // ---- an employer or a founder records a genuine employer decision --------
  if (body.applicationId && body.employerStatus) {
    // Only a founder can do this today, because no employer is logged in to do
    // it themselves. When providers are managing applicants in Qura this opens
    // up to the employing organisation — and to nobody else, ever.
    if (!isOwner(user)) return res.status(403).json({ error: "Only the employing organisation can set this." });
    if (!EMPLOYER_STATUSES.includes(body.employerStatus)) {
      return res.status(400).json({ error: "Not an employer status." });
    }
    const owner = clean(body.owner, 60);
    if (!owner) return res.status(400).json({ error: "owner (the clinician's account id) is required." });
    const theirs = (await kvGet(owner, KEY)) || [];
    const theirList = Array.isArray(theirs) ? theirs : [];
    const app = theirList.find((a) => a.id === body.applicationId);
    if (!app) return res.status(404).json({ error: "No such application." });
    app.status = body.employerStatus;
    app.employerAt = new Date().toISOString();
    // Recorded so a clinician can always be told who said this and when.
    app.employerConfirmedBy = clean(body.confirmedBy, 140) || user.email;
    app.employerNote = clean(body.note, 400);
    await kvSet(owner, KEY, theirList);
    return res.status(200).json({ ok: true, application: app });
  }

  // ---- a clinician applies -------------------------------------------------
  const opportunityId = clean(body.opportunityId, 80);
  if (!opportunityId) return res.status(400).json({ error: "opportunityId required" });

  const existing = arr.find((a) => a.opportunityId === opportunityId);
  if (existing) return res.status(200).json({ applications: arr, already: true });

  const now = new Date().toISOString();
  const entry = {
    id: "app_" + Date.now(),
    opportunityId,
    role: clean(body.role, 160),
    employer: clean(body.employer, 160),
    at: now,
    // Applied and submitted happen in the same breath today, because Qura sends
    // it straight through. Both are recorded rather than assumed, so if that
    // ever changes the timeline stays truthful without a rewrite.
    submittedAt: now,
    status: "Awaiting employer review",
    // Qura's own assessment, stored beside the status and never merged into it.
    // A number here is what our matching thinks; it says nothing about what any
    // employer has decided.
    quraMatch: typeof body.quraMatch === "number" ? Math.max(0, Math.min(100, Math.round(body.quraMatch))) : null,
    quraMatchLabel: clean(body.quraMatchLabel, 40),
  };
  const next = [entry, ...arr];
  await kvSet(user.id, KEY, next);
  return res.status(200).json({ applications: next, created: entry });
}
