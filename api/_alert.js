import { kvGet, kvSet } from "./_auth.js";

// Alerting for the failures that would otherwise be silent.
//
// Several places in the API swallow errors on purpose, for good reasons: the
// Stripe webhook returns 200 even when our own processing fails, so Stripe does
// not retry forever. The cost of that is nobody finds out. This puts a message
// in your inbox instead.
//
// Deliberately email rather than a monitoring service: no new account, no new
// bill, and it lands somewhere you already look.

const FOUNDERS = ["olamideokulaja@qurahealth.org", "olafolawiyo@qurahealth.org"];
const ALERT_OWNER = "alerts";

// If something breaks it usually breaks repeatedly. Send at most a few messages
// an hour for any one kind of problem, so a bad hour does not bury your inbox.
const MAX_PER_HOUR = 4;

async function shouldSend(key) {
  try {
    const now = Date.now();
    const prev = (await kvGet(ALERT_OWNER, key)) || null;
    const startedAt = prev && typeof prev.startedAt === "number" ? prev.startedAt : 0;
    const count = prev && typeof prev.count === "number" ? prev.count : 0;
    if (!startedAt || now - startedAt > 3600000) {
      await kvSet(ALERT_OWNER, key, { startedAt: now, count: 1, updatedAt: new Date().toISOString() });
      return true;
    }
    if (count >= MAX_PER_HOUR) return false;
    await kvSet(ALERT_OWNER, key, { startedAt, count: count + 1, updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    return true;
  }
}

/**
 * Email the founders about a failure. Never throws, so an alert can never be the
 * thing that breaks a request.
 * kind: short stable name used for the hourly limit, e.g. "stripe-webhook".
 */
export async function alertFounders(kind, subject, details) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return;
    if (!(await shouldSend(kind))) return;

    const from = process.env.MAIL_FROM || "Qura <noreply@qurahealth.org>";
    const body =
      "A failure was detected in the Qura API.\n\n" +
      "What: " + subject + "\n" +
      "When: " + new Date().toISOString() + "\n\n" +
      "Details:\n" +
      (typeof details === "string" ? details : JSON.stringify(details, null, 2)) +
      "\n\nThis message is limited to " + MAX_PER_HOUR + " an hour for this kind of problem, " +
      "so there may be more occurrences than messages.";

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: FOUNDERS,
        subject: "Qura alert: " + subject,
        text: body,
      }),
    });
  } catch (e) {
    // An alert that fails must stay silent rather than cascade.
  }
}
