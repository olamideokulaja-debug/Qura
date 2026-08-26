// The frameworks an agency holds, and the certificates that prove them.
//
// Built to the founder's backend guide: seven principal routes plus a
// catch-all, multi-select because agencies hold more than one, with the
// secondary detail revealed only once a route is chosen. Asking every agency
// for reference numbers and lot lists up front is how you get a form nobody
// finishes.
//
// Nothing here is self-verifying. An agency states its position and attaches
// evidence; a founder decides whether it counts. Same rule as everything else
// that changes what a hospital sees.

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Upload, FileText, Check, Clock, X } from "lucide-react";
import { FRAMEWORKS, FRAMEWORK_STATUS, frameworkById, frameworkLabel } from "./data/frameworks.js";
import { supabase } from "./supabase.js";

const authHeaders = async (json) => {
  let t = "";
  try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const h = t ? { Authorization: "Bearer " + t } : {};
  if (json) h["content-type"] = "application/json";
  return h;
};

const inputStyle = {
  width: "100%", padding: "10px 12px", border: "1px solid var(--line)",
  borderRadius: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit",
};

const blank = () => ({
  frameworkId: "", otherName: "", reference: "", lotsText: "",
  status: "awarded", awardedOn: "", expiresOn: "",
});

export default function Frameworks({ onToast }) {
  const [entries, setEntries] = useState(null);
  const [org, setOrg] = useState(null);
  const [form, setForm] = useState(null);      // null = not adding
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/frameworks", { headers: await authHeaders(false) });
      if (r.ok) { const j = await r.json(); setEntries(j.entries || []); setOrg(j.org || null); }
      else setEntries([]);
    } catch (e) { setEntries([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy("save"); setMsg("");
    try {
      const r = await fetch("/api/frameworks", {
        method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ entry: {
          ...form,
          // Typed as a comma-separated line because agencies think in lot
          // numbers, not in form controls.
          lots: form.lotsText.split(",").map((s) => s.trim()).filter(Boolean),
        } }),
      });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not save that.");
      else { setForm(null); load(); if (onToast) onToast("Framework added. Attach the certificate to have it verified."); }
    } catch (e) { setMsg("Could not reach Qura. Please try again."); }
    setBusy("");
  };

  const remove = async (id) => {
    setBusy(id);
    try {
      await fetch("/api/frameworks", { method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ remove: id }) });
      load();
    } catch (e) {}
    setBusy("");
  };

  const attach = async (id, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setMsg("That file is over 10MB."); return; }
    setBusy(id); setMsg("");
    try {
      const data = await new Promise((ok, no) => {
        const fr = new FileReader();
        fr.onload = () => ok(fr.result);
        fr.onerror = () => no(new Error("read failed"));
        fr.readAsDataURL(file);
      });
      const r = await fetch("/api/frameworks", {
        method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ entryId: id, file: { name: file.name, type: file.type, data } }),
      });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not upload that.");
      else { load(); if (onToast) onToast("Certificate uploaded. It is with the Qura team."); }
    } catch (e) { setMsg("Could not upload that file."); }
    setBusy("");
  };

  if (entries === null) return <div className="muted">Loading...</div>;

  if (!org) {
    return (
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Frameworks</div>
        <div className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>
          Link your account to your organisation first, above. Framework positions belong
          to a company rather than to a person, so we need to know which company this is.
        </div>
      </div>
    );
  }

  const chosen = form && frameworkById(form.frameworkId);

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Frameworks and procurement routes</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4, maxWidth: 520, lineHeight: 1.55 }}>
            Which UK healthcare workforce frameworks are you approved to supply under?
            Add each one separately. A framework counts towards your rating once the
            Qura team has seen the certificate.
          </div>
        </div>
        {!form ? (
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setForm(blank())}>
            <Plus size={15} /> Add a framework
          </button>
        ) : null}
      </div>

      {/* ---------------------------------------------------------- the list */}
      {entries.length ? (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map((e) => {
            const st = FRAMEWORK_STATUS.find((s) => s.id === e.status);
            return (
              <div key={e.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
                <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{frameworkLabel(e)}</div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                      {[st && st.label, e.reference, e.lots && e.lots.length ? "Lots: " + e.lots.join(", ") : ""]
                        .filter(Boolean).join(" · ")}
                    </div>
                    {e.awardedOn || e.expiresOn ? (
                      <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>
                        {e.awardedOn ? "Awarded " + e.awardedOn : ""}
                        {e.expiresOn ? (e.awardedOn ? " · " : "") + "Expires " + e.expiresOn : ""}
                      </div>
                    ) : null}
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    {e.verifiedAt ? (
                      <span className="chip chip-cyan" style={{ fontSize: 11 }}><Check size={11} /> Verified</span>
                    ) : e.rejectedAt ? (
                      <span className="chip" style={{ fontSize: 11, background: "var(--red-bg)", color: "var(--red)" }}>
                        <X size={11} /> Not accepted
                      </span>
                    ) : e.file ? (
                      <span className="chip" style={{ fontSize: 11, background: "var(--amber-bg)", color: "var(--amber)" }}>
                        <Clock size={11} /> With Qura
                      </span>
                    ) : (
                      <span className="chip" style={{ fontSize: 11 }}>Certificate needed</span>
                    )}
                    <button className="btn btn-ghost" style={{ fontSize: 12 }} disabled={busy === e.id}
                      onClick={() => remove(e.id)} aria-label="Remove"><Trash2 size={14} /></button>
                  </div>
                </div>

                {e.rejectedAt && e.rejectReason ? (
                  <div style={{ fontSize: 12.5, marginTop: 8, padding: "8px 10px", borderRadius: 9, background: "var(--red-bg)", color: "var(--red)" }}>
                    {e.rejectReason}
                  </div>
                ) : null}

                <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  {e.file ? (
                    <span className="row muted" style={{ gap: 6, fontSize: 12.5 }}>
                      <FileText size={14} /> {e.file.name}
                    </span>
                  ) : null}
                  <label className="btn btn-light" style={{ fontSize: 12.5, cursor: "pointer" }}>
                    <Upload size={14} /> {e.file ? "Replace certificate" : "Upload certificate"}
                    <input type="file" style={{ display: "none" }}
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                      onChange={(ev) => attach(e.id, ev.target.files && ev.target.files[0])} />
                  </label>
                  {busy === e.id ? <span className="muted" style={{ fontSize: 12.5 }}>Uploading...</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : !form ? (
        <div className="muted" style={{ fontSize: 13.5, marginTop: 14 }}>
          No frameworks added yet.
        </div>
      ) : null}

      {/* ---------------------------------------------------------- the form */}
      {form ? (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "var(--bg)" }}>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Framework or route</label>
          <select value={form.frameworkId} style={inputStyle}
            onChange={(ev) => setForm({ ...form, frameworkId: ev.target.value })}>
            <option value="">Choose one...</option>
            {FRAMEWORKS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.freeText ? f.name : f.provider + " — " + f.name}
              </option>
            ))}
          </select>
          {chosen ? <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{chosen.why}</div> : null}

          {/* Secondary detail only appears once a route is chosen. */}
          {chosen ? (
            <div style={{ marginTop: 12 }}>
              {chosen.freeText ? (
                <>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Name of the framework or arrangement</label>
                  <input value={form.otherName} style={inputStyle}
                    placeholder="e.g. London Procurement Partnership, or NHS Professionals staff bank"
                    onChange={(ev) => setForm({ ...form, otherName: ev.target.value })} />
                </>
              ) : null}

              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, margin: "12px 0 6px" }}>
                Framework reference <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
              </label>
              <input value={form.reference} style={inputStyle} placeholder="e.g. RM6397"
                onChange={(ev) => setForm({ ...form, reference: ev.target.value })} />

              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, margin: "12px 0 6px" }}>
                Lots you hold <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional, separate with commas)</span>
              </label>
              <input value={form.lotsText} style={inputStyle} placeholder="e.g. Lot 1, Lot 4, Lot 9"
                onChange={(ev) => setForm({ ...form, lotsText: ev.target.value })} />

              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, margin: "12px 0 6px" }}>Your position</label>
              <select value={form.status} style={inputStyle}
                onChange={(ev) => setForm({ ...form, status: ev.target.value })}>
                {FRAMEWORK_STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>
                Only Awarded and Subcontractor count towards your rating. The others are
                still worth recording, and hospitals can see them.
              </div>

              <div className="row" style={{ gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Awarded on</label>
                  <input type="date" value={form.awardedOn} style={inputStyle}
                    onChange={(ev) => setForm({ ...form, awardedOn: ev.target.value })} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Expires or reviewed</label>
                  <input type="date" value={form.expiresOn} style={inputStyle}
                    onChange={(ev) => setForm({ ...form, expiresOn: ev.target.value })} />
                </div>
              </div>
            </div>
          ) : null}

          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            <button className="btn btn-primary" style={{ fontSize: 13 }}
              disabled={!form.frameworkId || busy === "save"} onClick={save}>
              {busy === "save" ? "Saving..." : "Add this framework"}
            </button>
            <button className="btn btn-light" style={{ fontSize: 13 }} onClick={() => { setForm(null); setMsg(""); }}>Cancel</button>
          </div>
        </div>
      ) : null}

      {msg ? <div style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{msg}</div> : null}

      <div className="muted" style={{ fontSize: 12, marginTop: 14, lineHeight: 1.55 }}>
        Certificates are stored privately and are never published. Only the Qura team
        can open them, through a link that expires after five minutes.
      </div>
    </div>
  );
}
