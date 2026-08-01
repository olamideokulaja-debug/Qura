import { getUser, kvGet, kvSet } from "./_auth.js";
import { limited } from "./_ratelimit.js";
import { alertFounders } from "./_alert.js";

// One message thread per introduction.
//
// The moment an introduction is made, the two sides currently vanish into
// email and Qura stops being the system of record. A thread keeps the
// relationship inside the product.
//
// Rules, and they are strict because private messaging carries obligations:
//   - Only the two parties to the introduction can read or write the thread:
//     the supplier who requested it and the clinician it concerns.
//   - Threads only exist on VERIFIED or COMPLETED introductions. No contact
//     before a founder has checked the registration; that is the promise.
//   - Either side can report the thread or block the other. Blocking freezes
//     the thread for both. Reports alert the founders immediately, which is
//     what the app stores require of any product with user-to-user messaging.

const MAX_LEN = 2000;
const MAX_MSGS = 500;

function threadKey(introId) { return "msgs_" + introId; }

async function findIntro(introId) {
  const queue = (await kvGet("shared", "intro_queue")) || [];
  return (Array.isArray(queue) ? queue : []).find((q) => q.id === introId) || null;
}

function partiesOf(intro) {
  const supplier = intro.supplier || null;
  const clinician = String(intro.clinicianId || "").startsWith("cl_")
    ? String(intro.clinicianId).slice(3)
    : null;
  return { supplier, clinician };
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  if (await limited(req, res, user, { bucket: "messages", limit: 240, windowSec: 3600 })) return;

  const introId = (req.method === "GET" ? (req.query || {}).introId : (req.body || {}).introId) || "";

  // No introId on a GET: list my threads, so each side has an inbox.
  if (!introId && req.method === "GET") {
    const queue = (await kvGet("shared", "intro_queue")) || [];
    const mine = (Array.isArray(queue) ? queue : []).filter((q) => {
      const { supplier, clinician } = partiesOf(q);
      const st = String(q.status || "").toLowerCase();
      return (user.id === supplier || user.id === clinician) && ["verified", "completed"].includes(st);
    });
    const threads = [];
    for (const q of mine) {
      const t = (await kvGet("shared", threadKey(q.id))) || { messages: [] };
      const last = (t.messages || [])[t.messages.length - 1] || null;
      threads.push({
        introId: q.id,
        with: user.id === q.supplier ? (q.handle || "Clinician") : (q.supplierEmail || "Supplier"),
        status: String(q.status || "").toLowerCase(),
        blocked: !!t.blockedBy,
        count: (t.messages || []).length,
        last: last ? { text: String(last.text).slice(0, 80), at: last.at } : null,
      });
    }
    return res.status(200).json({ threads });
  }
  if (!introId) return res.status(400).json({ error: "introId required" });

  const intro = await findIntro(introId);
  if (!intro) return res.status(404).json({ error: "Introduction not found" });

  const { supplier, clinician } = partiesOf(intro);
  const me = user.id === supplier ? "supplier" : user.id === clinician ? "clinician" : null;
  if (!me) return res.status(403).json({ error: "This thread belongs to its introduction's two parties only." });

  const status = String(intro.status || "").toLowerCase();
  if (!["verified", "completed"].includes(status)) {
    return res.status(409).json({ error: "Messaging opens once the introduction has been verified." });
  }

  const thread = (await kvGet("shared", threadKey(introId))) || { messages: [], blockedBy: null, reported: false };

  if (req.method === "GET") {
    return res.status(200).json({
      introId,
      you: me,
      blocked: !!thread.blockedBy,
      blockedByYou: thread.blockedBy === me,
      messages: (thread.messages || []).map((m) => ({ from: m.from, text: m.text, at: m.at })),
    });
  }

  if (req.method === "POST") {
    const { action, text } = req.body || {};

    if (action === "report") {
      thread.reported = true;
      await kvSet("shared", threadKey(introId), thread);
      await alertFounders("message-report",
        "A message thread was reported",
        "Introduction " + introId + " reported by the " + me + ". Review it in the admin introduction queue.");
      return res.status(200).json({ ok: true, reported: true });
    }

    if (action === "block") {
      thread.blockedBy = me;
      await kvSet("shared", threadKey(introId), thread);
      return res.status(200).json({ ok: true, blocked: true });
    }

    if (action === "unblock") {
      if (thread.blockedBy !== me) return res.status(403).json({ error: "Only the person who blocked can unblock." });
      thread.blockedBy = null;
      await kvSet("shared", threadKey(introId), thread);
      return res.status(200).json({ ok: true, blocked: false });
    }

    // plain send
    if (thread.blockedBy) return res.status(409).json({ error: "This thread is closed." });
    const body = String(text || "").trim();
    if (!body) return res.status(400).json({ error: "Message is empty" });
    if (body.length > MAX_LEN) return res.status(400).json({ error: "Keep messages under " + MAX_LEN + " characters." });
    if ((thread.messages || []).length >= MAX_MSGS) return res.status(409).json({ error: "This thread is full. Continue by email." });

    thread.messages = [...(thread.messages || []), { from: me, text: body, at: new Date().toISOString() }];
    const ok = await kvSet("shared", threadKey(introId), thread);
    if (!ok) return res.status(500).json({ error: "Could not send. Try again." });
    return res.status(200).json({ ok: true, count: thread.messages.length });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
