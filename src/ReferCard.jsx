// Qura Refer & Reward: the clinician's own card. Personal link, Copy and
// Share, and how their referrals are doing. Hidden until the founders switch
// the programme on in Admin; founders see it all the time, marked as a preview.

import React, { useEffect, useState } from "react";
import { Copy, Gift, Share2 } from "lucide-react";
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

export default function ReferCard() {
  const [r, setR] = useState(null);
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => call("/api/referrals?v=2").then(setR).catch(() => setR(null));
  useEffect(() => { if (supabase) load(); }, []);
  if (!r || !r.show) return null;

  const shared = () => call("/api/referrals", { action: "shared" }).catch(() => {});
  const copy = async () => {
    try { await navigator.clipboard.writeText(r.link); setNote("Link copied. Paste it into a message to a colleague."); }
    catch (e) { setNote("Copy this link: " + r.link); }
    shared();
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Join me on Qura", text: r.shareText }); shared(); } catch (e) {}
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(r.shareText), "_blank", "noopener");
      shared();
    }
  };
  const apply = async () => {
    if (busy || code.length !== 6) return;
    setBusy(true);
    try { const j = await call("/api/referrals", { code }); setNote(j.message); setCode(""); load(); }
    catch (e) { setNote(e.message); }
    setBusy(false);
  };

  const c = r.counts || {};
  const stat = (n, label) => (
    <div style={{ flex: "1 1 90px", background: "var(--bg)", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontWeight: 800, fontSize: 19 }}>{n}</div>
      <div className="faint" style={{ fontSize: 12 }}>{label}</div>
    </div>
  );

  return (
    <div className="card" style={{ padding: 22, margin: "0 0 16px" }}>
      {r.preview ? (
        <div style={{ background: "#FFF7E6", color: "#8A5A00", fontSize: 12.5, borderRadius: 8, padding: "8px 10px", marginBottom: 14 }}>
          Preview: only founders can see this until Refer &amp; Reward is switched on in Admin, Referrals.
        </div>
      ) : null}
      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--cyan-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Gift size={20} color="#06776F" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Refer a healthcare professional</div>
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 3 }}>
            Get a &pound;{r.rewardGBP} voucher for each colleague who joins with your link and has their profile verified. Up to &pound;{r.rewardGBP * r.cap} for {r.cap} referrals.
          </div>
        </div>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <input readOnly value={r.link} onFocus={(e) => e.target.select()} style={{ flex: "1 1 240px", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13.5, background: "#fff" }} />
        <button className="btn btn-primary" onClick={copy}><Copy size={15} /> Copy link</button>
        <button className="btn btn-light" onClick={share}><Share2 size={15} /> Share</button>
      </div>
      <div className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>Your invite code for the phone app: <b style={{ letterSpacing: 2, color: "var(--navy)" }}>{r.code}</b></div>
      <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        {stat(r.total || 0, "Joined with your link")}
        {stat((c.eligible || 0) + (c.paid || 0), "Verified")}
        {stat("£" + (r.earnedGBP || 0), "Vouchers sent")}
        {r.owedGBP ? stat("£" + r.owedGBP, "Voucher on its way") : null}
      </div>
      {r.canClaim ? (
        <div className="row" style={{ gap: 8, marginTop: 14 }}>
          <input value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="Invited by a colleague? Enter their code"
            style={{ flex: 1, padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13.5, letterSpacing: code ? 2 : 0 }} />
          <button className="btn btn-light" disabled={busy || code.length !== 6} onClick={apply}>{busy ? "..." : "Apply"}</button>
        </div>
      ) : null}
      {note ? <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>{note}</div> : null}
      <div className="faint" style={{ fontSize: 12, marginTop: 12 }}>Vouchers are sent by email by the Qura team. <a href={r.terms} target="_blank" rel="noreferrer" style={{ color: "var(--teal)" }}>Terms apply</a>.</div>
    </div>
  );
}
