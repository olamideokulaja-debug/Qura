// Admin: advert claims. An organisation says a "Discovered by Qura" NHS Jobs
// advert is theirs (src/ClaimAdverts.jsx). A founder checks it is really their
// employer before confirming; the organisation is emailed either way.
// Server: api/opp-claims.js.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

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
const LABEL = { CLAIM_REQUESTED: "Waiting", CLAIMED: "Confirmed", REJECTED: "Not confirmed" };
const day = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function AdminClaims() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const load = async () => { try { setItems((await call("/api/opp-claims?all=1")).items || []); setErr(""); } catch (e) { setErr(e.message); } };
  useEffect(() => { load(); }, []);
  const decide = async (o, approve) => {
    if (!window.confirm((approve ? "Confirm " : "Reject ") + "the claim by " + o.claimant + " for \"" + o.role + "\"? They will be emailed.")) return;
    setBusy(o.id);
    try { await call("/api/opp-claims", { action: "decide", id: o.id, approve }); await load(); } catch (e) { setErr(e.message); }
    setBusy("");
  };
  if (err && !items) return <div className="card" style={{ padding: 20, marginTop: 18 }}>Could not load advert claims: {err}</div>;
  if (!items) return null;
  const waiting = items.filter((o) => o.claimStatus === "CLAIM_REQUESTED");
  return (
    <div className="card" style={{ padding: 18, marginTop: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 15.5 }}>Advert claims {waiting.length ? "(" + waiting.length + " waiting)" : ""}</div>
      <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Organisations saying an NHS Jobs advert on Qura is theirs. Check the employer before confirming.</div>
      {err ? <div style={{ marginTop: 10, color: "#B4433A", fontSize: 13.5 }}>{err}</div> : null}
      {!items.length ? <div className="muted" style={{ fontSize: 13.5, marginTop: 12 }}>No claims yet.</div> : null}
      {items.map((o) => (
        <div key={o.id} style={{ padding: "11px 0", borderTop: "1px solid var(--line)", marginTop: 8 }}>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <span className="chip" style={{ fontSize: 11, fontWeight: 700 }}>{LABEL[o.claimStatus] || o.claimStatus}</span>
            <b style={{ fontSize: 14 }}>{o.role}</b>
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Advert employer: <b>{o.employer}</b> · {o.region}</div>
          <div style={{ fontSize: 13, marginTop: 2 }}>Claimed by: <b>{o.claimant}</b> on {day(o.claimedAt)}{o.decidedBy ? " · decided by " + o.decidedBy : ""}</div>
          {o.claimNote ? <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{o.claimNote}</div> : null}
          <div className="row" style={{ gap: 8, marginTop: 9, flexWrap: "wrap" }}>
            <a className="btn btn-light" style={{ fontSize: 13 }} href={o.sourceUrl} target="_blank" rel="noopener noreferrer">Open the NHS Jobs advert</a>
            {o.claimStatus !== "CLAIMED" ? <button className="btn btn-primary" style={{ fontSize: 13 }} disabled={busy === o.id} onClick={() => decide(o, true)}>Confirm claim</button> : null}
            {o.claimStatus !== "REJECTED" ? <button className="btn btn-light" style={{ fontSize: 13 }} disabled={busy === o.id} onClick={() => decide(o, false)}>Reject</button> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
