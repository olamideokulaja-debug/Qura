// Roles a clinician opened on NHS Jobs or another site (10 October 2026).
//
// Qura records the open. Everything after that is what the clinician tells us,
// and every status here says so, because no employer has confirmed any of it.
// A question card appears about 2 days after the open ("Did you apply?") and
// again later for interview, offer and start.

import React, { useState, useEffect, useCallback } from "react";
import { ExternalLink, HelpCircle, Bell, BellOff, Trash2 } from "lucide-react";
import { supabase } from "./supabase.js";

const authHeaders = async () => {
  let t = "";
  try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  return t ? { Authorization: "Bearer " + t } : {};
};
const day = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };

const SET_OPTIONS = [
  ["opened", "Opened the advert"], ["applied", "Applied"], ["interview", "Interview"], ["offer", "Offer"],
  ["started", "Started"], ["not_successful", "Not successful"], ["not_applying", "Not applying"],
];
const TONE = {
  opened: ["#EEF1F7", "#5A6783"], applied: ["#E8EEFF", "#2F4FB5"], interview: ["#FFF7E6", "#8A5A00"], offer: ["#E6F6F3", "#06776F"],
  started: ["#DDF5EC", "#0B6B45"], not_successful: ["#FDECEA", "#B4433A"], not_applying: ["#F2F2F2", "#6B6B6B"],
};

export default function ExternalTracker({ onCount }) {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/tracking", { headers: await authHeaders() });
      const j = r.ok ? await r.json() : { items: [], reminders: true };
      setD(j); if (onCount) onCount((j.items || []).length);
    } catch (e) { setD({ items: [], reminders: true }); }
  }, [onCount]);
  useEffect(() => { load(); }, [load]);

  const act = async (body) => {
    setBusy(body.id || body.action); setErr("");
    try {
      const r = await fetch("/api/tracking", { method: "POST", headers: { ...(await authHeaders()), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "That did not save.");
      if (body.action === "reminders") setD({ ...d, reminders: j.reminders });
      else if (j.deleted) { const items = d.items.filter((x) => x.id !== body.id); setD({ ...d, items }); if (onCount) onCount(items.length); }
      else if (j.item) setD({ ...d, items: d.items.map((x) => (x.id === j.item.id ? j.item : x)) });
      setEdit("");
    } catch (e) { setErr(e.message); }
    setBusy("");
  };

  if (!d || !(d.items || []).length) return null;
  const items = d.items;
  const asking = items.filter((x) => x.question);

  return (
    <div style={{ marginBottom: 22 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Roles you opened on other sites</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2, maxWidth: 640, lineHeight: 1.55 }}>
            NHS Jobs and other sites do not tell Qura what happens next, so these steps are what you tell us. They are for your own tracker and are never shared with the employer.
          </div>
        </div>
        <button className="btn btn-light" style={{ fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }} disabled={busy === "reminders"}
          onClick={() => act({ action: "reminders", on: !d.reminders })}>
          {d.reminders ? <Bell size={14} /> : <BellOff size={14} />} Reminders {d.reminders ? "on" : "off"}
        </button>
      </div>
      {err ? <div style={{ color: "#B4433A", fontSize: 13, marginBottom: 8 }}>{err}</div> : null}

      {asking.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          {asking.map((x) => (
            <div key={"q" + x.id} className="card" style={{ padding: 16, borderLeft: "4px solid var(--teal)", background: "var(--cyan-soft)" }}>
              <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                <HelpCircle size={18} color="var(--teal)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{x.question.text}</div>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {x.question.options.map((o) => (
                      <button key={o.a} className="btn btn-primary" style={{ fontSize: 13, padding: "8px 14px" }} disabled={busy === x.id}
                        onClick={() => act({ action: "answer", id: x.id, a: o.a })}>{o.label}</button>
                    ))}
                    <button className="btn btn-light" style={{ fontSize: 12.5, padding: "8px 12px" }} disabled={busy === x.id} onClick={() => act({ action: "stop", id: x.id })}>Stop asking about this role</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((x) => {
          const [bg, fg] = TONE[x.status] || TONE.opened;
          return (
            <div key={x.id} className="card" style={{ padding: 16 }}>
              <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{x.role}</div>
                  <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{x.employer}</div>
                  <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>Opened on {x.sourceName}: {day(x.openedAt)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "inline-block", padding: "5px 12px", borderRadius: 999, background: bg, color: fg, fontWeight: 700, fontSize: 13 }}>{x.statusLabel}</span>
                  <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>{x.statusSource === "click" ? "Recorded by Qura" : x.statusSource === "employer_verified" ? "Confirmed by the employer" : "From you, " + day(x.statusAt)}</div>
                </div>
              </div>
              {x.history && x.history.length > 1 ? (
                <div className="faint" style={{ fontSize: 12, marginTop: 8 }}>
                  {x.history.map((h, i) => <span key={i}>{i ? " · " : ""}{h.label} {day(h.at)}</span>)}
                </div>
              ) : null}
              <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {x.sourceUrl ? <a className="btn btn-light" style={{ fontSize: 12.5, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }} href={x.sourceUrl} target="_blank" rel="noopener noreferrer">View advert <ExternalLink size={13} /></a> : null}
                {edit === x.id ? (
                  <select className="input" style={{ fontSize: 13, maxWidth: 220 }} defaultValue="" onChange={(e) => e.target.value && act({ action: "set", id: x.id, status: e.target.value })}>
                    <option value="" disabled>Choose where it has got to</option>
                    {SET_OPTIONS.filter(([k]) => k !== "opened" || x.status === "opened").map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                ) : (
                  <button className="btn btn-light" style={{ fontSize: 12.5 }} onClick={() => setEdit(x.id)}>Update status</button>
                )}
                <button className="btn btn-light" style={{ fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }} disabled={busy === x.id}
                  onClick={() => { if (window.confirm("Delete this record from your tracker?")) act({ action: "delete", id: x.id }); }}><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
