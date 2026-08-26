// The supplier rating, as a hospital sees it.
//
// Deliberately not just stars. A number on its own is indistinguishable from an
// invented one, and the previous supplier data carried invented numbers. This
// always shows what the rating is based on, and expands to show exactly which
// signals were met and which were not.
//
// The same component covers both sides: a hospital sees the rating and can add
// their own; a founder sees the signals and can set them.

import React, { useState, useEffect, useCallback } from "react";
import { Star, ShieldCheck, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { quraRating, REVIEW_FLOOR, SIGNALS } from "./supplierRating.js";
import { supabase } from "./supabase.js";

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const authHeaders = async (json) => {
  let t = "";
  try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const h = t ? { Authorization: "Bearer " + t } : {};
  if (json) h["content-type"] = "application/json";
  return h;
};

export function Stars({ value, size = 15 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="row" style={{ gap: 1 }} aria-label={value + " out of 5"}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size}
          fill={i < full || (i === full && half) ? "#E8A33D" : "none"}
          color={i < full || (i === full && half) ? "#E8A33D" : "var(--line)"}
          strokeWidth={2} style={i === full && half ? { clipPath: "inset(0 50% 0 0)" } : undefined} />
      ))}
    </span>
  );
}

export default function SupplierRating({ supplier, canRate = false, isFounder = false, canClaim = false, compact = false }) {
  const slug = slugify(supplier && supplier.name);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState(0);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  // Which signal the supplier is submitting evidence for, and the evidence.
  const [claiming, setClaiming] = useState("");
  const [evidence, setEvidence] = useState("");

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const r = await fetch("/api/supplier-rating?supplier=" + encodeURIComponent(slug));
      if (r.ok) setData(await r.json());
    } catch (e) {}
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  if (!slug) return null;

  // Signals a founder has confirmed take precedence; the supplier record's own
  // flags are a fallback so existing framework/CQC data is not lost.
  const signals = {
    framework: Boolean(supplier.framework),
    cqc: Boolean(supplier.cqc),
    ...(data && data.signals ? data.signals : {}),
  };
  const rating = quraRating(signals, (data && data.reviews) || [], data && data.override);

  const submit = async () => {
    if (!mine) return;
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/supplier-rating", {
        method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ supplier: slug, stars: mine, note }),
      });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not save that rating.");
      else { setMsg(j.updated ? "Your rating has been updated." : "Thank you. Your rating has been recorded."); setNote(""); load(); }
    } catch (e) { setMsg("Could not reach Qura. Please try again."); }
    setBusy(false);
  };

  const submitClaim = async () => {
    if (!claiming) return;
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/supplier-rating", {
        method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ supplier: slug, supplierName: supplier.name,
                               claim: { signal: claiming, evidence } }),
      });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not submit that.");
      else {
        setMsg("Evidence sent to the Qura team. They will review it and your rating updates if it is accepted.");
        setClaiming(""); setEvidence(""); load();
      }
    } catch (e) { setMsg("Could not reach Qura. Please try again."); }
    setBusy(false);
  };

  const setSignal = async (k, v) => {
    setBusy(true);
    try {
      await fetch("/api/supplier-rating", {
        method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ supplier: slug, signals: { ...signals, [k]: v } }),
      });
      await load();
    } catch (e) {}
    setBusy(false);
  };

  if (compact) {
    return (
      <span className="row" style={{ gap: 6 }}>
        <Stars value={rating.stars} size={13} />
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{rating.stars.toFixed(1)}</span>
        <span className="faint" style={{ fontSize: 11.5 }}>{rating.label}</span>
      </span>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="row" style={{ gap: 9 }}>
            <Stars value={rating.stars} />
            <span style={{ fontWeight: 800, fontSize: 17 }}>{rating.stars.toFixed(1)}</span>
            <span className="chip" style={{
              fontSize: 11, fontWeight: 700,
              background: rating.basis === "founder" ? "var(--amber-bg)" : "var(--cyan-soft)",
              color: rating.basis === "founder" ? "var(--amber)" : "var(--teal)",
            }}>{rating.label}</span>
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 5, maxWidth: 460, lineHeight: 1.5 }}>
            {rating.explain}
          </div>
        </div>
        <button className="btn btn-light" style={{ fontSize: 13 }} onClick={() => setOpen((v) => !v)}>
          {open ? <><ChevronUp size={15} /> Hide detail</> : <><ChevronDown size={15} /> Why this rating</>}
        </button>
      </div>

      {open ? (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          {rating.earned.met.map((m) => (
            <div key={m.label} className="row" style={{ gap: 9, padding: "6px 0", alignItems: "flex-start" }}>
              <Check size={15} color="var(--ok)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.label}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{m.why}</div>
              </div>
              {isFounder ? (
                <button className="btn btn-ghost" style={{ fontSize: 11.5, marginLeft: "auto" }} disabled={busy}
                  onClick={() => setSignal(m.key, false)}>Remove</button>
              ) : null}
            </div>
          ))}
          {rating.earned.missing.map((m) => {
            const pending = ((data && data.pendingSignals) || []).includes(m.key);
            // Qura Verified is awarded, never requested, so no evidence button.
            const askable = canClaim && !pending && m.key !== "quraVerified";
            return (
              <div key={m.label} style={{ padding: "6px 0", opacity: pending ? 0.85 : 0.6 }}>
                <div className="row" style={{ gap: 9, alignItems: "flex-start" }}>
                  <X size={15} color="var(--faint)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.label}</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{m.why}</div>
                  </div>
                  {pending ? (
                    <span className="chip" style={{ marginLeft: "auto", fontSize: 11, background: "var(--amber-bg)", color: "var(--amber)" }}>With Qura</span>
                  ) : askable ? (
                    <button className="btn btn-light" style={{ fontSize: 11.5, marginLeft: "auto" }}
                      onClick={() => { setClaiming(m.key); setEvidence(""); setMsg(""); }}>Provide evidence</button>
                  ) : null}
                </div>
                {claiming === m.key ? (
                  <div style={{ marginTop: 8, marginLeft: 24, padding: 12, borderRadius: 10, background: "var(--bg)" }}>
                    <div className="muted" style={{ fontSize: 12.5, marginBottom: 7, lineHeight: 1.5 }}>
                      Describe the evidence, or paste a link to it. A member of the Qura team
                      checks it before anything changes on your rating.
                    </div>
                    <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={3}
                      placeholder="e.g. Framework: NHS Workforce Alliance, ref 12345, expires March 2028. Certificate at ..."
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13.5, boxSizing: "border-box", fontFamily: "inherit" }} />
                    <div className="row" style={{ gap: 8, marginTop: 8 }}>
                      <button className="btn btn-primary" style={{ fontSize: 12.5 }} disabled={busy || evidence.trim().length < 15}
                        onClick={submitClaim}>{busy ? "Sending..." : "Send for review"}</button>
                      <button className="btn btn-light" style={{ fontSize: 12.5 }} onClick={() => setClaiming("")}>Cancel</button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {rating.reported.count && rating.reported.count < REVIEW_FLOOR ? (
            <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
              {rating.reported.count} provider rating so far. Provider ratings start counting
              towards the score at {REVIEW_FLOOR}, so that one opinion cannot move it.
            </div>
          ) : null}

          {canClaim && msg ? <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>{msg}</div> : null}

          {rating.override ? (
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "var(--amber-bg)" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--amber)" }}>Qura assessment</div>
              <div style={{ fontSize: 13, marginTop: 3 }}>{rating.override.note}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {canRate ? (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 7 }}>Rate this supplier</div>
          <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}>
            Only rate a supplier you have actually worked with. One rating per organisation,
            and you can change it later.
          </div>
          <div className="row" style={{ gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setMine(n)} aria-label={n + " stars"}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <Star size={24} fill={n <= mine ? "#E8A33D" : "none"} color={n <= mine ? "#E8A33D" : "var(--line)"} />
              </button>
            ))}
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Anything a fellow provider should know (optional)"
            style={{ width: "100%", marginTop: 10, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13.5, boxSizing: "border-box" }} />
          <button className="btn btn-primary" style={{ marginTop: 10, fontSize: 13 }} disabled={!mine || busy} onClick={submit}>
            {busy ? "Saving..." : "Submit rating"}
          </button>
          {msg ? <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>{msg}</div> : null}
        </div>
      ) : null}

      {isFounder ? (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <ShieldCheck size={15} color="var(--teal)" />
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>Founder controls</span>
          </div>
          <div className="row" style={{ gap: 7, flexWrap: "wrap", marginTop: 9 }}>
            {SIGNALS.map((sig) => (
              <button key={sig.key} disabled={busy} onClick={() => setSignal(sig.key, !signals[sig.key])}
                title={sig.why}
                className="chip" style={{
                  cursor: "pointer", border: "none", fontSize: 11.5, fontWeight: 600,
                  background: signals[sig.key] ? "var(--cyan-soft)" : "#EEF1F7",
                  color: signals[sig.key] ? "var(--teal)" : "#5A6783",
                }}>
                {signals[sig.key] ? "\u2713 " : ""}{sig.label} <span style={{ opacity: .6 }}>+{sig.points}</span>
              </button>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Click a signal to turn it on or off. The number is what it adds to the
            rating. Only set what you have actually checked: each one is shown to
            hospitals as the claim it represents, and hovering shows that claim.
          </div>
        </div>
      ) : null}
    </div>
  );
}
