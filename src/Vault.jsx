// The clinician's document vault.
//
// The screen has to do two jobs at once: make uploading straightforward, and
// make it obvious what is shared with whom. A clinician handing over a passport
// and a DBS number deserves to see exactly where each one goes.
//
// So every type states its own rule on the card, not in a policy page nobody
// opens. DBS says we record the number rather than the certificate.
// Occupational health says the report stays private. Those sentences are the
// difference between a vault someone trusts and one they abandon halfway.

import React, { useState, useEffect, useCallback } from "react";
import { Upload, Trash2, FileText, Check, AlertTriangle, Eye, Lock, Shield } from "lucide-react";
import { PageHead } from "./components/ui.jsx";
import { DOC_TYPES, RETENTION, isExpired } from "./data/vault.js";
import { supabase } from "./supabase.js";

const authHeaders = async (json) => {
  let t = "";
  try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const h = t ? { Authorization: "Bearer " + t } : {};
  if (json) h["content-type"] = "application/json";
  return h;
};

const input = {
  width: "100%", padding: "10px 12px", border: "1px solid var(--line)",
  borderRadius: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit",
};

export default function Vault() {
  const [docs, setDocs] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState(null);   // { type, meta, expiresOn, shared }

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/vault", { headers: await authHeaders(false) });
      if (r.ok) { const j = await r.json(); setDocs(j.documents || []); }
      else setDocs([]);
    } catch (e) { setDocs([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (t, file) => {
    if (!file) return;
    // 3MB, not the bucket's 10MB: the file is sent as base64 in a JSON body and
    // a serverless request is capped around 4.5MB, so anything larger fails at
    // the edge with an opaque error rather than this message.
    if (file.size > 3 * 1024 * 1024) {
      setMsg("That file is over 3MB. Please upload a smaller copy, or scan it as a PDF rather than photographing it.");
      return;
    }
    setBusy(t.id); setMsg("");
    try {
      const data = await new Promise((ok, no) => {
        const fr = new FileReader();
        fr.onload = () => ok(fr.result);
        fr.onerror = () => no(new Error("read failed"));
        fr.readAsDataURL(file);
      });
      const r = await fetch("/api/vault", {
        method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ type: t.id, label: t.label, file: { name: file.name, type: file.type, data } }),
      });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not upload that.");
      else load();
    } catch (e) { setMsg("Could not upload that file."); }
    setBusy("");
  };

  const saveMeta = async () => {
    setBusy("meta"); setMsg("");
    try {
      const r = await fetch("/api/vault", {
        method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ type: form.type, label: form.label, meta: form.meta,
                               expiresOn: form.expiresOn, shared: form.shared !== false }),
      });
      const j = await r.json();
      if (!r.ok) setMsg(j.error || "Could not save that.");
      else { setForm(null); load(); }
    } catch (e) { setMsg("Could not save that."); }
    setBusy("");
  };

  const remove = async (id) => {
    setBusy(id);
    try {
      await fetch("/api/vault", { method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ remove: id }) });
      load();
    } catch (e) {}
    setBusy("");
  };

  const open = async (id) => {
    setBusy(id);
    try {
      const r = await fetch("/api/vault?open=" + encodeURIComponent(id), { headers: await authHeaders(false) });
      const j = await r.json();
      if (r.ok && j.url) window.open(j.url, "_blank", "noopener");
      else setMsg(j.error || "Could not open that.");
    } catch (e) {}
    setBusy("");
  };

  const toggleShare = async (d) => {
    setBusy(d.id);
    try {
      await fetch("/api/vault", { method: "POST", headers: await authHeaders(true),
        body: JSON.stringify({ id: d.id, type: d.type, label: d.label,
                               expiresOn: d.expiresOn, meta: d.meta, shared: !d.shared }) });
      load();
    } catch (e) {}
    setBusy("");
  };

  if (docs === null) {
    return <div><PageHead title="My documents" sub="Your credentials, held once" />
      <div className="muted">Loading...</div></div>;
  }

  const held = (typeId) => docs.filter((d) => d.type === typeId);

  return (
    <div>
      <PageHead title="My documents"
        sub="Upload once. Share only what you choose, with organisations you choose." />

      {/* The promises, stated up front. A vault asks for a lot of trust and the
          answers should not be somewhere else. */}
      <div className="card" style={{ padding: 16, marginBottom: 18 }}>
        <div className="row" style={{ gap: 9, alignItems: "flex-start" }}>
          <Shield size={17} color="var(--teal)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.65 }}>
            Documents are stored privately and never published. An organisation sees a
            document only where you have shared it, and only while it is in date. Every
            time one is opened we record who opened it and when, and you can ask us for
            that list. Delete your account and everything here is removed within{" "}
            {RETENTION.afterDeletionDays} days.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {DOC_TYPES.map((t) => {
          const mine = held(t.id);
          const meta = t.stores === "metadata";
          return (
            <div key={t.id} className="card" style={{ padding: 18 }}>
              <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{t.label}</span>
                    {t.required ? <span className="chip" style={{ fontSize: 10.5 }}>Recommended</span> : null}
                    {meta ? <span className="chip" style={{ fontSize: 10.5, background: "var(--cyan-soft)", color: "var(--teal)" }}>
                      <Lock size={10} /> Details only
                    </span> : null}
                  </div>
                  {/* The rule for this type, on the card. */}
                  <div className="muted" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.55, maxWidth: 560 }}>{t.hint}</div>
                </div>

                {meta ? (
                  <button className="btn btn-light" style={{ fontSize: 13 }}
                    onClick={() => setForm({ type: t.id, label: t.label, meta: {}, expiresOn: "", shared: true })}>
                    {mine.length ? "Update" : "Add details"}
                  </button>
                ) : (
                  <label className="btn btn-light" style={{ fontSize: 13, cursor: "pointer" }}>
                    <Upload size={14} /> {busy === t.id ? "Uploading..." : (mine.length && !t.multiple ? "Replace" : "Upload")}
                    <input type="file" style={{ display: "none" }} accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                      onChange={(e) => upload(t, e.target.files && e.target.files[0])} />
                  </label>
                )}
              </div>

              {mine.length ? (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {mine.map((d) => {
                    const out = isExpired(d);
                    return (
                      <div key={d.id} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg)" }}>
                        <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div className="row" style={{ gap: 8, minWidth: 0 }}>
                            {d.file ? <FileText size={14} color="var(--muted)" /> : <Check size={14} color="var(--ok)" />}
                            <span style={{ fontSize: 13.5 }}>
                              {d.file ? d.file.name : Object.values(d.meta || {}).filter(Boolean).join(" · ") || "Recorded"}
                            </span>
                          </div>
                          <div className="row" style={{ gap: 6 }}>
                            {d.file ? (
                              <button className="btn btn-ghost" style={{ fontSize: 12 }} disabled={busy === d.id}
                                onClick={() => open(d.id)}><Eye size={13} /> View</button>
                            ) : null}
                            <button className="btn btn-ghost" style={{ fontSize: 12 }} disabled={busy === d.id}
                              onClick={() => remove(d.id)}><Trash2 size={13} /></button>
                          </div>
                        </div>

                        <div className="row" style={{ gap: 10, marginTop: 7, flexWrap: "wrap" }}>
                          {d.expiresOn ? (
                            <span className="row" style={{ fontSize: 12, gap: 5, color: out ? "var(--red)" : "var(--muted)" }}>
                              {out ? <AlertTriangle size={12} /> : null}
                              {out ? "Expired " : "Expires "}{d.expiresOn}
                            </span>
                          ) : null}
                          {/* An OH report is never shared, so no toggle is offered
                              for it — offering one we would ignore would be a lie. */}
                          {t.reportPrivate && d.file ? (
                            <span className="chip" style={{ fontSize: 10.5 }}><Lock size={10} /> Private to you</span>
                          ) : (
                            <button className="btn btn-ghost" style={{ fontSize: 12 }} disabled={busy === d.id}
                              onClick={() => toggleShare(d)}>
                              {d.shared ? "Shared with organisations" : "Not shared"}
                            </button>
                          )}
                        </div>

                        {out ? (
                          <div style={{ fontSize: 12, marginTop: 6, color: "var(--red)" }}>
                            Hidden from organisations until you replace it.
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* The metadata form, inline under its own type. */}
              {form && form.type === t.id ? (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: "var(--bg)" }}>
                  {(t.fields || []).map((f) => (
                    <div key={f.id} style={{ marginBottom: 10 }}>
                      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>
                        {f.label}{f.required ? "" : " (optional)"}
                      </label>
                      {f.options ? (
                        <select style={input} value={(form.meta || {})[f.id] || ""}
                          onChange={(e) => setForm({ ...form, meta: { ...form.meta, [f.id]: e.target.value } })}>
                          <option value="">Choose...</option>
                          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f.type === "boolean" ? (
                        <label className="row" style={{ gap: 8, fontSize: 13.5, cursor: "pointer" }}>
                          <input type="checkbox" checked={Boolean((form.meta || {})[f.id])}
                            onChange={(e) => setForm({ ...form, meta: { ...form.meta, [f.id]: e.target.checked } })} />
                          Yes
                        </label>
                      ) : (
                        <input style={input} type={f.type === "date" ? "date" : "text"}
                          value={(form.meta || {})[f.id] || ""}
                          onChange={(e) => setForm({ ...form, meta: { ...form.meta, [f.id]: e.target.value } })} />
                      )}
                    </div>
                  ))}
                  {t.expires ? (
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 5 }}>Valid until</label>
                      <input style={input} type="date" value={form.expiresOn}
                        onChange={(e) => setForm({ ...form, expiresOn: e.target.value })} />
                    </div>
                  ) : null}
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn btn-primary" style={{ fontSize: 13 }} disabled={busy === "meta"} onClick={saveMeta}>
                      {busy === "meta" ? "Saving..." : "Save"}
                    </button>
                    <button className="btn btn-light" style={{ fontSize: 13 }} onClick={() => setForm(null)}>Cancel</button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {msg ? <div style={{ color: "var(--red)", fontSize: 13.5, marginTop: 14 }}>{msg}</div> : null}
    </div>
  );
}
