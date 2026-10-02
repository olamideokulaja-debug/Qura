// Claim your NHS Jobs adverts (Qura Opportunity Engine, 2 October 2026).
//
// Qura shows live NHS Jobs vacancies to clinicians as "Discovered by Qura".
// An organisation that finds its own advert there can say so. A founder checks
// the claim (Admin, New organisations, Advert claims) before anything changes;
// once confirmed, clinicians see the advert marked as claimed by the
// organisation. To take applications through Qura, the organisation posts the
// role itself. Server: api/opp-claims.js.

import React, { useEffect, useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { supabase } from "./supabase.js";

async function call(path, body) {
  let token = "";
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const r = await fetch(path, body
    ? { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify(body) }
    : { headers: { authorization: "Bearer " + token } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}

const STATUS = { CLAIM_REQUESTED: ["Being checked", "#FFF7E6", "#8A5A00"], CLAIMED: ["Confirmed as yours", "#E6F6F3", "#06776F"], REJECTED: ["Not confirmed", "#FDECEA", "#B4433A"] };

export default function ClaimAdverts() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState(null);
  const [mine, setMine] = useState([]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadMine = async () => { try { setMine((await call("/api/opp-claims?mine=1")).items || []); } catch (e) {} };
  useEffect(() => { loadMine(); }, []);

  const search = async () => {
    if (!q.trim()) return;
    setBusy("search"); setErr(""); setMsg("");
    try { const j = await call("/api/opportunities?v=2&q=" + encodeURIComponent(q.trim())); setItems((j.items || []).filter((o) => o.kind === "discover")); }
    catch (e) { setErr(e.message); }
    setBusy("");
  };
  const claim = async (o) => {
    const note = window.prompt("How can we check that \"" + o.role + "\" is your organisation's advert? For example your job title and the NHS Jobs reference. This goes to the Qura team only.", "");
    if (note === null) return;
    setBusy(o.id); setErr(""); setMsg("");
    try { await call("/api/opp-claims", { action: "claim", id: o.id, note }); setMsg("Thank you. We will check that \"" + o.role + "\" is yours, usually within 1 working day, and email you."); await loadMine(); }
    catch (e) { setErr(e.message); }
    setBusy("");
  };
  const claimedIds = new Set(mine.map((m) => m.id));

  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 15.5 }}>Already advertising on NHS Jobs?</div>
      <div className="muted" style={{ fontSize: 13, marginTop: 2, lineHeight: 1.55 }}>
        Clinicians on Qura see live NHS Jobs vacancies marked "Discovered by Qura". Find yours and claim it, and once we have checked it clinicians see it marked as yours.
      </div>
      <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <div className="row" style={{ flex: 1, minWidth: 240, gap: 8, border: "1px solid var(--line)", borderRadius: 999, padding: "4px 14px", background: "#fff" }}>
          <Search size={15} color="var(--faint)" />
          <input style={{ flex: 1, border: 0, outline: "none", padding: "7px 0", fontSize: 14, background: "transparent" }} value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }} placeholder="Your organisation or the job title" />
        </div>
        <button className="btn btn-light" style={{ fontSize: 13 }} disabled={busy === "search"} onClick={search}>{busy === "search" ? "Searching..." : "Find adverts"}</button>
      </div>
      {msg ? <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#E6F6F3", color: "#06776F", fontSize: 13.5 }}>{msg}</div> : null}
      {err ? <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#FDECEA", color: "#B4433A", fontSize: 13.5 }}>{err}</div> : null}
      {items ? (
        <div style={{ marginTop: 12 }}>
          {!items.length ? <div className="muted" style={{ fontSize: 13.5 }}>No live NHS Jobs adverts match that. Try your organisation's name as it appears on NHS Jobs.</div> : null}
          {items.slice(0, 15).map((o) => (
            <div key={o.id} className="row" style={{ justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{o.role}</div>
                <div className="faint" style={{ fontSize: 12.5 }}>{[o.employer, o.region, o.closes ? "closes in " + o.closes : ""].filter(Boolean).join(" · ")}</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <a className="btn btn-ghost" style={{ fontSize: 12.5 }} href={o.sourceUrl} target="_blank" rel="noopener noreferrer">View <ExternalLink size={13} /></a>
                {o.claimStatus === "CLAIMED" || claimedIds.has(o.id)
                  ? <span className="chip" style={{ fontSize: 11 }}>{claimedIds.has(o.id) ? "Claimed by you" : "Already claimed"}</span>
                  : <button className="btn btn-primary" style={{ fontSize: 12.5 }} disabled={busy === o.id} onClick={() => claim(o)}>{busy === o.id ? "Sending..." : "This is ours"}</button>}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {mine.length ? (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>Your claimed adverts</div>
          {mine.map((m) => {
            const [label, bg, fg] = STATUS[m.claimStatus] || ["", "#EEF1F7", "#5A6783"];
            return (
              <div key={m.id} className="row" style={{ justifyContent: "space-between", gap: 10, padding: "7px 0", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.role}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{[m.employer, m.region, m.status !== "LIVE" ? "no longer live" : ""].filter(Boolean).join(" · ")}</div>
                </div>
                <span className="chip" style={{ fontSize: 11, background: bg, color: fg, fontWeight: 700 }}>{label}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
