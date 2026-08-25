// Qura Academy — the learner-facing screen.
//
// Three states in one component: the course list, a lesson player, and the
// assessment. They share progress, so finishing a lesson updates the ring on
// the card behind you without a refetch.
//
// Nothing here knows an answer. Questions arrive from /api/academy already
// shuffled and are graded server-side, so the correct option is not present in
// the page at any point — including in React state or the network payload.

import React, { useState, useEffect, useCallback } from "react";
import { GraduationCap, Check, Lock, ArrowRight, ArrowLeft, Award, Share2, RefreshCw, AlertCircle } from "lucide-react";
import { ACADEMY_COURSES } from "./data/academy.js";
import { supabase } from "./supabase.js";
import Certificate from "./Certificate.jsx";

const authHeaders = async (json) => {
  let t = "";
  try {
    const { data } = await supabase.auth.getSession();
    t = (data && data.session && data.session.access_token) || "";
  } catch (e) {}
  const h = t ? { Authorization: "Bearer " + t } : {};
  if (json) h["content-type"] = "application/json";
  return h;
};

// Lesson ids come from the content itself now (QE-L01 and so on), so
// progress survives any reordering of the curriculum.


function Ring({ pct, size = 44, accent }) {
  const r = size / 2 - 4, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={accent} strokeWidth="4"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round"
        transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 11, fontWeight: 700, fill: "var(--text)" }}>{Math.round(pct)}</text>
    </svg>
  );
}

export default function Academy({ role, onToast }) {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);      // course being studied
  const [lesson, setLesson] = useState(null);  // index into course.lessons
  const [quiz, setQuiz] = useState(null);      // { questions, passMark }
  const [answers, setAnswers] = useState({});
  const [qi, setQi] = useState(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // The issued certificate, fetched only once a course is passed.
  const [cert, setCert] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/academy", { headers: await authHeaders(false) });
      if (r.ok) { const j = await r.json(); setProgress(j.progress || {}); }
    } catch (e) {}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // Courses are filtered to the lens the member signed in as. Showing a
  // clinician the supplier commercial course would just be noise.
  const mine = ACADEMY_COURSES.filter((c) => !role || c.lenses.includes(role));
  const others = ACADEMY_COURSES.filter((c) => role && !c.lenses.includes(role));

  const lessonsOf = (c) => c.lessons.length;
  const doneOf = (c) => {
    const p = progress[c.id];
    if (!p || !p.lessons) return 0;
    return Object.keys(p.lessons).length;
  };
  const pctOf = (c) => {
    const t = lessonsOf(c);
    return t ? Math.min(100, (doneOf(c) / t) * 100) : 0;
  };

  const markLesson = async (c, id) => {
    setProgress((p) => ({ ...p, [c.id]: { ...(p[c.id] || {}), lessons: { ...((p[c.id] || {}).lessons || {}), [id]: true } } }));
    try {
      await fetch("/api/academy", { method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ course: c.id, action: "lesson", lesson: id }) });
    } catch (e) {}
  };

  const startQuiz = async (c) => {
    setBusy(true); setErr(""); setResult(null);
    try {
      const r = await fetch("/api/academy", { method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ course: c.id, action: "start" }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Could not start the assessment."); setBusy(false); return; }
      setQuiz({ course: c, questions: j.questions, passMark: j.passMark });
      setAnswers({}); setQi(0);
    } catch (e) { setErr("Could not reach Qura. Nothing has been lost."); }
    setBusy(false);
  };

  const submitQuiz = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/academy", { method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ course: quiz.course.id, action: "submit", answers }) });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Could not submit."); setBusy(false); return; }
      setResult({ ...j, course: quiz.course });
      setQuiz(null);
      load();
      if (j.passed) {
        try {
          const cr = await fetch("/api/certificate?course=" + quiz.course.id, { headers: await authHeaders(false) });
          if (cr.ok) setCert(await cr.json());
        } catch (e) {}
      }
    } catch (e) { setErr("Could not submit. Your answers are still on screen."); }
    setBusy(false);
  };

  // ------------------------------------------------------------ result
  if (result) {
    const c = result.course;
    return (
      <div className="wrap" style={{ maxWidth: 720, padding: "28px 24px 60px" }}>
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{
            width: 92, height: 92, borderRadius: 999, margin: "0 auto 18px", display: "grid", placeItems: "center",
            background: result.passed ? c.accent + "1F" : "var(--amber-bg)",
            border: "2px solid " + (result.passed ? c.accent : "var(--amber)"),
          }}>
            {result.passed ? <Award size={40} color={c.accent} /> : <AlertCircle size={38} color="var(--amber)" />}
          </div>
          <h2 className="disp" style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
            {result.passed ? "Passed" : "Not this time"}
          </h2>
          <div className="muted" style={{ marginTop: 8, fontSize: 15 }}>
            {result.correct} of {result.of} correct — {result.score}%, pass mark {result.passMark}%
          </div>

          {result.passed ? (
            <>
              <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: "var(--bg)", display: "inline-block" }}>
                <div className="faint" style={{ fontSize: 11.5, letterSpacing: ".08em", fontWeight: 700 }}>CREDENTIAL ID</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4, letterSpacing: ".04em" }}>{result.credentialId}</div>
              </div>
              {cert ? (
                <div style={{ marginTop: 26 }}>
                  <Certificate cert={cert} />
                </div>
              ) : (
                <div className="muted" style={{ fontSize: 13, marginTop: 18 }}>Preparing your certificate...</div>
              )}
              <div className="row" style={{ gap: 10, justifyContent: "center", marginTop: 18 }}>
                <button className="btn btn-light" onClick={() => { setResult(null); setCert(null); setOpen(null); }}>Back to Academy</button>
              </div>
            </>
          ) : (
            <>
              {/* The blueprint asks for module-level weaknesses and a route back
                  to the lessons behind them, rather than a bare score. */}
              <div style={{ marginTop: 22, textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Worth revisiting</div>
                {result.review.filter((x) => !x.correct).slice(0, 5).map((x) => (
                  <div key={x.id} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg)", marginBottom: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{x.q}</div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{x.rationale}</div>
                  </div>
                ))}
              </div>
              {result.cooloffSuggested ? (
                <div className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
                  Two attempts in a row. We suggest coming back tomorrow rather than straight away.
                </div>
              ) : null}
              <div className="row" style={{ gap: 10, justifyContent: "center", marginTop: 20 }}>
                {result.retakeAllowed ? (
                  <button className="btn btn-primary" onClick={() => startQuiz(c)}><RefreshCw size={16} /> Try again</button>
                ) : (
                  <span className="muted" style={{ fontSize: 13 }}>This qualification allows one attempt.</span>
                )}
                <button className="btn btn-light" onClick={() => { setResult(null); setOpen(null); }}>Back to Academy</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------- quiz
  if (quiz) {
    const q = quiz.questions[qi];
    const answered = Object.keys(answers).length;
    return (
      <div className="wrap" style={{ maxWidth: 720, padding: "28px 24px 60px" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <span className="faint" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".07em" }}>
            {quiz.course.name.toUpperCase()}
          </span>
          <span className="muted" style={{ fontSize: 13 }}>Question {qi + 1} of {quiz.questions.length}</span>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: "var(--line)", marginBottom: 22 }}>
          <div style={{ height: 4, borderRadius: 999, width: ((qi + 1) / quiz.questions.length) * 100 + "%", background: quiz.course.accent, transition: "width .25s" }} />
        </div>

        <div className="card" style={{ padding: 26 }}>
          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.45 }}>{q.q}</div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 9 }}>
            {q.options.map((o) => {
              const picked = answers[q.id] === o.value;
              return (
                <button key={o.value} onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                  style={{
                    textAlign: "left", padding: "13px 15px", borderRadius: 11, cursor: "pointer",
                    border: "1.5px solid " + (picked ? quiz.course.accent : "var(--line)"),
                    background: picked ? quiz.course.accent + "12" : "var(--card)",
                    fontSize: 14.5, lineHeight: 1.45,
                  }}>
                  <b style={{ marginRight: 9, color: picked ? quiz.course.accent : "var(--faint)" }}>{o.value}</b>
                  {o.text}
                </button>
              );
            })}
          </div>
        </div>

        <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
          <button className="btn btn-light" disabled={qi === 0} onClick={() => setQi((n) => n - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
          {qi < quiz.questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setQi((n) => n + 1)}>Next <ArrowRight size={16} /></button>
          ) : (
            <button className="btn btn-primary" disabled={busy || answered < quiz.questions.length}
              onClick={submitQuiz}>
              {busy ? "Marking..." : answered < quiz.questions.length
                ? (quiz.questions.length - answered) + " left" : "Submit assessment"}
            </button>
          )}
        </div>
        {err ? <div style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{err}</div> : null}
      </div>
    );
  }

  // ----------------------------------------------------------- lesson
  if (open && lesson !== null) {
    const c = open, L = c.lessons[lesson];
    const done = ((progress[c.id] || {}).lessons || {})[L.id];
    const last = lesson === c.lessons.length - 1;
    const next = () => {
      markLesson(c, L.id);
      if (!last) setLesson(lesson + 1); else setLesson(null);
    };
    // The seven parts of a lesson, in the order the blueprint sets out. Kept as
    // data so a lesson is never half-rendered when a field is missing.
    const parts = [
      ["Core principle", L.principle],
      ["What this means", L.explanation],
      ["Why it matters", L.why],
      ["How to apply it", L.apply],
      ["In practice", L.example],
      ["Common mistake", L.mistake],
    ].filter(([, v]) => v);
    return (
      <div className="wrap" style={{ maxWidth: 720, padding: "28px 24px 60px" }}>
        <button className="btn btn-light" style={{ marginBottom: 16 }} onClick={() => setLesson(null)}>
          <ArrowLeft size={16} /> {c.name}
        </button>
        <div className="faint" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em" }}>
          {L.id} · LESSON {lesson + 1} OF {c.lessons.length}
        </div>
        <h2 className="disp" style={{ fontSize: 26, fontWeight: 700, margin: "10px 0 20px", lineHeight: 1.25 }}>
          {L.title}
        </h2>

        {parts.map(([label, text], n) => (
          <div key={label} className="card" style={{
            padding: 20, marginBottom: 12,
            borderLeft: n === 0 ? "3px solid " + c.accent : undefined,
            background: label === "Common mistake" ? "var(--amber-bg)" : undefined,
          }}>
            <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em" }}>
              {label.toUpperCase()}
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.68, margin: "7px 0 0", color: "var(--text)" }}>{text}</p>
          </div>
        ))}

        {L.takeaway ? (
          <div className="card" style={{ padding: 20, background: c.accent + "0F", borderColor: c.accent }}>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>{L.takeaway}</p>
          </div>
        ) : null}

        <div className="row" style={{ justifyContent: "space-between", marginTop: 24, gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-light" disabled={lesson === 0} onClick={() => setLesson(lesson - 1)}>
            <ArrowLeft size={16} /> Previous
          </button>
          <span className="muted" style={{ fontSize: 13 }}>{done ? "Completed" : ""}</span>
          <button className="btn btn-primary" onClick={next}>
            {last ? "Mark complete and finish" : "Mark complete and continue"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------- course page
  if (open) {
    const c = open, p = progress[c.id] || {};
    const total = lessonsOf(c), done = doneOf(c);
    const ready = done >= total;
    return (
      <div className="wrap" style={{ maxWidth: 820, padding: "28px 24px 60px" }}>
        <button className="btn btn-light" style={{ marginBottom: 16 }} onClick={() => setOpen(null)}>
          <ArrowLeft size={16} /> Academy
        </button>
        <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <span className="chip" style={{ background: c.accent + "18", color: c.accent, fontWeight: 700, fontSize: 11.5 }}>{c.tag}</span>
            <h1 className="disp" style={{ fontSize: 28, fontWeight: 700, margin: "12px 0 6px" }}>{c.name}</h1>
            <p className="muted" style={{ fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 560 }}>{c.blurb}</p>
          </div>
          <Ring pct={pctOf(c)} size={58} accent={c.accent} />
        </div>

        {p.passedAt ? (
          <div className="card" style={{ padding: 16, marginTop: 20, borderColor: c.accent }}>
            <div className="row" style={{ gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
              <div className="row" style={{ gap: 10 }}>
                <Award size={20} color={c.accent} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Credential earned</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{p.credentialId}</div>
                </div>
              </div>
              <button className="btn btn-light" style={{ fontSize: 13 }} onClick={async () => {
                try {
                  const r = await fetch("/api/certificate?course=" + c.id, { headers: await authHeaders(false) });
                  if (r.ok) { setCert(await r.json()); setResult({ passed: true, course: c, score: p.lastScore, correct: 0, of: 0, passMark: c.passMark, credentialId: p.credentialId, review: [] }); }
                } catch (e) {}
              }}>View certificate</button>
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 24 }}>
          <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", marginBottom: 10 }}>
            CURRICULUM · {c.lessons.length} LESSONS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {c.lessons.map((L, li) => {
              const isDone = Boolean((p.lessons || {})[L.id]);
              return (
                <button key={L.id} onClick={() => setLesson(li)} className="row"
                  style={{
                    gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                    border: "1px solid " + (isDone ? c.accent + "55" : "var(--line)"),
                    background: isDone ? c.accent + "0D" : "var(--card)",
                  }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 999, flexShrink: 0, display: "grid", placeItems: "center",
                    background: isDone ? c.accent : "var(--line)",
                  }}>{isDone ? <Check size={13} color="#fff" /> : null}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, display: "block" }}>{L.title}</span>
                    <span className="faint" style={{ fontSize: 12 }}>{L.id}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginTop: 8 }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Final assessment</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                {c.questionsAsked} questions · {c.passMark}% to pass ·{" "}
                {c.unlimitedRetakes ? "unlimited retakes" : "one attempt"}
              </div>
            </div>
            <button className="btn btn-primary" disabled={!ready || busy || Boolean(p.passedAt)}
              onClick={() => startQuiz(c)}
              title={ready ? "" : "Complete every lesson first"}>
              {p.passedAt ? "Passed" : ready ? "Start assessment" : <><Lock size={15} /> Complete the lessons first</>}
            </button>
          </div>
          {err ? <div style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{err}</div> : null}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------- overview
  const Card = ({ c, dim }) => {
    const p = progress[c.id] || {};
    return (
      <button onClick={() => !dim && setOpen(c)} className="card lift"
        style={{
          padding: 20, textAlign: "left", cursor: dim ? "default" : "pointer", width: "100%",
          opacity: dim ? 0.55 : 1, borderTop: "3px solid " + c.accent,
        }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <span className="chip" style={{ background: c.accent + "18", color: c.accent, fontWeight: 700, fontSize: 11 }}>{c.tag}</span>
              {c.flagship ? <span className="chip" style={{ background: "#B8893B18", color: "#8A6520", fontWeight: 700, fontSize: 11 }}>Flagship</span> : null}
              {p.passedAt ? <span className="chip chip-cyan" style={{ fontSize: 11 }}><Check size={11} /> Earned</span> : null}
            </div>
            <div className="disp" style={{ fontSize: 19, fontWeight: 700, marginTop: 10 }}>{c.name}</div>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 5, lineHeight: 1.55 }}>{c.blurb}</div>
            <div className="faint" style={{ fontSize: 12.5, marginTop: 9 }}>
              {lessonsOf(c)} lessons · {c.questionsAsked}-question assessment · {c.passMark}% to pass
            </div>
          </div>
          <Ring pct={pctOf(c)} accent={c.accent} />
        </div>
      </button>
    );
  };

  return (
    <div className="wrap" style={{ maxWidth: 900, padding: "28px 24px 60px" }}>
      <div className="row" style={{ gap: 10, marginBottom: 6 }}>
        <GraduationCap size={22} color="var(--teal)" />
        <h1 className="disp" style={{ fontSize: 27, fontWeight: 700, margin: 0 }}>Qura Academy</h1>
      </div>
      <p className="muted" style={{ fontSize: 15, margin: "0 0 22px", maxWidth: 600 }}>
        Learn the market. Use the intelligence. Make better healthcare connections.
      </p>

      {loading ? <div className="muted">Loading your progress...</div> : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mine.map((c) => <Card key={c.id} c={c} />)}
          </div>
          {others.length ? (
            <>
              <div className="faint" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", margin: "28px 0 10px" }}>
                OTHER PATHWAYS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {others.map((c) => <Card key={c.id} c={c} dim />)}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
