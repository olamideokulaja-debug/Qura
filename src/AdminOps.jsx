// Founder operations: the introduction queue, clinicians awaiting a register
// check, early access requests, adding a contact and directory removals.
//
// Lifted out of App.jsx, which had grown past 550 KB — large enough that it
// could not be committed through tooling and every small change meant moving
// the whole file. This component has no dependencies on App.jsx's module
// scope, so it moved cleanly.

import React, { useState, useEffect } from "react";
import { SectionHead } from "./components/ui.jsx";
// Setting a supplier's signals is a founder job, so the same panel a hospital
// sees is reused here with the founder controls switched on.
import SupplierRating from "./SupplierRating.jsx";
import { AGENCIES } from "./data/marketplace.js";
import { supabase } from "./supabase.js";

export default function AdminOps() {
  const [tab, setTab] = useState("intros");
  const [queue, setQueue] = useState(null);
  const [removals, setRemovals] = useState(null);
  const [waitlist, setWaitlist] = useState(null);
  const [clinicians, setClinicians] = useState(null);
  const [busy, setBusy] = useState("");
  const [nc, setNc] = useState({ name: "", org: "", role: "", email: "", phone: "" });
  const [ncMsg, setNcMsg] = useState("");
  const [rmName, setRmName] = useState("");
  const [rmReason, setRmReason] = useState("");
  const [msg, setMsg] = useState("");
  const token = async () => { try { const { data } = await supabase.auth.getSession(); return data?.session?.access_token; } catch (e) { return ""; } };

  const load = async () => {
    try {
      const t = await token();
      const h = { authorization: "Bearer " + t };
      const [qi, qr, qw, qc] = await Promise.all([
        fetch("/api/admin?view=intros", { headers: h }).then((r) => r.json()),
        fetch("/api/admin?view=removals", { headers: h }).then((r) => r.json()),
        fetch("/api/admin?view=waitlist", { headers: h }).then((r) => r.json()),
        fetch("/api/admin?view=clinicians", { headers: h }).then((r) => r.json()),
      ]);
      setQueue(qi.queue || []);
      setRemovals(qr.removals || []);
      setWaitlist(qw.waitlist || []);
      setClinicians(qc.clinicians || []);
    } catch (e) { setQueue([]); setRemovals([]); setWaitlist([]); setClinicians([]); }
  };
  useEffect(() => { load(); }, []);

  // The register check. This is the whole promise: a person opens the official
  // public register, finds the clinician, and only then are they visible to
  // hospitals and suppliers.
  const verifyClinician = async (owner, on) => {
    setBusy("cl" + owner);
    try {
      const t = await token();
      await fetch("/api/admin", { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json" },
        body: JSON.stringify({ action: on ? "clinician-verify" : "clinician-unverify", owner }) });
      await load();
    } catch (e) {}
    setBusy("");
  };

  const act = async (introId, status) => {
    setBusy(introId + status);
    try {
      const t = await token();
      await fetch("/api/admin", { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json" },
        body: JSON.stringify({ action: "intro-update", introId, status }) });
      await load();
    } catch (e) {}
    setBusy("");
  };

  const removeContact = async () => {
    if (!rmName.trim()) return;
    setBusy("rm");
    try {
      const t = await token();
      const r = await fetch("/api/admin", { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json" },
        body: JSON.stringify({ action: "contact-remove", name: rmName.trim(), reason: rmReason.trim() || "founder removal" }) });
      const j = await r.json();
      setMsg(r.ok ? "Removed and logged. They will not return on a future import." : (j.error || "Could not remove."));
      setRmName(""); setRmReason("");
      await load();
    } catch (e) { setMsg("Could not remove."); }
    setBusy("");
  };

  const norm = (v) => String(v || "pending").toLowerCase() === "requested" ? "pending" : String(v || "pending").toLowerCase();
  const STATUS_NEXT = { pending: ["verified", "declined"], verified: ["completed"], completed: [], declined: [] };
  const chipTone = { pending: "#9A5E00", verified: "#06776F", completed: "#1E5EDB", declined: "#B4433A", approved: "#06776F", denied: "#B4433A" };

  // Approving creates the account, emails a set-password link and writes the
  // role the person chose on the form. Denying only marks the record.
  const decide = async (addr, decision) => {
    setBusy(addr + decision);
    setMsg("");
    try {
      const t = await token();
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { authorization: "Bearer " + t, "content-type": "application/json" },
        body: JSON.stringify({ action: decision === "approved" ? "waitlist-approve" : "waitlist-deny", email: addr }),
      });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "That did not work.");
      else setMsg(decision === "approved" ? "Approved. Invitation sent to " + addr + "." : "Denied " + addr + ".");
      await load();
    } catch (e) { setMsg("That did not work."); }
    setBusy("");
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div className="row" style={{ gap: 8, marginBottom: 14 }}>
        {[["intros", "Introduction queue"], ["clinicians", "Clinicians"], ["suppliers", "Supplier ratings"], ["waitlist", "Early access"], ["add", "Add a contact"], ["removals", "Directory removals"]].map(([k, l]) => (
          <button key={k} className={"btn " + (tab === k ? "btn-primary" : "btn-light")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "intros" ? (
        <div className="card" style={{ padding: 18 }}>
          <SectionHead title="Introductions" action={<span className="faint" style={{ fontSize: 12 }}>{queue ? queue.length + " total" : "Loading"}</span>} />
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.55 }}>
            Verify means the registration number has been checked against the official public register. Only then complete the introduction.
          </div>
          {!queue ? <div className="faint">Loading...</div> : queue.length === 0 ? (
            <div className="faint" style={{ fontSize: 13 }}>Nothing waiting. New requests appear here the moment a supplier asks.</div>
          ) : queue.map((q) => (
            <div key={q.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{q.clinicianLabel || q.handle || q.clinicianId} <span className="faint">for</span> {q.supplierEmail}</div>
                  <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{q.at ? new Date(q.at).toLocaleString("en-GB") : ""}{q.updatedBy ? " · last action " + q.updatedBy : ""}</div>
                </div>
                <div className="row" style={{ gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: chipTone[norm(q.status)], border: "1px solid " + chipTone[norm(q.status)], borderRadius: 999, padding: "3px 10px" }}>{norm(q.status).toUpperCase()}</span>
                  {(STATUS_NEXT[norm(q.status)] || []).map((next) => (
                    <button key={next} className="btn btn-light" style={{ fontSize: 12 }} disabled={busy === q.id + next} onClick={() => act(q.id, next)}>
                      {busy === q.id + next ? "..." : next === "verified" ? "Mark verified" : next === "completed" ? "Complete" : "Decline"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tab === "suppliers" ? (
        <div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.55, maxWidth: 640 }}>
            A supplier's rating is earned from facts you have confirmed, not typed in.
            Set only what you have actually checked: each signal is shown to hospitals
            with the claim it represents. Provider ratings start counting once three
            organisations have rated a supplier.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {AGENCIES.map((a) => (
              <div key={a.name}>
                <div className="row" style={{ gap: 9, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</span>
                  <span className="faint" style={{ fontSize: 12.5 }}>{a.spec}{a.loc ? " · " + a.loc : ""}</span>
                </div>
                <SupplierRating supplier={a} isFounder />
              </div>
            ))}
          </div>
        </div>
      ) : tab === "clinicians" ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {clinicians === null ? <div style={{ padding: 18 }} className="muted">Loading...</div>
          : !clinicians.length ? <div style={{ padding: 18 }} className="muted">No clinician profiles yet.</div>
          : clinicians.map((c) => {
            // Three states: waiting on a check, verified, or still incomplete.
            const ready = c.registeredAt && !c.missing.length;
            const state = c.verifiedAt ? "verified" : ready ? "awaiting" : "incomplete";
            return (
              <div key={c.owner} style={{ padding: 16, borderBottom: "1px solid var(--line)" }}>
                <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.email || "(no email)"}</span>
                      {state === "verified" ? <span className="chip chip-cyan" style={{ fontSize: 11 }}>Verified</span>
                       : state === "awaiting" ? <span className="chip" style={{ fontSize: 11, background: "var(--amber-bg)", color: "var(--amber)" }}>Awaiting check</span>
                       : <span className="chip" style={{ fontSize: 11 }}>Incomplete</span>}
                    </div>
                    <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
                      {[c.profession, c.category, c.country].filter(Boolean).join(" · ")}
                    </div>
                    <div style={{ fontSize: 13.5, marginTop: 5 }}>
                      <b>{c.regBody || "No body"}</b>{c.regNumber ? " · " + c.regNumber : ""}
                      {c.experienceYears ? " · " + c.experienceYears : ""}
                      {c.cvUploaded ? " · CV on file" : " · no CV"}
                    </div>
                    {c.missing.length ? (
                      <div className="muted" style={{ fontSize: 12.5, marginTop: 5 }}>Still missing: {c.missing.join(", ")}</div>
                    ) : null}
                  </div>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    {c.registerUrl ? (
                      <a className="btn btn-light" style={{ fontSize: 13 }} href={c.registerUrl} target="_blank" rel="noreferrer">
                        Open {c.regBody} register
                      </a>
                    ) : null}
                    {state === "verified" ? (
                      <button className="btn btn-light" style={{ fontSize: 13 }} disabled={busy === "cl" + c.owner}
                        onClick={() => verifyClinician(c.owner, false)}>Withdraw</button>
                    ) : (
                      <button className="btn btn-primary" style={{ fontSize: 13 }}
                        disabled={!ready || busy === "cl" + c.owner}
                        title={ready ? "" : "This profile is not complete yet"}
                        onClick={() => verifyClinician(c.owner, true)}>
                        {busy === "cl" + c.owner ? "Saving..." : "Mark verified"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="muted" style={{ fontSize: 12.5, padding: "12px 16px" }}>
            Open the official register, find the clinician, and only then mark them
            verified. Until you do, they are not visible to hospitals or suppliers.
          </div>
        </div>
      ) : tab === "waitlist" ? (
        <div className="card" style={{ padding: 18 }}>
          <SectionHead title="Early access requests" action={<span className="faint" style={{ fontSize: 12 }}>{waitlist ? waitlist.length + " total" : "Loading"}</span>} />
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.55 }}>
            Approving creates the account, emails a link to set a password, and puts the person on the free plan in the role they chose. Nobody gets both roles.
          </div>
          {msg ? <div className="faint" style={{ fontSize: 12.5, marginBottom: 10 }}>{msg}</div> : null}
          {!waitlist ? (
            <div className="faint" style={{ fontSize: 13 }}>Loading.</div>
          ) : waitlist.length === 0 ? (
            <div className="faint" style={{ fontSize: 13 }}>No requests yet.</div>
          ) : (
            waitlist.map((w) => (
              <div key={w.email} className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{w.email}</div>
                  <div className="faint" style={{ fontSize: 12 }}>
                    {w.role === "supplier" ? "Supplier" : "Clinician"}
                    {w.ts ? " · " + String(w.ts).slice(0, 10) : ""}
                    {w.decidedBy ? " · by " + w.decidedBy : ""}
                  </div>
                </div>
                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <span className="chip" style={{ fontSize: 11, color: chipTone[w.status] || "#5A6783" }}>{w.status || "pending"}</span>
                  {w.status === "pending" ? (
                    <>
                      <button className="btn btn-light" style={{ fontSize: 12 }} disabled={busy === w.email + "approved"} onClick={() => decide(w.email, "approved")}>
                        {busy === w.email + "approved" ? "Sending" : "Approve"}
                      </button>
                      <button className="btn btn-light" style={{ fontSize: 12 }} disabled={busy === w.email + "denied"} onClick={() => decide(w.email, "denied")}>
                        Deny
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      ) : tab === "add" ? (
        <div className="card" style={{ padding: 18 }}>
          <SectionHead title="Add a contact to the directory" />
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.55 }}>
            The category is worked out from the job title, using the same rules as the rest of the register, so it can never drift from what is already there. Organisation is required: without it a contact cannot be categorised, placed in a region, or filtered.
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <input className="in" style={{ flex: 1, minWidth: 180 }} placeholder="Full name" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} />
            <input className="in" style={{ flex: 2, minWidth: 220 }} placeholder="Organisation" value={nc.org} onChange={(e) => setNc({ ...nc, org: e.target.value })} />
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <input className="in" style={{ flex: 2, minWidth: 220 }} placeholder="Job title (this is what sets the category)" value={nc.role} onChange={(e) => setNc({ ...nc, role: e.target.value })} />
            <input className="in" style={{ flex: 1, minWidth: 180 }} placeholder="Work email (optional)" value={nc.email} onChange={(e) => setNc({ ...nc, email: e.target.value })} />
            <input className="in" style={{ flex: 1, minWidth: 140 }} placeholder="Phone (optional)" value={nc.phone} onChange={(e) => setNc({ ...nc, phone: e.target.value })} />
          </div>
          <div className="row" style={{ gap: 10, marginTop: 12, alignItems: "center" }}>
            <button className="btn btn-primary" disabled={busy === "add" || !nc.name.trim() || !nc.org.trim()} onClick={async () => {
              setBusy("add"); setNcMsg("");
              try {
                const t = await token();
                const r = await fetch("/api/admin", { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json" }, body: JSON.stringify({ action: "contact-add", ...nc }) });
                const j = await r.json();
                if (r.ok) { setNcMsg("Added as " + j.contact.spec + " (" + j.reason + ")."); setNc({ name: "", org: "", role: "", email: "", phone: "" }); }
                else setNcMsg(j.error || "Could not add that contact.");
              } catch (e) { setNcMsg("Could not add that contact."); }
              setBusy("");
            }}>{busy === "add" ? "Adding..." : "Add contact"}</button>
            {ncMsg ? <span style={{ fontSize: 12.5, color: ncMsg.startsWith("Added") ? "#06776F" : "#B4433A" }}>{ncMsg}</span> : null}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 18 }}>
          <SectionHead title="Remove someone from the directory" />
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.55 }}>
            Removals are logged and permanent: a removed person does not come back when the register is next updated. Use the name exactly as it appears in the directory.
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <input className="in" style={{ flex: 2, minWidth: 200 }} placeholder="Full name" value={rmName} onChange={(e) => setRmName(e.target.value)} />
            <input className="in" style={{ flex: 3, minWidth: 220 }} placeholder="Reason (asked to be removed, left role, duplicate...)" value={rmReason} onChange={(e) => setRmReason(e.target.value)} />
            <button className="btn btn-primary" disabled={busy === "rm" || !rmName.trim()} onClick={removeContact}>{busy === "rm" ? "Removing..." : "Remove"}</button>
          </div>
          {msg ? <div style={{ fontSize: 12.5, marginTop: 10, color: "#06776F" }}>{msg}</div> : null}
          <div style={{ marginTop: 18 }}>
            <SectionHead title="Removal log" action={<span className="faint" style={{ fontSize: 12 }}>{removals ? removals.length + " removed" : ""}</span>} />
            {!removals ? <div className="faint">Loading...</div> : removals.length === 0 ? (
              <div className="faint" style={{ fontSize: 13 }}>No removals yet.</div>
            ) : removals.map((r, i) => (
              <div key={i} className="faint" style={{ fontSize: 12.5, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                <strong style={{ color: "var(--text)" }}>{r.name}</strong>{r.org ? " · " + r.org : ""} · {r.reason} · {new Date(r.at).toLocaleDateString("en-GB")} · {r.by}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
