import { getUser, kvGet, kvSet } from "./_auth.js";
import { BANK } from "./_academy_bank.js";

// Qura Academy.
//
// The whole point of a credential is that it cannot be faked, so three rules
// shape this file:
//
//   1. Answer keys never leave the server. The browser gets questions and
//      options; grading happens here.
//   2. Option order is randomised per attempt, and the shuffle is stored with
//      the attempt so a submitted answer can be mapped back to the real option.
//   3. The credential ID is minted here, on a pass, and cannot be requested.
//
// Progress is per user, per course, under kv key "academy_<courseId>".

const COURSE_RULES = {
  "essentials":          { ask: 10, pass: 80, retakes: true },
  "career-ready":        { ask: 10, pass: 80, retakes: true },
  "provider-certified":  { ask: 10, pass: 80, retakes: true },
  "supplier-certified":  { ask: 10, pass: 80, retakes: true },
  // The flagship is one attempt at all 30. Deliberately harder: a qualification
  // people can retake until they guess it right is not a qualification.
  "qbd":                 { ask: 30, pass: 80, retakes: false },
};

const keyFor = (courseId) => "academy_" + courseId;

function shuffle(arr, seed) {
  // Deterministic given a seed, so an attempt can be rebuilt for grading
  // without storing the whole question list twice.
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function credentialId(courseId, userId) {
  const stamp = Date.now().toString(36).toUpperCase();
  const who = String(userId || "").replace(/-/g, "").slice(0, 4).toUpperCase();
  return "QA-" + courseId.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) + "-" + who + "-" + stamp.slice(-5);
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  const courseId = String((req.query && req.query.course) || (req.body && req.body.course) || "");
  const rules = COURSE_RULES[courseId];

  // ---- progress for every course -------------------------------------
  if (req.method === "GET" && !courseId) {
    const out = {};
    for (const id of Object.keys(COURSE_RULES)) {
      const p = await kvGet(user.id, keyFor(id));
      out[id] = p && typeof p === "object" ? { ...p, attempt: undefined } : null;
    }
    return res.status(200).json({ progress: out });
  }

  if (!rules) return res.status(400).json({ error: "Unknown course." });

  if (req.method === "GET") {
    const p = (await kvGet(user.id, keyFor(courseId))) || {};
    return res.status(200).json({ progress: { ...p, attempt: undefined } });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "GET or POST only." });

  const body = req.body || {};
  const prog = (await kvGet(user.id, keyFor(courseId))) || { lessons: {}, attempts: 0 };

  // ---- mark a lesson complete ----------------------------------------
  if (body.action === "lesson") {
    const id = String(body.lesson || "").slice(0, 80);
    if (!id) return res.status(400).json({ error: "lesson is required." });
    prog.lessons = prog.lessons || {};
    prog.lessons[id] = new Date().toISOString();
    prog.updatedAt = new Date().toISOString();
    await kvSet(user.id, keyFor(courseId), prog);
    return res.status(200).json({ ok: true, lessons: Object.keys(prog.lessons).length });
  }

  // ---- start an attempt ----------------------------------------------
  if (body.action === "start") {
    if (prog.passedAt) return res.status(400).json({ error: "Already passed." });
    if (!rules.retakes && (prog.attempts || 0) >= 1) {
      return res.status(400).json({ error: "This qualification allows one attempt." });
    }
    const pool = BANK.filter((q) => q.course === courseId);
    if (pool.length < rules.ask) {
      return res.status(500).json({ error: "Question bank incomplete for this course." });
    }
    const seed = Date.now() % 2147483647;
    const picked = shuffle(pool, seed).slice(0, rules.ask);

    // Store only what grading needs: the question ids in order, and the option
    // order shown. Never the keys — they stay in BANK.
    const attempt = {
      startedAt: new Date().toISOString(),
      seed,
      questions: picked.map((q, i) => {
        const letters = shuffle(["A", "B", "C", "D"], seed + i + 1);
        return { id: q.id, order: letters };
      }),
    };
    prog.attempt = attempt;
    prog.attempts = (prog.attempts || 0) + 1;
    await kvSet(user.id, keyFor(courseId), prog);

    return res.status(200).json({
      attemptStartedAt: attempt.startedAt,
      passMark: rules.pass,
      questions: picked.map((q, i) => ({
        id: q.id,
        q: q.q,
        // Options relabelled in the shuffled order. The browser sees A-D with
        // no way to tell which was the original key.
        options: attempt.questions[i].order.map((orig, n) => ({
          value: "ABCD"[n],
          text: q.options[orig],
        })),
      })),
    });
  }

  // ---- submit an attempt ----------------------------------------------
  if (body.action === "submit") {
    const attempt = prog.attempt;
    if (!attempt) return res.status(400).json({ error: "No attempt in progress." });
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

    let correct = 0;
    const weakModules = {};
    const review = [];
    for (let i = 0; i < attempt.questions.length; i++) {
      const a = attempt.questions[i];
      const q = BANK.find((x) => x.id === a.id);
      if (!q) continue;
      // Map the shown letter back to the original option letter.
      const shown = String(answers[a.id] || "");
      const idx = "ABCD".indexOf(shown);
      const chosenOriginal = idx >= 0 ? a.order[idx] : null;
      const right = chosenOriginal === q.key;
      if (right) correct++;
      else {
        const mod = (q.id.match(/-q(\d+)$/) || [])[1];
        if (mod) weakModules[mod] = (weakModules[mod] || 0) + 1;
      }
      // Rationales are released only now, with the result — never before.
      review.push({ id: q.id, q: q.q, correct: right, rationale: q.rationale });
    }

    const score = Math.round((correct / attempt.questions.length) * 100);
    const passed = score >= rules.pass;

    prog.attempt = undefined;
    prog.lastScore = score;
    prog.lastAttemptAt = new Date().toISOString();
    if (passed && !prog.passedAt) {
      prog.passedAt = prog.lastAttemptAt;
      prog.credentialId = credentialId(courseId, user.id);
    }
    // Two failures in a row earns a cooling-off, per the blueprint. Advisory,
    // not enforced, so nobody is locked out of a course they have paid for.
    prog.consecutiveFails = passed ? 0 : (prog.consecutiveFails || 0) + 1;
    await kvSet(user.id, keyFor(courseId), prog);

    return res.status(200).json({
      score, passed, correct, of: attempt.questions.length,
      passMark: rules.pass,
      credentialId: prog.credentialId || null,
      cooloffSuggested: !passed && prog.consecutiveFails >= 2,
      attemptsUsed: prog.attempts,
      retakeAllowed: rules.retakes && !passed,
      review,
    });
  }

  return res.status(400).json({ error: "Unknown action." });
}
