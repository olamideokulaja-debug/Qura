// Talent pools on the website (1 October 2026). Replaces the sample-data
// "Talent pipeline" page.
//
//   agencies    add the clinicians they represent (one at a time or pasted
//               from a spreadsheet), see who has confirmed, end a
//               representation, and choose whether hospitals see their name
//   hospitals   see clinicians represented by agencies, and ask for an
//               introduction, which goes to the agency
//
// The rules live in api/_agency.js. Nothing is listed until the clinician
// confirms by email.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

async function call(path, body) {
  let token = "";
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const r = await fetch(path, body
    ? { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify(body) }
    : { headers: { authorization: "Bearer " + token } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || j.message || "Something went wrong. Please try again.");
  return j;
}

const ukDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };

const STATUS = {
  invited: ["Waiting for them to confirm", "#9A5E00", "#FFF4E0"],
  confirmed: ["Confirmed", "#06776F", "#E6F4F2"],
  declined: ["Declined", "#5A6783", "#EEF1F7"],
  ended: ["Ended", "#5A6783", "#EEF1F7"],
  expired: ["Expired: invite again to renew", "#9A5E00", "#FFF4E0"],
};

// "email, name, profession, country" per line; a header row is skipped.
function parseRows(text) {
  return String(text || "").split(/\r?\n/).map((l) => l.split(/[,\t;]/).map((x) => x.trim().replace(/^"|"$/g, "")))
    .filter((c) => c[0] && c[0].includes("@"))
    .map(([email, name, profession, country]) => ({ email, name: name || "", profession: profession || "", country: country || "" }));
}

function Head({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h1 className="disp" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{title}</h1>
      <div className="muted" style={{ fontSize: 14, marginTop: 4, lineHeight: 1.55, maxWidth: 680 }}>{sub}</div>
    </div>
  );
}

function AgencyView({ onToast }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [one, setOne] = useState({ email: "", name: "", profession: "" });
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => { try { setData(await call("/api/agency-pool")); setErr(""); } catch (e) { setErr(e.message); } };
  useEffect(() => { load(); }, []);

  const invite = async (list) => {
    if (!list.length) { setErr("Add at least one email address."); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const j = await call("/api/agency-pool", { action: "invite", clinicians: list });
      const parts = [j.invited + (j.invited === 1 ? " invitation sent" : " invitations sent")];
      if (j.already) parts.push(j.already + " already in your pool");
      if (j.unavailable) parts.push(j.unavailable + " could not be invited");
      if (j.invalid && j.invalid.length) parts.push(j.invalid.length + " invalid email" + (j.invalid.length === 1 ? "" : "s"));
      if (j.failed && j.failed.length) parts.push(j.failed.length + " did not send");
      setMsg(parts.join(" · ") + ".");
      setOne({ email: "", name: "", profession: "" }); setBulk("");
      load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const act = async (body, done) => { try { await call("/api/agency-pool", body); if (onToast && done) onToast(done); load(); } catch (e) { setErr(e.message); } };

  const input = { width: "100%", boxSizing: "border-box" };
  const rows = parseRows(bulk);
  return (
    <div>
      <Head title="Your clinicians" sub="Add the clinicians you represent. Each one confirms by email before anything is listed. Hospitals then see them without names or contact details, other agencies never see them, and requests to meet them come to you." />
      {err ? <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "#FDECEA", color: "#B4433A", fontSize: 13.5 }}>{err}</div> : null}
      {msg ? <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "#E6F6F3", color: "#06776F", fontSize: 13.5 }}>{msg}</div> : null}

      {data ? (
        <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {[["In your pool", data.totals.all], ["Confirmed", data.totals.confirmed], ["Waiting", data.totals.invited], ["Visible to hospitals", data.totals.visible]].map(([l, n]) => (
            <div key={l} className="card" style={{ padding: "12px 16px", minWidth: 130 }}><div style={{ fontSize: 22, fontWeight: 800 }}>{n}</div><div className="muted" style={{ fontSize: 12.5 }}>{l}</div></div>
          ))}
        </div>
      ) : null}

      {data && !data.canInvite ? (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>We check every organisation before it can add clinicians, usually within 1 working day. We will email you when it is done.</div>
      ) : (
        <div className="grid g2" style={{ gap: 16, marginBottom: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Add a clinician</div>
            <input className="in" style={{ ...input, marginBottom: 8 }} value={one.email} onChange={(e) => setOne({ ...one, email: e.target.value })} placeholder="Email address" />
            <input className="in" style={{ ...input, marginBottom: 8 }} value={one.name} onChange={(e) => setOne({ ...one, name: e.target.value })} placeholder="Name (only you see this)" />
            <input className="in" style={{ ...input, marginBottom: 10 }} value={one.profession} onChange={(e) => setOne({ ...one, profession: e.target.value })} placeholder="Profession, e.g. Sonographer" />
            <button className="btn btn-primary" disabled={busy} onClick={() => invite(one.email ? [one] : [])}>{busy ? "Sending..." : "Send invitation"}</button>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Add several at once</div>
            <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}>Paste from a spreadsheet: one clinician per line, as email, name, profession, country. Up to 200 at a time.</div>
            <textarea className="in" style={{ ...input, minHeight: 112, fontFamily: "monospace", fontSize: 12.5 }} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"ada@example.com, Ada Obi, Sonographer, United Kingdom\nben@example.com, Ben Rao, Radiographer, India"} />
            <button className="btn btn-primary" style={{ marginTop: 10 }} disabled={busy || !rows.length} onClick={() => invite(rows)}>{busy ? "Sending..." : "Send " + rows.length + (rows.length === 1 ? " invitation" : " invitations")}</button>
          </div>
        </div>
      )}

      {data ? (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <label className="row" style={{ gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={data.showName} onChange={(e) => act({ action: "settings", showName: e.target.checked }, e.target.checked ? "Hospitals will see your name" : "Your name is hidden from hospitals")} />
            Show my agency's name to hospitals on my clinicians' profiles
          </label>
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {!data ? <div className="muted" style={{ padding: 18 }}>Loading...</div> : !data.entries.length ? (
          <div className="muted" style={{ padding: 18 }}>No clinicians yet. Add your first above.</div>
        ) : data.entries.map((e) => {
          const [label, fg, bg] = STATUS[e.status] || [e.status, "#5A6783", "#EEF1F7"];
          return (
            <div key={e.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{e.name || e.email}</div>
                <div className="faint" style={{ fontSize: 12.5 }}>
                  {[e.name ? e.email : "", e.profession, e.status === "confirmed" && e.until ? "until " + ukDate(e.until) : "",
                    e.status === "confirmed" ? (e.checked ? "checked on the register, visible to hospitals" : e.onQura ? "on Qura, waiting for our register check" : "has not created their Qura profile yet") : "",
                    e.introductions ? e.introductions + (e.introductions === 1 ? " introduction request" : " introduction requests") : ""].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="chip" style={{ background: bg, color: fg, fontSize: 11.5, fontWeight: 700 }}>{label}</span>
                {e.status === "invited" ? <button className="btn btn-light" style={{ fontSize: 12.5 }} onClick={() => act({ action: "resend", id: e.id }, "Invitation sent again")}>Send again</button> : null}
                {e.status === "expired" || e.status === "declined" ? <button className="btn btn-light" style={{ fontSize: 12.5 }} onClick={() => invite([{ email: e.email, name: e.name, profession: e.profession }])}>Invite again</button> : null}
                {e.status === "invited" || e.status === "confirmed" ? <button className="btn btn-light" style={{ fontSize: 12.5 }} onClick={() => { if (window.confirm("Stop representing " + (e.name || e.email) + " on Qura? Hospitals will no longer see them as yours.")) act({ action: "remove", id: e.id }, "Removed"); }}>Remove</button> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HospitalView({ onToast }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState({});
  useEffect(() => { (async () => {
    try { const j = await call("/api/clinicians"); setItems((j.items || []).filter((c) => c.represented)); } catch (e) { setErr(e.message); setItems([]); }
  })(); }, []);
  const ask = async (c) => {
    try {
      const j = await call("/api/introductions", { clinicianId: c.id, handle: c.handle });
      setSent((s) => ({ ...s, [c.id]: true }));
      if (onToast) onToast(j.routed ? "Request sent to " + (j.agencyName || "their agency") : "Introduction requested");
    } catch (e) { setErr(e.message); }
  };
  return (
    <div>
      <Head title="Agency talent" sub="Clinicians represented by agencies on Qura, each checked against the official register. Names stay private. When you ask for an introduction, the clinician's agency contacts you." />
      {err ? <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "#FDECEA", color: "#B4433A", fontSize: 13.5 }}>{err}</div> : null}
      {!items ? <div className="muted">Loading...</div> : !items.length ? (
        <div className="card muted" style={{ padding: 18 }}>No agency-represented clinicians yet. Clinicians who joined Qura themselves are under Talent.</div>
      ) : (
        <div className="grid-3">{items.map((c) => (
          <div key={c.id} className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{c.handle}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{[c.country, c.experience].filter(Boolean).join(" · ")}</div>
            {c.salaryLabel ? <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 8 }}>{c.salaryNegotiable ? "Salary negotiable" : c.salaryLabel + " a year expected"}</div> : null}
            <div style={{ fontSize: 12.5, color: "#06776F", marginTop: 6 }}>Represented by {c.agencyName || "a partner agency"}</div>
            <button className="btn btn-primary" style={{ marginTop: 12, fontSize: 13 }} disabled={sent[c.id]} onClick={() => ask(c)}>{sent[c.id] ? "Request sent" : "Ask for an introduction"}</button>
          </div>
        ))}</div>
      )}
    </div>
  );
}

export default function AgencyPool({ role = "agency", onToast }) {
  return role === "agency" || role === "operator" ? <AgencyView onToast={onToast} /> : <HospitalView onToast={onToast} />;
}
