// Admin, Referrals: the Refer & Reward pilot. Switch it on and off, set the
// reward and cap, see every referral and mark vouchers paid.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const LABEL = { pending: "Pending", eligible: "Eligible", paid: "Paid", capped: "Over cap", rejected: "Rejected" };
const TONE = {
  pending: { bg: "#EEF1F7", fg: "#5A6783" }, eligible: { bg: "#E6F6F3", fg: "#06776F" },
  paid: { bg: "#E8EEFF", fg: "#2F4FB5" }, capped: { bg: "#FFF7E6", fg: "#8A5A00" }, rejected: { bg: "#FDECEA", fg: "#B4433A" },
};
const day = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");

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

export default function AdminReferrals() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try { const j = await call("/api/referrals?admin=1"); setD(j); setForm({ rewardGBP: j.settings.rewardGBP, cap: j.settings.cap }); setErr(""); }
    catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  const save = async (patch) => {
    setBusy("settings");
    try { await call("/api/referrals", { action: "settings", ...patch }); await load(); } catch (e) { setErr(e.message); }
    setBusy("");
  };
  const mark = async (x, status) => {
    let note = "";
    if (status === "paid") {
      note = window.prompt("Mark the £" + d.settings.rewardGBP + " voucher to " + (x.referrerName || x.referrerEmail) + " as paid. Add a note (voucher provider or reference), or leave blank:", "");
      if (note === null) return;
    }
    if (status === "rejected") {
      note = window.prompt("Why is this referral rejected? This is kept on the record.", "");
      if (note === null) return;
    }
    setBusy(x.referee);
    try { await call("/api/referrals", { action: "mark", referee: x.referee, status, note }); await load(); } catch (e) { setErr(e.message); }
    setBusy("");
  };

  if (err && !d) return <div className="card" style={{ padding: 20 }}>Could not load referrals: {err}</div>;
  if (!d) return <div className="card" style={{ padding: 20 }}>Loading referrals...</div>;
  const s = d.summary;
  const list = d.referrals.filter((x) => filter === "all" || x.status === filter);
  const tile = (v, l) => (
    <div style={{ flex: "1 1 120px", background: "var(--bg)", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{v}</div><div className="faint" style={{ fontSize: 12 }}>{l}</div>
    </div>
  );

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Refer &amp; Reward is {d.settings.live ? <span style={{ color: "#06776F" }}>ON</span> : <span style={{ color: "#B4433A" }}>OFF</span>}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 3, maxWidth: 560 }}>
              {d.settings.live
                ? "Clinicians see their referral card on the web (Get verified) and in the app (Account)."
                : "Hidden from clinicians. Founders see a preview. Invite links and codes still record referrals if someone uses one."}
            </div>
          </div>
          <button className={"btn " + (d.settings.live ? "btn-light" : "btn-primary")} disabled={busy === "settings"}
            onClick={() => { if (window.confirm(d.settings.live ? "Hide Refer & Reward from clinicians?" : "Switch Refer & Reward on for every clinician now?")) save({ live: !d.settings.live }); }}>
            {d.settings.live ? "Switch off" : "Switch on for clinicians"}
          </button>
        </div>
        {form ? (
          <div className="row" style={{ gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={{ fontSize: 12.5 }}>Reward (&pound;)<br /><input type="number" min="1" value={form.rewardGBP} onChange={(e) => setForm({ ...form, rewardGBP: e.target.value })} style={{ width: 90, padding: 8, border: "1px solid var(--line)", borderRadius: 8 }} /></label>
            <label style={{ fontSize: 12.5 }}>Rewarded referrals per person<br /><input type="number" min="1" value={form.cap} onChange={(e) => setForm({ ...form, cap: e.target.value })} style={{ width: 90, padding: 8, border: "1px solid var(--line)", borderRadius: 8 }} /></label>
            <button className="btn btn-light" disabled={busy === "settings"} onClick={() => save({ rewardGBP: Number(form.rewardGBP), cap: Number(form.cap) })}>Save</button>
            <span className="faint" style={{ fontSize: 12 }}>Cap per person: &pound;{d.settings.rewardGBP * d.settings.cap}. If you change these, update the terms page too.</span>
          </div>
        ) : null}
      </div>

      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {tile(s.linkVisits, "Invite link visits")}
        {tile(s.shares, "Links shared")}
        {tile(s.registrations, "Sign-ups from referrals")}
        {tile(s.qualified + " (" + s.conversionPct + "%)", "Verified")}
        {tile("£" + s.owedGBP, "Vouchers owed")}
        {tile("£" + s.spentGBP, "Vouchers paid")}
        {tile(s.qualified ? "£" + s.costPerVerifiedGBP : "-", "Cost per verified")}
        {tile(s.repeatReferrers + " of " + s.referrersActive, "Repeat referrers")}
        {tile(s.rejected, "Rejected")}
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {["all", "eligible", "pending", "paid", "capped", "rejected"].map((k) => (
            <button key={k} className={"btn " + (filter === k ? "btn-primary" : "btn-light")} style={{ fontSize: 12.5, padding: "6px 12px" }} onClick={() => setFilter(k)}>
              {k === "all" ? "All (" + d.referrals.length + ")" : LABEL[k] + " (" + d.referrals.filter((x) => x.status === k).length + ")"}
            </button>
          ))}
        </div>
        {err ? <div style={{ color: "#B4433A", fontSize: 13, marginBottom: 10 }}>{err}</div> : null}
        {!list.length ? <div className="muted" style={{ fontSize: 13.5 }}>No referrals here yet.</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ textAlign: "left", color: "var(--muted)" }}>
                <th style={{ padding: "6px 8px" }}>Referred by</th><th style={{ padding: "6px 8px" }}>New member</th>
                <th style={{ padding: "6px 8px" }}>Joined</th><th style={{ padding: "6px 8px" }}>Profile</th>
                <th style={{ padding: "6px 8px" }}>Reward</th><th style={{ padding: "6px 8px" }}></th>
              </tr></thead>
              <tbody>{list.map((x) => {
                const t = TONE[x.status] || TONE.pending;
                return (
                  <tr key={x.referee} style={{ borderTop: "1px solid var(--line)", verticalAlign: "top" }}>
                    <td style={{ padding: "8px" }}><b>{x.referrerName || x.referrerEmail}</b><div className="faint">{x.referrerEmail}</div><div className="faint">Code {x.code}</div></td>
                    <td style={{ padding: "8px" }}><b>{x.refereeName || x.refereeEmail}</b><div className="faint">{x.refereeEmail}</div></td>
                    <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{day(x.registeredAt)}</td>
                    <td style={{ padding: "8px" }}>
                      <div>{x.emailConfirmed ? "Email confirmed" : "Email not confirmed"}</div>
                      <div className="faint">{x.verifiedAt ? "Verified " + day(x.verifiedAt) : (x.profileComplete ? "Complete, awaiting your check" : "Profile not complete")}</div>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ background: t.bg, color: t.fg, borderRadius: 999, padding: "3px 10px", fontWeight: 700, fontSize: 12 }}>{LABEL[x.status] || x.status}</span>
                      {x.reason ? <div className="faint" style={{ fontSize: 12, marginTop: 4, maxWidth: 220 }}>{x.reason}</div> : null}
                      {x.status === "paid" ? <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>{day(x.paidAt)} by {x.paidBy}{x.paidNote ? ". " + x.paidNote : ""}</div> : null}
                    </td>
                    <td style={{ padding: "8px", whiteSpace: "nowrap" }}>
                      {x.status === "eligible" ? <button className="btn btn-primary" style={{ fontSize: 12.5, padding: "6px 12px" }} disabled={busy === x.referee} onClick={() => mark(x, "paid")}>Mark paid</button> : null}
                      {["pending", "eligible", "capped"].includes(x.status) ? <button className="btn btn-light" style={{ fontSize: 12.5, padding: "6px 12px", marginLeft: 6 }} disabled={busy === x.referee} onClick={() => mark(x, "rejected")}>Reject</button> : null}
                      {x.status === "rejected" ? <button className="btn btn-light" style={{ fontSize: 12.5, padding: "6px 12px" }} disabled={busy === x.referee} onClick={() => mark(x, "pending")}>Reinstate</button> : null}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>

      {d.referrers.length ? (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>By referrer</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ textAlign: "left", color: "var(--muted)" }}><th style={{ padding: 6 }}>Clinician</th><th style={{ padding: 6 }}>Joined</th><th style={{ padding: 6 }}>Pending</th><th style={{ padding: 6 }}>Eligible</th><th style={{ padding: 6 }}>Paid</th><th style={{ padding: 6 }}>Shared</th></tr></thead>
            <tbody>{d.referrers.map((t) => (
              <tr key={t.referrer} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: 6 }}><b>{t.name || t.email}</b><div className="faint">{t.email}</div></td>
                <td style={{ padding: 6 }}>{t.total}</td><td style={{ padding: 6 }}>{t.pending || 0}</td>
                <td style={{ padding: 6 }}>{t.eligible || 0}</td><td style={{ padding: 6 }}>{t.paid || 0} (&pound;{(t.paid || 0) * d.settings.rewardGBP})</td>
                <td style={{ padding: 6 }}>{t.shared || 0}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
