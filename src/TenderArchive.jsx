// Tender Intelligence Archive on the website (1 October 2026). Shown as the
// "Tender archive" tab on Opportunities. Live, closed and awarded healthcare
// tenders, searchable, each with its Award Information kept apart from the
// original notice, the buyer's history, and a likely reprocurement window
// (always labelled as a Qura estimate). Data: api/tender-archive.js.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import TenderSnapshot from "./TenderSnapshot.jsx";

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

const STATUS_TONE = { LIVE: ["#06776F", "#E6F4F2"], AWARDED: ["#1E54E6", "#EEF3FF"], CLOSED: ["#5A6783", "#EEF1F7"] };
const money = (v, cur) => {
  if (v == null || !isFinite(Number(v))) return null;
  const n = Number(v), sym = !cur || cur === "GBP" ? "£" : cur + " ";
  return sym + (n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, "") + "m" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(Math.round(n)));
};
const ukDate = (v) => { if (!v) return ""; const d = new Date(v); return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };

function Status({ s }) {
  const [fg, bg] = STATUS_TONE[s] || STATUS_TONE.CLOSED;
  return <span className="chip" style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>{s}</span>;
}

function Row({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 190px) 1fr", gap: 12, padding: "8px 0", borderTop: "1px solid var(--line)", fontSize: 13.5 }}>
      <div className="muted" style={{ fontWeight: 600 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Record({ id, onClose, onOpen, onToast }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [snap, setSnap] = useState(false);
  const load = () => call("/api/tender-archive?id=" + encodeURIComponent(id)).then(setD).catch((e) => setErr(e.message));
  useEffect(() => { setD(null); setErr(""); load(); }, [id]);
  const source = () => { call("/api/tender-archive", { action: "source", id }).catch(() => {}); };
  const admin = async (body, done) => { try { await call("/api/tender-archive", body); if (onToast) onToast(done); load(); } catch (e) { setErr(e.message); } };
  const t = d && d.tender;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,13,28,.55)", zIndex: 999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 780, width: "100%", padding: 22 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            {t ? <div className="row" style={{ gap: 8, marginBottom: 6 }}><Status s={t.status} />{t.statusOverride ? <span className="faint" style={{ fontSize: 12 }}>Corrected by Qura{t.statusNote ? ": " + t.statusNote : ""}</span> : null}</div> : null}
            <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.35 }}>{t ? t.title : "Loading..."}</div>
            {t ? <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{t.buyer}</div> : null}
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: "6px 12px" }} onClick={onClose}>Close</button>
        </div>
        {err ? <div style={{ marginTop: 12, color: "#B4433A", fontSize: 13.5 }}>{err}</div> : null}
        {t ? (
          <>
            <div style={{ marginTop: 16, fontWeight: 700, fontSize: 14.5 }}>Original tender</div>
            <Row label="Advertised value">{money(t.advertisedValue, t.currency) ? money(t.advertisedValue, t.currency) + (t.advertisedValueMax ? " to " + money(t.advertisedValueMax, t.currency) : "") : <span className="faint">Not stated in tender</span>}</Row>
            <Row label="Published">{ukDate(t.publishedAt) || <span className="faint">Not stated</span>}</Row>
            <Row label="Closing date">{ukDate(t.closingDate) || <span className="faint">Not stated</span>}</Row>
            <Row label="Contract duration">{t.contractStart || t.contractEnd ? [ukDate(t.contractStart), ukDate(t.contractEnd)].filter(Boolean).join(" to ") : t.durationDays ? Math.round(t.durationDays / 30.4) + " months" : <span className="faint">Not stated in tender</span>}</Row>
            {t.extensionOptions ? <Row label="Extension options">{t.extensionOptions}</Row> : null}
            {t.lots && t.lots.length > 1 ? <Row label="Lots">{t.lots.map((l) => (l.title || "Lot " + l.id) + (l.value ? " (" + money(l.value, t.currency) + ")" : "")).join(" · ")}</Row> : null}
            <Row label="Service">{t.category || <span className="faint">Not stated</span>}</Row>
            {t.procurementRoute ? <Row label="Procurement route">{t.procurementRoute}</Row> : null}
            <Row label="Official source">{t.sourceUrl ? <a href={t.sourceUrl} target="_blank" rel="noreferrer" onClick={source}>{t.source || "Official notice"}</a> : <span className="faint">No longer available</span>}</Row>

            <div style={{ marginTop: 18, fontWeight: 700, fontSize: 14.5 }}>Award Information</div>
            {!d.awards.length ? (
              <div className="faint" style={{ fontSize: 13.5, marginTop: 6 }}>{t.status === "LIVE" ? "Still open for bids." : "No award notice published or matched yet."}</div>
            ) : d.awards.map((a) => (
              <div key={a.id} style={{ borderTop: "1px solid var(--line)", padding: "9px 0", fontSize: 13.5, opacity: a.confirmed === false ? 0.55 : 1 }}>
                <div style={{ fontWeight: 600 }}>{a.supplier || "Supplier not published"}{a.lot ? <span className="faint" style={{ fontWeight: 400 }}> · Lot {a.lot}</span> : null}</div>
                <div className="muted" style={{ marginTop: 2 }}>
                  {[a.value != null ? "Awarded value " + money(a.value, a.currency) : "Awarded value not published", a.date ? "awarded " + ukDate(a.date) : "", a.contractEnd ? "contract to " + ukDate(a.contractEnd) : ""].filter(Boolean).join(" · ")}
                  {a.sourceUrl ? <> · <a href={a.sourceUrl} target="_blank" rel="noreferrer" onClick={source}>award notice</a></> : null}
                </div>
                {d.canEdit ? (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    {a.confirmed === false
                      ? <button className="btn btn-light" style={{ fontSize: 12, padding: "3px 10px" }} onClick={() => admin({ action: "award", awardId: a.id, confirmed: true }, "Award match confirmed")}>Confirm match</button>
                      : <button className="btn btn-light" style={{ fontSize: 12, padding: "3px 10px" }} onClick={() => admin({ action: "award", awardId: a.id, confirmed: false }, "Award hidden")}>Not this tender</button>}
                  </div>
                ) : null}
              </div>
            ))}

            {d.previous || d.reprocurement ? <div style={{ marginTop: 18, fontWeight: 700, fontSize: 14.5 }}>Procurement intelligence</div> : null}
            {d.previous ? (
              <Row label={d.previous.sameService ? "Previous contract" : "Buyer's last award"}>
                <a href="#" onClick={(e) => { e.preventDefault(); onOpen(d.previous.id); }}>{d.previous.title}</a>
                <div className="muted" style={{ marginTop: 2 }}>{[d.previous.suppliers.length ? "Won by " + d.previous.suppliers.join(", ") : "", d.previous.lastAwardValue != null ? "awarded value " + money(d.previous.lastAwardValue) : "", d.previous.awardDate ? ukDate(d.previous.awardDate) : ""].filter(Boolean).join(" · ")}</div>
              </Row>
            ) : null}
            {d.reprocurement ? (
              <Row label="Likely reprocurement window">
                <span style={{ fontWeight: 600 }}>{ukDate(d.reprocurement.windowFrom)} to {ukDate(d.reprocurement.windowTo)}</span> <span className="chip" style={{ fontSize: 10.5, background: "#FFF4E0", color: "#9A5E00" }}>Qura estimate</span>
                <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>Based on the {d.reprocurement.basis} ({ukDate(d.reprocurement.contractEnd)}). {d.reprocurement.caveat}</div>
              </Row>
            ) : null}

            <div style={{ marginTop: 18, fontWeight: 700, fontSize: 14.5 }}>Tender Snapshot</div>
            {d.snapshot ? (
              <div className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>
                The original Snapshot, made {ukDate(d.snapshot.generatedAt)}{d.snapshot.versions > 1 ? " (the notice changed later; " + d.snapshot.versions + " versions kept)" : ""}.{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); setSnap(true); }}>Open it</a>
                {d.snapshot.snapshot && d.snapshot.snapshot.overview ? <div style={{ marginTop: 6, color: "inherit" }}>{d.snapshot.snapshot.overview}</div> : null}
              </div>
            ) : (
              <button className="btn btn-light" style={{ marginTop: 8, fontSize: 13 }} onClick={() => setSnap(true)}>Make a Tender Snapshot</button>
            )}

            {d.history && d.history.length ? (
              <>
                <div style={{ marginTop: 18, fontWeight: 700, fontSize: 14.5 }}>{t.buyer}: other tenders</div>
                {d.history.slice(0, 12).map((h) => (
                  <div key={h.id} className="row" style={{ justifyContent: "space-between", gap: 10, borderTop: "1px solid var(--line)", padding: "8px 0", fontSize: 13.5 }}>
                    <a href="#" style={{ minWidth: 0, flex: 1 }} onClick={(e) => { e.preventDefault(); onOpen(h.id); }}>{h.title}</a>
                    <span className="row" style={{ gap: 8, flexShrink: 0 }}><span className="faint">{ukDate(h.closingDate || h.publishedAt)}</span><Status s={h.status} /></span>
                  </div>
                ))}
              </>
            ) : null}

            {d.canEdit ? (
              <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px dashed var(--line)", fontSize: 12.5 }} className="row">
                <span className="faint" style={{ marginRight: 8 }}>Founders: correct the status</span>
                {["LIVE", "CLOSED", "AWARDED"].map((s) => <button key={s} className="btn btn-light" style={{ fontSize: 12, padding: "3px 10px", marginRight: 6 }} onClick={() => admin({ action: "status", id, status: s }, "Status set to " + s)}>{s}</button>)}
                {t.statusOverride ? <button className="btn btn-ghost" style={{ fontSize: 12, padding: "3px 10px" }} onClick={() => admin({ action: "status", id, status: null }, "Correction removed")}>Use the automatic status</button> : null}
              </div>
            ) : null}
            <div className="faint" style={{ fontSize: 11.5, marginTop: 14, lineHeight: 1.5 }}>From the public notices on {t.source || "the official portal"}. The advertised and awarded values are shown separately and never merged. The official source is definitive.</div>
          </>
        ) : null}
      </div>
      {snap ? <div onClick={(e) => e.stopPropagation()}><TenderSnapshot id={id} onClose={() => { setSnap(false); load(); }} /></div> : null}
    </div>
  );
}

export default function TenderArchive({ onToast }) {
  const [f, setF] = useState({ q: "", status: "", buyer: "", supplier: "", min: "", max: "", from: "", to: "" });
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [more, setMore] = useState(false);

  const search = (p = 1, ff = f) => {
    const qs = new URLSearchParams(Object.entries({ ...ff, page: p }).filter(([, v]) => v !== "" && v != null));
    setErr("");
    call("/api/tender-archive?" + qs.toString()).then((j) => { setData(j); setPage(p); }).catch((e) => setErr(e.message));
  };
  useEffect(() => { search(1); }, []);
  const setStatus = (s) => { const ff = { ...f, status: f.status === s ? "" : s }; setF(ff); search(1, ff); };
  const input = { padding: "9px 12px", fontSize: 13.5 };

  return (
    <div>
      <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, marginBottom: 12, maxWidth: 760 }}>
        Every healthcare tender Qura has seen on Find a Tender and Contracts Finder, kept after it closes: who bought what, for how much, and who won it. The archive started on 1 October 2026 and is working back through the last year.
      </div>
      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <form className="row" style={{ gap: 8, flexWrap: "wrap" }} onSubmit={(e) => { e.preventDefault(); search(1); }}>
          <input className="in" style={{ ...input, flex: 1, minWidth: 220 }} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Search title, buyer or service" />
          <button className="btn btn-primary" type="submit" style={{ fontSize: 13 }}>Search</button>
          <button className="btn btn-ghost" type="button" style={{ fontSize: 13 }} onClick={() => setMore(!more)}>{more ? "Fewer filters" : "More filters"}</button>
        </form>
        {more ? (
          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <input className="in" style={{ ...input, width: 200 }} value={f.buyer} onChange={(e) => setF({ ...f, buyer: e.target.value })} placeholder="Buyer" />
            <input className="in" style={{ ...input, width: 200 }} value={f.supplier} onChange={(e) => setF({ ...f, supplier: e.target.value })} placeholder="Winning supplier" />
            <input className="in" style={{ ...input, width: 130 }} value={f.min} onChange={(e) => setF({ ...f, min: e.target.value.replace(/[^0-9]/g, "") })} placeholder="Min value £" />
            <input className="in" style={{ ...input, width: 130 }} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value.replace(/[^0-9]/g, "") })} placeholder="Max value £" />
            <label className="faint row" style={{ gap: 6, fontSize: 12.5 }}>Closing from <input className="in" type="date" style={input} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
            <label className="faint row" style={{ gap: 6, fontSize: 12.5 }}>to <input className="in" type="date" style={input} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
          </div>
        ) : null}
        <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {["LIVE", "AWARDED", "CLOSED"].map((s) => {
            const [fg, bg] = STATUS_TONE[s];
            const on = f.status === s;
            return <button key={s} className="chip" onClick={() => setStatus(s)} style={{ padding: "6px 12px", cursor: "pointer", border: "1px solid " + (on ? fg : "transparent"), background: on ? bg : "#EEF1F7", color: on ? fg : "#5A6783", fontWeight: 700, fontSize: 12 }}>{s}{data && data.counts && data.counts[s] != null ? " · " + data.counts[s] : ""}</button>;
          })}
        </div>
      </div>
      {err ? <div style={{ color: "#B4433A", fontSize: 13.5, marginBottom: 10 }}>{err}</div> : null}
      {!data ? <div className="muted">Loading...</div> : !data.items.length ? (
        <div className="card muted" style={{ padding: 18 }}>Nothing matches. Try fewer words or another status.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="faint" style={{ fontSize: 12.5 }}>{data.total} tender{data.total === 1 ? "" : "s"}</div>
          {data.items.map((t) => (
            <div key={t.id} className="card lift" style={{ padding: 16, cursor: "pointer" }} onClick={() => setOpen(t.id)}>
              <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.35 }}>{t.title}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{[t.buyer, t.category].filter(Boolean).join(" · ")}</div>
                  {t.awards.length ? <div style={{ fontSize: 12.5, marginTop: 5, color: "#1E54E6" }}>Won by {[...new Set(t.awards.map((a) => a.supplier).filter(Boolean))].slice(0, 3).join(", ")}{t.awardCount > 3 ? " and " + (t.awardCount - 3) + " more" : ""}</div> : null}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <Status s={t.status} />
                  <div style={{ fontWeight: 700, fontSize: 14, marginTop: 6 }}>{money(t.advertisedValue, t.currency) || <span className="faint" style={{ fontWeight: 400, fontSize: 12.5 }}>Value not stated</span>}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{t.closingDate ? (t.status === "LIVE" ? "Closes " : "Closed ") + ukDate(t.closingDate) : ukDate(t.publishedAt)}</div>
                </div>
              </div>
            </div>
          ))}
          {data.pages > 1 ? (
            <div className="row" style={{ gap: 8, justifyContent: "center", marginTop: 6 }}>
              <button className="btn btn-light" disabled={page <= 1} onClick={() => search(page - 1)}>Previous</button>
              <span className="faint" style={{ fontSize: 13, alignSelf: "center" }}>Page {page} of {data.pages}</span>
              <button className="btn btn-light" disabled={page >= data.pages} onClick={() => search(page + 1)}>Next</button>
            </div>
          ) : null}
        </div>
      )}
      {open ? <Record id={open} onClose={() => setOpen(null)} onOpen={setOpen} onToast={onToast} /> : null}
    </div>
  );
}
