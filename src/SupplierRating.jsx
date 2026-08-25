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
import { quraRating, REVIEW_FLOOR } from "./supplierRating.js";
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

export default function SupplierRating({ supplier, canRate = false, isFounder = false, compact = false }) {
  const slug = slugify(supplier && supplier.name);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState(0);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

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
          {rating.earned.missing.map((m) => (
            <div key={m.label} className="row" style={{ gap: 9, padding: "6px 0", alignItems: "flex-start", opacity: 0.6 }}>
              <X size={15} color="var(--faint)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.label}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{m.why}</div>
              </div>
            </div>
          ))}

          {rating.reported.count && rating.reported.count < REVIEW_FLOOR ? (
            <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
              {rating.reported.count} provider rating so far. Provider ratings start counting
              towards the score at {REVIEW_FLOOR}, so that one opinion cannot move it.
            </div>
          ) : null}

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
            {["quraVerified", "framework", "cqc", "specialtiesEvidenced", "regionsCovered", "respondsFast", "compliancePack"].map((k) => (
              <button key={k} disabled={busy} onClick={() => setSignal(k, !signals[k])}
                className="chip" style={{
                  cursor: "pointer", border: "none", fontSize: 11.5, fontWeight: 600,
                  background: signals[k] ? "var(--cyan-soft)" : "#EEF1F7",
                  color: signals[k] ? "var(--teal)" : "#5A6783",
                }}>
                {signals[k] ? "\u2713 " : ""}{k}
              </button>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Only set a signal you have actually checked. Each one is shown to hospitals
            with the claim it represents.
          </div>
        </div>
      ) : null}
    </div>
  );
}
