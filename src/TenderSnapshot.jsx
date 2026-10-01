// Tender Snapshot on the website (1 October 2026). Opens over the
// Opportunities page: the key commercial facts of a live tender as fixed
// fields, then "What you need to know" and "Points to consider before
// bidding". Fields the sources do not state say so. The rules and the AI
// call live in api/tender-snapshot.js.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

async function call(body) {
  let token = "";
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const r = await fetch("/api/tender-snapshot", { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || "Something went wrong. Please try again."); e.locked = Boolean(j.locked); throw e; }
  return j;
}

const ORDER = ["title", "buyer", "value", "term", "deadline", "service", "geography", "lots", "route", "eligibility", "volumes", "pricing", "evaluation", "conditions"];

function daysLeft(iso) {
  if (!iso) return "";
  const ms = Date.parse(iso) - Date.now();
  if (isNaN(ms)) return "";
  if (ms <= 0) return "Closed";
  const d = Math.floor(ms / 86400000);
  return d >= 1 ? d + (d === 1 ? " day left" : " days left") : Math.max(1, Math.floor(ms / 3600000)) + " hours left";
}

export default function TenderSnapshot({ id, onClose, onUpgrade }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let dead = false;
    call({ id }).then((j) => { if (!dead) setData(j); }).catch((e) => { if (!dead) { setErr(e.message); setLocked(e.locked); } });
    return () => { dead = true; };
  }, [id]);

  const openSource = () => { call({ id, action: "source" }).catch(() => {}); };
  const s = data && data.snapshot;
  const docs = data && data.sourcesRead ? data.sourcesRead.documents || [] : [];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,13,28,.55)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 720, width: "100%", padding: 0, overflow: "hidden" }}>
        <div className="row" style={{ justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Tender Snapshot</span>
            <span className="chip chip-cyan" style={{ fontSize: 10.5 }}>Qura AI</span>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: "6px 12px" }} onClick={onClose}>Close</button>
        </div>

        {err ? (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{err}</div>
            {locked && onUpgrade ? <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={onUpgrade}>See plans</button> : null}
          </div>
        ) : !s ? (
          <div style={{ padding: 24 }} className="muted">Reading the tender. The first Snapshot of a notice takes up to 30 seconds; after that it opens at once.</div>
        ) : (
          <div style={{ padding: 20 }}>
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
              {ORDER.map((k, i) => {
                const f = s.fields[k] || {};
                return (
                  <div key={k} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 180px) 1fr", gap: 12, padding: "10px 14px", borderTop: i ? "1px solid var(--line)" : "none", fontSize: 13.5 }}>
                    <div className="muted" style={{ fontWeight: 600 }}>{f.label || k}</div>
                    <div>
                      <span style={{ color: f.text ? "inherit" : "var(--faint, #8A96AD)" }}>{f.text || "Not stated in tender"}</span>
                      {k === "deadline" && s.deadlineISO ? <span className="chip" style={{ marginLeft: 8, fontSize: 11, background: "#FFF4E0", color: "#9A5E00" }}>{daysLeft(s.deadlineISO)}</span> : null}
                      {f.flag ? <div style={{ fontSize: 12, color: "#B4433A", marginTop: 3 }}>Check the full documents: {f.flag}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {s.overview ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>Qura AI: what you need to know</div>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>{s.overview}</div>
              </div>
            ) : null}
            {s.considerations && s.considerations.length ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>Points to consider before bidding</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>{s.considerations.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            ) : null}

            <div className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.55 }}>
              Made by Qura AI from the notice as published{data.source ? " on " + data.source : ""}
              {docs.length ? " and " + docs.length + " public tender document" + (docs.length === 1 ? "" : "s") : ". The tender documents are not publicly downloadable, so details only in them show as not stated"}.
              {" "}Qura does not advise whether to bid. The official notice is the definitive source.
              {data.freeLeft != null ? " " + data.freeLeft + " free Snapshot" + (data.freeLeft === 1 ? "" : "s") + " left." : ""}
            </div>
            {data.url ? (
              <a className="btn btn-primary" href={data.url} target="_blank" rel="noreferrer" onClick={openSource} style={{ marginTop: 14, display: "inline-block", textDecoration: "none", fontSize: 13.5 }}>
                View full tender on {data.source || "the official source"}
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
