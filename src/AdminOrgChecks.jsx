// Admin, New organisations: every business account and whether a founder has
// confirmed the organisation is real. Confirming starts the Founding Partner
// year (accounts created by 31 December 2026) or the 7-day trial, and
// emails the person; "Not confirmed" keeps them on the free plan and ends any
// trial already running. See api/_orgcheck.js.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const LABEL = { pending: "Waiting", "not asked": "Not asked yet", verified: "Confirmed", rejected: "Not confirmed" };
const TONE = {
  pending: { bg: "#FFF7E6", fg: "#8A5A00" }, "not asked": { bg: "#EEF1F7", fg: "#5A6783" },
  verified: { bg: "#E6F6F3", fg: "#06776F" }, rejected: { bg: "#FDECEA", fg: "#B4433A" },
};
const day = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

async function call(path, body) {
  let token = "";
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const r = await fetch(path, body
    ? { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify(body) }
    : { headers: { authorization: "Bearer " + token } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong.");
  return j;
}

export default function AdminOrgChecks() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("open");

  const load = async () => {
    try { setD(await call("/api/org-check?admin=1")); setErr(""); } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  const decide = async (a, decision) => {
    let note = "";
    if (decision === "reject") {
      note = window.prompt("Why is " + (a.company || a.email) + " not confirmed? Kept on the record, not sent to them." +
        (a.trial ? " Their running trial will end." : "") + (a.founding && a.founding.status === "active" ? " Their Founding Partner year will end." : ""), "");
      if (note === null) return;
    } else if (!window.confirm("Confirm " + (a.company || a.email) + " as a real organisation? Organisations that joined by 31 December 2026 start their free Founding Partner year now (later ones get the 7-day trial), and they are emailed.")) return;
    setBusy(a.id); setMsg("");
    try {
      const out = await call("/api/org-check", { userId: a.id, decision, note });
      setMsg(decision === "verify"
        ? (a.company || a.email) + " confirmed. " + (out.founding && out.founding.until ? "Founding Partner year started, free until " + new Date(out.founding.until).toLocaleDateString("en-GB") : (out.trialStarted ? "Trial started" : "Trial was already running")) + (out.emailed ? " and they have been emailed." : ".")
        : (a.company || a.email) + " marked not confirmed." + (out.trialEnded ? " Their trial has ended." : ""));
      await load();
    } catch (e) { setErr(e.message); }
    setBusy("");
  };

  if (err && !d) return <div className="card" style={{ padding: 20 }}>Could not load organisations: {err}</div>;
  if (!d) return <div className="card" style={{ padding: 20 }}>Loading organisations...</div>;
  const list = d.accounts.filter((a) => filter === "all" ? true : filter === "open" ? (a.status === "pending" || a.status === "not asked") : a.status === filter);

  return (
    <div>
      <div className="muted" style={{ fontSize: 13, marginBottom: 14, lineHeight: 1.55, maxWidth: 680 }}>
        Business accounts stay on the free plan, with contacts masked and no role posting, until you confirm the
        organisation. Check that the name exists, that the phone number or email domain belongs to it, and that
        it is a healthcare organisation in a market we serve. A personal email address deserves a closer look.
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {[["open", "To check"], ["verified", "Confirmed"], ["rejected", "Not confirmed"], ["all", "All"]].map(([k, l]) => (
          <button key={k} className={"btn " + (filter === k ? "btn-primary" : "btn-light")} style={{ fontSize: 13 }} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      {msg ? <div className="card" style={{ padding: 12, marginBottom: 12, background: "#E6F6F3", fontSize: 13.5 }}>{msg}</div> : null}
      {err ? <div className="card" style={{ padding: 12, marginBottom: 12, background: "#FDECEA", fontSize: 13.5 }}>{err}</div> : null}
      {!list.length ? <div className="muted">Nothing here.</div> : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {list.map((a) => {
            const q = encodeURIComponent([a.company, a.name].filter(Boolean).join(" "));
            const tone = TONE[a.status] || TONE["not asked"];
            return (
              <div key={a.id} style={{ padding: 16, borderBottom: "1px solid var(--line)" }}>
                <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{a.company || "Company not given"}</div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: tone.bg, color: tone.fg }}>{LABEL[a.status] || a.status}</span>
                  {a.trial ? <span className="muted" style={{ fontSize: 12 }}>trial started</span> : null}
                  {a.founding && a.founding.status === "active" ? <span className="muted" style={{ fontSize: 12, color: "var(--teal)" }}>Founding Partner to {new Date(a.founding.until).toLocaleDateString("en-GB")}</span> : null}
                </div>
                <div style={{ fontSize: 13.5, marginTop: 4 }}>
                  {a.name ? a.name + " · " : ""}<b>{a.email}</b>{a.personalEmail ? " (personal address)" : ""}{a.phone ? " · " + a.phone : ""}
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {a.role} · joined {day(a.joined)}
                  {a.decidedAt ? " · decided " + day(a.decidedAt) + (a.decidedBy ? " by " + a.decidedBy : "") : ""}
                  {a.note ? " · " + a.note : ""}
                </div>
                <div className="row" style={{ gap: 8, marginTop: 11, flexWrap: "wrap" }}>
                  <a className="btn btn-light" style={{ fontSize: 13 }} href={"https://www.google.com/search?q=" + q} target="_blank" rel="noopener noreferrer">Search the name</a>
                  {a.status !== "verified" ? (
                    <button className="btn btn-primary" style={{ fontSize: 13 }} disabled={busy === a.id} onClick={() => decide(a, "verify")}>
                      {busy === a.id ? "Saving..." : "Confirm organisation"}
                    </button>
                  ) : null}
                  {a.status !== "rejected" ? (
                    <button className="btn btn-light" style={{ fontSize: 13 }} disabled={busy === a.id} onClick={() => decide(a, "reject")}>Not confirmed</button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
