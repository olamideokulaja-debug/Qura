// A supplier's own standing on Qura.
//
// This screen exists because the rating had nowhere to live for the people it
// describes. Ratings were wired onto the private clinics directory by mistake,
// which is a list of customers, not of workforce suppliers. A supplier had no
// way to see their own rating at all, let alone improve it.
//
// Two states:
//   unlinked   the account has not been matched to an organisation yet, so it
//              asks which one and sends that to the Qura team
//   linked     the full rating, with evidence controls for what is unearned

import React, { useState, useEffect, useCallback } from "react";
import { Building2, ShieldCheck, Clock } from "lucide-react";
import { PageHead } from "./components/ui.jsx";
import SupplierRating from "./SupplierRating.jsx";
import { supabase } from "./supabase.js";

const authHeaders = async (json) => {
  let t = "";
  try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const h = t ? { Authorization: "Bearer " + t } : {};
  if (json) h["content-type"] = "application/json";
  return h;
};

export default function SupplierStanding() {
  const [link, setLink] = useState(undefined);   // undefined = still loading
  const [org, setOrg] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/supplier-org", { headers: await authHeaders(false) });
      if (r.ok) { const j = await r.json(); setLink(j.link || null); }
      else setLink(null);
    } catch (e) { setLink(null); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const claim = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/supplier-org", {
        method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ org, role, note }),
      });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not submit that.");
      else setMsg("Sent to the Qura team. Once they confirm you represent " + org +
                  ", your rating appears here and you can add evidence to it.");
    } catch (e) { setMsg("Could not reach Qura. Please try again."); }
    setBusy(false);
  };

  if (link === undefined) {
    return <div><PageHead title="Your Qura standing" sub="How hospitals see you" />
      <div className="muted">Loading...</div></div>;
  }

  // ------------------------------------------------------------- linked
  if (link) {
    return (
      <div>
        <PageHead title="Your Qura standing"
          sub="This is exactly what a hospital sees when they find you on Qura." />
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          <div className="row" style={{ gap: 10 }}>
            <Building2 size={18} color="var(--teal)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{link.org}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>
                Confirmed by the Qura team on {String(link.approvedAt || "").slice(0, 10)}
              </div>
            </div>
          </div>
        </div>

        {/* canClaim turns on the evidence controls: a supplier can ask for a
            signal, never grant themselves one. */}
        <SupplierRating supplier={{ name: link.org }} canClaim />

        <div className="muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.6, maxWidth: 620 }}>
          Press <b>Why this rating</b> to see every signal, including the ones you have
          not earned yet. Each of those offers <b>Provide evidence</b>. A member of the
          Qura team checks what you send before anything changes, which is why the
          rating means something to the hospitals reading it.
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------- unlinked
  return (
    <div>
      <PageHead title="Your Qura standing" sub="How hospitals see you" />
      <div className="card" style={{ padding: 22, maxWidth: 620 }}>
        <div className="row" style={{ gap: 9, marginBottom: 10 }}>
          <ShieldCheck size={18} color="var(--teal)" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Which organisation do you work for?</span>
        </div>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>
          Qura shows hospitals a rating for every workforce supplier, built from
          things we have checked: framework places, CQC registration, evidenced
          specialties, how quickly you respond. To show you yours, we need to know
          which organisation this account belongs to.
        </p>
        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          A member of the Qura team confirms it before anything is linked. That is
          deliberate: it is what stops anyone else claiming your organisation and
          your rating.
        </p>

        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginTop: 16, marginBottom: 6 }}>Organisation name</label>
        <input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="e.g. Apex Allied Health"
          style={{ width: "100%", padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14.5, boxSizing: "border-box" }} />

        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginTop: 12, marginBottom: 6 }}>Your role there</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Business Development Director"
          style={{ width: "100%", padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14.5, boxSizing: "border-box" }} />

        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginTop: 12, marginBottom: 6 }}>
          Anything that helps us confirm it <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
        </label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder="A company website, your Companies House number, or a colleague already on Qura."
          style={{ width: "100%", padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }} />

        <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={busy || org.trim().length < 2} onClick={claim}>
          {busy ? "Sending..." : "Send to the Qura team"}
        </button>
        {msg ? (
          <div className="row" style={{ gap: 8, marginTop: 12, alignItems: "flex-start" }}>
            <Clock size={15} color="var(--muted)" style={{ marginTop: 2, flexShrink: 0 }} />
            <span className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{msg}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
