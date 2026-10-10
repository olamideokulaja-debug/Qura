// SEND Intelligence inside the Qura app (9 October 2026). Folded in from the standalone pilot
// page (public/send.html) as a section of the supplier and operator workspace, per Olamide's
// decision: one Qura account, SEND as a specialism within the supplier lens, not a new account
// type. Data comes from the same endpoints (api/send*.js). Suppliers without SEND see the offer.
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase.js";

async function token() {
  try { const { data } = await supabase.auth.getSession(); return (data && data.session && data.session.access_token) || ""; } catch (e) { return ""; }
}
async function call(path, body) {
  const t = await token();
  const r = await fetch(path, body
    ? { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json" }, body: JSON.stringify(body) }
    : { headers: { authorization: "Bearer " + t } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || j.message || "Something went wrong. Please try again."); e.status = r.status; throw e; }
  return j;
}
async function download(path, onToast) {
  try {
    const t = await token();
    const r = await fetch(path, { headers: { authorization: "Bearer " + t } });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || j.message || "Export failed"); }
    const blob = await r.blob();
    const name = ((r.headers.get("content-disposition") || "").match(/filename="([^"]+)"/) || [])[1] || "qura-send.csv";
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    onToast && onToast("Downloaded " + name);
  } catch (e) { onToast && onToast(e.message); }
}

const SETTING = { special: "Special school", ap: "Alternative provision", mainstream_unit: "Mainstream with SEN unit" };
const FAM = { speech_language: "Speech and language", occupational_therapy: "Occupational therapy", physiotherapy: "Physiotherapy", therapies: "Therapies leadership", psychology: "Psychology", send_teaching: "SEND teaching", teaching_support: "Teaching support", send_leadership: "SEND leadership", mental_health: "Mental health", nursing_care: "Nursing and care", send_admin: "SEND administration", other_specialist: "Other specialists" };
const CATS = { transport: "Transport", therapy: "Therapy", psychology: "Psychology and assessment", alternative_provision: "Alternative provision", placements: "Placements and places", staffing: "Staffing", tuition: "Tuition", advice: "Advice and mediation", other: "Other SEND" };
const date = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" }) : "");
const pct = (v) => (v == null ? "—" : (v > 0 ? "+" : "") + v + "%");
const money = (v) => (v == null ? "—" : v >= 1e6 ? "£" + (v / 1e6).toFixed(1) + "m" : v >= 1e3 ? "£" + Math.round(v / 1e3) + "k" : "£" + Math.round(v));
const gbp = (n) => "£" + Number(n).toLocaleString("en-GB");

const TH = { textAlign: "left", padding: "8px 6px", fontSize: 11.5, color: "var(--muted, #5A6783)", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid var(--line)" };
const TD = { padding: "8px 6px", borderBottom: "1px solid var(--line)", verticalAlign: "top", fontSize: 13 };
const NOTE = { background: "#FFF8E6", border: "1px solid #F3DFB0", color: "#6B4E12", borderRadius: 10, padding: "10px 12px", fontSize: 12.5, marginBottom: 12 };
const TAG = { display: "inline-block", fontSize: 11, borderRadius: 999, padding: "2px 8px", background: "#EEF3FA", margin: "1px 3px 1px 0" };
const FLAG = (bg, fg) => ({ ...TAG, background: bg, color: fg, fontWeight: 700 });

function Table({ head, children, empty, cols }) {
  const rows = React.Children.toArray(children);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{head.map((h, i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
        <tbody>{rows.length ? rows : <tr><td style={TD} colSpan={cols || head.length} className="muted">{empty}</td></tr>}</tbody>
      </table>
    </div>
  );
}
// A figure. With onClick it is also a shortcut to the page behind it (Olamide, 9 October 2026:
// "for lazy people"), alongside the tabs.
function Stat({ value, label, onClick }) {
  const inner = <><div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div><div className="muted" style={{ fontSize: 12 }}>{label}{onClick ? " ›" : ""}</div></>;
  if (!onClick) return <div className="card" style={{ padding: 12 }}>{inner}</div>;
  return <button type="button" className="card" onClick={onClick} title={"Open: " + label} style={{ padding: 12, textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit", width: "100%" }}>{inner}</button>;
}
function Grid({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 14 }}>{children}</div>; }
function Pager({ total, page, size, onPage }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (size || 50)));
  return <div className="row" style={{ gap: 8, alignItems: "center", marginTop: 10 }}>{page > 1 && <button className="btn btn-light" onClick={() => onPage(page - 1)}>Previous</button>}<span className="muted" style={{ fontSize: 12.5 }}>Page {page} of {pages}</span>{page < pages && <button className="btn btn-light" onClick={() => onPage(page + 1)}>Next</button>}</div>;
}
function Loading() { return <div className="muted" style={{ padding: 30 }}>Loading…</div>; }
function Err({ e }) { return <div className="card" style={{ padding: 16, color: "#B4433A" }}>{e}</div>; }

function useLoad(path, deps) {
  const [st, setSt] = useState({ data: null, err: null, loading: true });
  const [n, setN] = useState(0);
  useEffect(() => { let live = true; setSt((s) => ({ ...s, loading: true })); call(path).then((d) => live && setSt({ data: d, err: null, loading: false })).catch((e) => live && setSt({ data: null, err: e.message, loading: false })); return () => { live = false; }; }, [path, n, ...(deps || [])]);
  return { ...st, reload: () => setN((x) => x + 1) };
}

function Actions({ org, role, url, note, draft, onToast, setModal }) {
  const add = async () => { try { const j = await call("/api/pipeline", { org, role, source: "SEND Intelligence", notice_url: url, note }); onToast(j.alreadyThere ? "Already in your pipeline." : "Added to your pipeline."); } catch (e) { onToast(e.message); } };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5 }}>Advert</a>}
      <button className="btn btn-light" style={{ fontSize: 12, padding: "4px 10px" }} onClick={add}>Pipeline</button>
      {draft && <button className="btn btn-light" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setModal(draft)}>Draft email</button>}
    </div>
  );
}

function DraftModal({ req, onClose }) {
  const [st, setSt] = useState({ loading: true });
  const box = useRef(null);
  useEffect(() => { call("/api/send-territory", { action: "outreach", ...req }).then((j) => setSt({ j })).catch((e) => setSt({ err: e.message })); }, [req]);
  const copy = async () => { try { await navigator.clipboard.writeText(box.current.value); setSt((s) => ({ ...s, copied: true })); } catch (e) { box.current.select(); } };
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(10,23,48,.5)", display: "grid", placeItems: "center", padding: 16, zIndex: 3000 }}>
      <div className="card" style={{ maxWidth: 640, width: "100%", padding: 16, maxHeight: "90vh", overflow: "auto", background: "#fff" }}>
        <b>Outreach draft</b>
        {st.loading && <p className="muted">Writing a first draft from the school's public record…</p>}
        {st.err && <p style={{ color: "#B4433A" }}>{st.err}</p>}
        {st.j && <>
          <div style={{ ...NOTE, marginTop: 8 }}>{st.j.note} Fill in everything in [square brackets]. Qura does not send this for you.</div>
          <textarea ref={box} className="in" defaultValue={st.j.draft} style={{ width: "100%", minHeight: 280, fontFamily: "inherit", fontSize: 13, lineHeight: 1.5 }} />
          <div className="row" style={{ gap: 8, marginTop: 10 }}><button className="btn btn-primary" onClick={copy}>{st.copied ? "Copied" : "Copy"}</button>{st.j.source_url && <a href={st.j.source_url} target="_blank" rel="noopener noreferrer">Check the advert</a>}</div>
        </>}
        <div style={{ textAlign: "right", marginTop: 8 }}><button className="btn btn-light" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

// ---------------- Offer (no SEND yet) ----------------
function Offer({ offer, onToast, reload }) {
  const [annual, setAnnual] = useState(false);
  const [busy, setBusy] = useState("");
  const [sent, setSent] = useState(false);
  const s = offer.sales || {}, f = s.founding || {}, p = offer.prices || {};
  const buy = async (plan) => {
    setBusy(plan);
    try { const t = await token(); const r = await fetch("/api/checkout", { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json" }, body: JSON.stringify({ plan, annual }) }); const j = await r.json().catch(() => ({})); if (!r.ok || !j.url) throw new Error(j.error || "Checkout is not available yet."); window.location.href = j.url; }
    catch (e) { onToast(e.message); setBusy(""); }
  };
  const ask = async () => { try { await call("/api/sales-enquiry", { name: "SEND Intelligence enquiry", plan: "SEND Intelligence", message: "Please tell me when SEND Intelligence opens, and about the Founding SEND Partner places." }); setSent(true); } catch (e) { onToast(e.message); } };
  const price = (k) => annual ? gbp(p[k].annualMonthly) + " a month, billed annually" : gbp(p[k].monthly) + " a month";
  const half = (k) => gbp(Math.round((annual ? p[k].annualMonthly : p[k].monthly) / 2));
  const canBuy = s.open && offer.stripeReady;
  return (
    <div>
      {/* The upsell film (9 October 2026): 30 seconds for suppliers already on Qura. Captions on, as most watch muted. */}
      <video controls preload="none" playsInline poster="/qura-send-upsell-poster.jpg"
        style={{ width: "100%", maxWidth: 720, display: "block", borderRadius: 14, background: "#0A1730", marginBottom: 14 }}>
        <source src="/qura-send-upsell.mp4" type="video/mp4" />
        <track kind="captions" srcLang="en" label="English" default src="/qura-send-upsell-subtitles.vtt" />
      </video>
      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>SEND Intelligence</div>
        <p style={{ marginTop: 0 }}>Every special school, alternative provision and school with an SEN unit in England, with Scotland, Wales and Northern Ireland from their official lists, the SEND vacancies they post on their own websites each day, council demand and funding, and SEND tenders, early signals and contracts ending soon. Built for specialist staffing and therapy suppliers.</p>
        <ul style={{ margin: "0 0 0 18px", padding: 0, lineHeight: 1.7, fontSize: 14 }}>
          <li>About 5,000 schools, with daily checks of their jobs pages</li>
          <li>Territories with morning alerts and a Monday briefing</li>
          <li>Council EHC plan growth, assessment delays, high-needs funding, Ofsted concerns</li>
          <li>SEND tenders, pre-tender notices, frameworks and renewals</li>
          <li>AI first-draft outreach, exports and your Qura pipeline</li>
        </ul>
      </div>
      {f.active && f.left > 0 && <div style={{ ...NOTE, background: "#E8F7F5", borderColor: "#B6E5DF", color: "#0B5E57" }}><b>Founding SEND Partner:</b> the first {f.places} SEND customers get 50% off for 12 months, with no setup fee. {f.left} of {f.places} places left.</div>}
      <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: "center" }}>
        <button className={"btn " + (!annual ? "btn-primary" : "btn-light")} onClick={() => setAnnual(false)}>Monthly</button>
        <button className={"btn " + (annual ? "btn-primary" : "btn-light")} onClick={() => setAnnual(true)}>Annual</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        {[["send:addon", "addon", "SEND add-on", "Add SEND Intelligence to your Qura account. Your healthcare plan stays as it is."], ["send:bundle", "bundle", "Growth + SEND bundle", "Supplier Growth and SEND Intelligence together, for suppliers who want both."]].map(([plan, k, title, sub]) => (
          <div key={plan} className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800 }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 800, margin: "6px 0" }}>{price(k)}</div>
            {f.active && f.left > 0 && <div className="muted" style={{ fontSize: 12.5 }}>Founding SEND Partner: {half(k)} a month for the first 12 months</div>}
            <p className="muted" style={{ fontSize: 13 }}>{sub}</p>
            {canBuy ? <button className="btn btn-primary" disabled={!!busy} onClick={() => buy(plan)}>{busy === plan ? "Opening checkout…" : "Choose"}</button> : null}
          </div>
        ))}
      </div>
      {!canBuy && <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <p style={{ marginTop: 0 }}>{s.opensNote || "SEND Intelligence is in a paid pilot and opens to more suppliers soon."}</p>
        {sent ? <p className="muted">Thank you. A founder will be in touch.</p> : <button className="btn btn-primary" onClick={ask}>Tell me when it opens</button>}
      </div>}
      {offer.founder && <FounderSales offer={offer} onToast={onToast} reload={reload} />}
    </div>
  );
}
function FounderSales({ offer, onToast, reload }) {
  const s = offer.sales || {};
  const save = async (patch) => { try { await call("/api/send-offer", patch); onToast("Saved"); reload(); } catch (e) { onToast(e.message); } };
  return (
    <div className="card" style={{ padding: 16, marginTop: 14 }}>
      <b>Founders: SEND sales</b>
      <p className="muted" style={{ fontSize: 13 }}>Sales are {s.open ? "open" : "closed"}. Stripe prices are {offer.stripeReady ? "set" : "not set yet"}; Founding SEND Partner coupon is {offer.foundingCoupon ? "set" : "not set yet"}. {s.founding ? s.founding.used + " of " + s.founding.places + " founding places used." : ""} Keep sales closed until Social Personnel's 3-month head start ends.</p>
      <div className="row" style={{ gap: 8 }}>{s.open ? <button className="btn btn-light" onClick={() => save({ open: false })}>Close sales</button> : <button className="btn btn-primary" onClick={() => save({ open: true })}>Open sales</button>}</div>
    </div>
  );
}

// ---------------- Views ----------------
function Overview({ go }) {
  const { data: s, err, loading } = useLoad("/api/send?view=summary");
  if (loading) return <Loading />; if (err) return <Err e={err} />;
  const e = s.england || {}, live = s.live || {}; const uk = s.uk || null;
  return (<div>
    <Grid>
      {live.vacancies != null && <Stat value={live.vacancies.toLocaleString()} label="live SEND vacancies" onClick={() => go("vacancies")} />}
      {live.open_tenders != null && <Stat value={live.open_tenders.toLocaleString()} label="open SEND tenders" onClick={() => go("tenders")} />}
      <Stat value={((uk || e).schools || 0).toLocaleString()} label={uk ? "schools in scope, UK" : "schools in scope, England"} onClick={() => go("schools")} />
      <Stat value={((uk || e).special || 0).toLocaleString()} label="special schools" onClick={() => go("schools", { setting: "special" })} />
      <Stat value={((uk || e).ap || 0).toLocaleString()} label="alternative provision and PRUs" onClick={() => go("schools", { setting: "ap" })} />
      <Stat value={((uk || e).mainstream_units || 0).toLocaleString()} label="mainstream with SEN units" onClick={() => go("schools", { setting: "mainstream_unit" })} />
      {uk && uk.nations && ["scotland", "wales", "northern_ireland"].map((n) => <Stat key={n} value={(uk.nations[n] || 0).toLocaleString()} label={"schools in scope, " + NATIONS[n]} onClick={() => go("schools", { nation: n })} />)}
      <Stat value={(e.trusts || 0).toLocaleString()} label="academy trusts" />
      <Stat value={e.local_authorities || 0} label="councils" onClick={() => go("councils")} />
    </Grid>
    <div className="card" style={{ padding: 16, marginBottom: 14 }}><b>Opening soon</b> <span className="muted" style={{ fontSize: 12.5 }}>Schools recorded as "proposed to open". New schools recruit a whole staff before they open.</span>
      <Table head={["School", "Type", "Council", "Opens"]} empty="None at the moment.">{(s.opening_soon || []).map((o, i) => <tr key={i}><td style={TD}><button type="button" onClick={() => go("schools", { q: o.name })} style={{ background: "none", border: 0, padding: 0, color: "var(--teal, #0E8C7E)", fontWeight: 600, cursor: "pointer", font: "inherit", textAlign: "left" }}>{o.name}</button></td><td style={TD}>{o.establishment_type}</td><td style={TD}>{o.la_name}</td><td style={TD}>{date(o.open_date)}</td></tr>)}</Table>
    </div>
    <div className="card" style={{ padding: 16 }}><b>Monitoring</b><p className="muted" style={{ fontSize: 13 }}>{(s.sources && s.sources.registered || 0).toLocaleString()} school websites registered; {(s.sources && s.sources.discovered || 0).toLocaleString()} checked for a jobs page so far. {s.sources && s.sources.coverage_note}</p><p className="muted" style={{ fontSize: 13 }}>School list last updated from the official file: {date(s.last_sync && s.last_sync.at) || "pending"}.</p></div>
  </div>);
}

function Vacancies({ onToast, setModal }) {
  const [fam, setFam] = useState(""); const [page, setPage] = useState(1);
  const { data: v, err, loading } = useLoad("/api/send?view=vacancies&page=" + page + (fam ? "&family=" + fam : ""));
  return (<div>
    {v && <div style={NOTE}>{v.note}</div>}
    <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
      <select className="in" value={fam} onChange={(e) => { setFam(e.target.value); setPage(1); }}><option value="">All professions</option>{Object.entries(FAM).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      {v && <span className="muted" style={{ fontSize: 12.5 }}>{(v.total || 0).toLocaleString()} live vacancies</span>}
      <button className="btn btn-light" onClick={() => download("/api/send-export?what=vacancies" + (fam ? "&family=" + fam : ""), onToast)}>Download CSV</button>
    </div>
    {loading ? <Loading /> : err ? <Err e={err} /> : <div className="card" style={{ padding: 12 }}>
      <Table head={["Role", "School", "Council", "Pay", "Closes", "Checked", ""]} empty="No live vacancies yet.">{v.items.map((x) => { const o = x.send_organisations || {}; return <tr key={x.id}><td style={TD}><b>{x.original_title}</b><br /><span style={TAG}>{FAM[x.profession_family] || x.profession_family}</span></td><td style={TD}>{o.name}<br /><span className="muted" style={{ fontSize: 12 }}>{SETTING[o.setting_group] || ""}</span></td><td style={TD}>{o.la_name}</td><td style={TD}>{x.salary_text}</td><td style={TD}>{date(x.closing_at)}</td><td style={TD} className="muted">{date(x.last_verified_at)}</td><td style={TD}><Actions org={o.name} role={x.original_title} url={x.source_url} note="From SEND Intelligence" draft={{ vacancy_id: x.id }} onToast={onToast} setModal={setModal} /></td></tr>; })}</Table>
      <Pager total={v.total} page={v.page} size={v.pageSize} onPage={setPage} />
    </div>}
  </div>);
}

function Schools({ onToast, setModal, preset }) {
  const p0 = preset || {};
  const [q, setQ] = useState(p0.q || ""); const [qq, setQQ] = useState(p0.q || ""); const [st, setSt] = useState(p0.setting || ""); const [page, setPage] = useState(1); const [nat, setNat] = useState(p0.nation || "");
  const { data: r, err, loading } = useLoad("/api/send?view=organisations&page=" + page + (qq ? "&q=" + encodeURIComponent(qq) : "") + (st ? "&setting=" + st : "") + (nat ? "&nation=" + nat : ""));
  return (<div>
    <form className="row" style={{ gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }} onSubmit={(e) => { e.preventDefault(); setQQ(q); setPage(1); }}>
      <input className="in" placeholder="Search school name" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="in" value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }}><option value="">All settings</option>{Object.entries(SETTING).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <select className="in" value={nat} onChange={(e) => { setNat(e.target.value); setPage(1); }}><option value="">All UK</option>{Object.entries(NATIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <button className="btn btn-primary" type="submit">Search</button>
      {r && <span className="muted" style={{ fontSize: 12.5 }}>{(r.total || 0).toLocaleString()} schools</span>}
      <button type="button" className="btn btn-light" onClick={() => download("/api/send-export?what=schools" + (st ? "&setting=" + st : "") + (nat ? "&nation=" + nat : ""), onToast)}>Download CSV</button>
    </form>
    {(nat === "scotland" || nat === "wales" || nat === "northern_ireland") && <p className="muted" style={{ fontSize: 12.5, marginTop: -4 }}>{nat === "scotland" ? "From the Scottish Government's school contact list: schools with a special department or an integrated special unit. The Scottish Government asks commercial callers to seek permission from the local authority before contacting schools directly." : nat === "wales" ? "From the Welsh Government's address list: maintained special schools and pupil referral units. Independent special schools and SEN units are not yet included." : "From the Department of Education's school census: special schools and schools with specialist provision in mainstream."} Official lists for these nations do not include EHC plan or inspection data, and most give no website, so vacancy checks cover fewer of their schools.</p>}
    {loading ? <Loading /> : err ? <Err e={err} /> : <div className="card" style={{ padding: 12 }}>
      <Table head={["School", "Council", "Pupils", "With EHC plan", "SEN provision", ""]} empty="No schools match.">{r.items.map((o) => <tr key={o.id}><td style={TD}><b>{o.name}</b><br /><span className="muted" style={{ fontSize: 12 }}>{o.establishment_type}{o.status !== "Open" ? " · " + o.status : ""}</span>{o.trust_name && <><br /><span className="muted" style={{ fontSize: 12 }}>{o.trust_name}</span></>}</td><td style={TD}>{o.la_name}<br /><span className="muted" style={{ fontSize: 12 }}>{o.postcode}</span></td><td style={TD}>{o.pupils ?? ""}</td><td style={TD}>{o.sen_ehcp ?? ""}</td><td style={TD}>{(o.sen_provision || []).map((p, i) => <span key={i} style={TAG}>{String(p).split(" - ")[0]}</span>)}{o.resourced_provision_type && <span style={TAG}>{o.resourced_provision_type}</span>}</td><td style={TD}>{o.website && <><a href={o.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5 }}>Website</a><br /></>}<a href={o.source_ref} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5 }}>Official record</a><Actions org={o.name} role="SEND staffing" url={null} note="From SEND Intelligence" draft={{ organisation_id: o.id }} onToast={onToast} setModal={setModal} /></td></tr>)}</Table>
      <Pager total={r.total} page={r.page} size={r.pageSize} onPage={setPage} />
    </div>}
  </div>);
}

function Territories({ onToast, setModal }) {
  const [mode, setMode] = useState({ v: "list" });
  const { data: r, err, loading, reload } = useLoad("/api/send-territory?view=list");
  if (mode.v === "edit") return <TerritoryForm id={mode.id} onDone={() => { setMode({ v: "list" }); reload(); }} onToast={onToast} />;
  if (mode.v === "open") return <TerritoryDetail id={mode.id} onBack={() => setMode({ v: "list" })} onToast={onToast} setModal={setModal} />;
  return (<div>
    <div style={NOTE}>A territory is the councils, settings and professions you cover. Qura emails you new matching vacancies each morning and a briefing every Monday. You can switch either off.</div>
    <div className="row" style={{ gap: 8, marginBottom: 12 }}><button className="btn btn-primary" onClick={() => setMode({ v: "edit" })}>New territory</button>{r && <span className="muted" style={{ fontSize: 12.5 }}>{r.territories.length} of 20 saved</span>}</div>
    {loading ? <Loading /> : err ? <Err e={err} /> : <div className="card" style={{ padding: 12 }}>
      <Table head={["Territory", "Schools", "Live vacancies", "New in 7 days", "Coverage", "Emails", ""]} empty="No territories yet. Choose New territory to set one up.">{r.territories.map((t) => <tr key={t.id}><td style={TD}><b>{t.name}</b><br /><span className="muted" style={{ fontSize: 12 }}>{t.la_codes.length} council{t.la_codes.length === 1 ? "" : "s"}{t.settings.length ? " · " + t.settings.map((x) => SETTING[x]).join(", ") : ""}{t.families.length ? " · " + t.families.map((x) => FAM[x] || x).join(", ") : ""}</span></td><td style={TD}>{t.figures.schools}</td><td style={TD}>{t.figures.live_vacancies}</td><td style={TD}>{t.figures.new_7d}</td><td style={TD}>{t.figures.coverage_pct == null ? "—" : t.figures.coverage_pct + "%"}</td><td style={TD} className="muted">{[t.alerts && "Daily", t.briefing && "Monday"].filter(Boolean).join(", ") || "Off"}</td><td style={TD}><button className="btn btn-primary" style={{ fontSize: 12, padding: "4px 10px", marginRight: 4 }} onClick={() => setMode({ v: "open", id: t.id })}>Open</button><button className="btn btn-light" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setMode({ v: "edit", id: t.id })}>Edit</button></td></tr>)}</Table>
    </div>}
  </div>);
}
function TerritoryForm({ id, onDone, onToast }) {
  const [las, setLas] = useState(null); const [t, setT] = useState(null); const [filter, setFilter] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { (async () => { try { const l = await call("/api/send-territory?view=las"); setLas(l.las); setT(id ? (await call("/api/send-territory?view=detail&id=" + encodeURIComponent(id))).territory : { name: "", la_codes: [], settings: [], families: [], alerts: true, briefing: true }); } catch (e) { setErr(e.message); } })(); }, [id]);
  if (err && !t) return <Err e={err} />; if (!las || !t) return <Loading />;
  const tog = (k, v) => setT((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const chip = (k, v, label) => <label key={v} style={{ fontSize: 12.5, border: "1px solid var(--line)", borderRadius: 999, padding: "4px 9px", cursor: "pointer", whiteSpace: "nowrap" }}><input type="checkbox" checked={t[k].includes(v)} onChange={() => tog(k, v)} style={{ marginRight: 5 }} />{label}</label>;
  const box = { display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 220, overflow: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 8 };
  const save = async () => { if (!t.la_codes.length) { setErr("Choose at least one council."); return; } try { await call("/api/send-territory", { action: "save", id: id || undefined, name: t.name, la_codes: t.la_codes, settings: t.settings, families: t.families, alerts: t.alerts, briefing: t.briefing }); onToast("Territory saved"); onDone(); } catch (e) { setErr(e.message); } };
  const del = async () => { if (!window.confirm("Delete this territory?")) return; try { await call("/api/send-territory", { action: "delete", id }); onDone(); } catch (e) { setErr(e.message); } };
  return (<div className="card" style={{ padding: 16 }}>
    <b>{id ? "Edit territory" : "New territory"}</b>
    <div style={{ margin: "10px 0" }}><input className="in" style={{ width: "100%" }} maxLength={80} placeholder="Name, for example North West therapies" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} /></div>
    <p className="muted" style={{ fontSize: 12.5 }}>Councils (choose at least one)</p>
    <input className="in" placeholder="Filter councils" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: 8 }} />
    <div style={box}>{las.filter((l) => l.name.toLowerCase().includes(filter.toLowerCase())).map((l) => chip("la_codes", l.code, l.name))}</div>
    <p className="muted" style={{ fontSize: 12.5 }}>Settings (none ticked means all)</p><div style={box}>{Object.entries(SETTING).map(([k, l]) => chip("settings", k, l))}</div>
    <p className="muted" style={{ fontSize: 12.5 }}>Professions (none ticked means all)</p><div style={box}>{Object.entries(FAM).map(([k, l]) => chip("families", k, l))}</div>
    <label style={{ display: "block", marginTop: 12, fontSize: 13.5 }}><input type="checkbox" checked={t.alerts} onChange={(e) => setT({ ...t, alerts: e.target.checked })} /> Email and app alerts for new vacancies each morning</label>
    <label style={{ display: "block", marginTop: 6, fontSize: 13.5 }}><input type="checkbox" checked={t.briefing} onChange={(e) => setT({ ...t, briefing: e.target.checked })} /> Monday briefing</label>
    {err && <p style={{ color: "#B4433A", fontSize: 13 }}>{err}</p>}
    <div className="row" style={{ gap: 8, marginTop: 12 }}><button className="btn btn-primary" onClick={save}>Save</button><button className="btn btn-light" onClick={onDone}>Cancel</button>{id && <button className="btn btn-light" style={{ marginLeft: "auto", color: "#B4433A" }} onClick={del}>Delete</button>}</div>
  </div>);
}
function TerritoryDetail({ id, onBack, onToast, setModal }) {
  const { data: r, err, loading } = useLoad("/api/send-territory?view=detail&id=" + encodeURIComponent(id));
  if (loading) return <Loading />; if (err) return <Err e={err} />;
  const t = r.territory, f = r.figures;
  return (<div>
    <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: "center" }}><button className="btn btn-light" onClick={onBack}>All territories</button><b>{t.name}</b><button className="btn btn-light" style={{ marginLeft: "auto" }} onClick={() => download("/api/send-export?what=vacancies&la=" + t.la_codes.join(","), onToast)}>Download vacancies</button></div>
    <Grid><Stat value={f.schools.toLocaleString()} label="Schools in scope" /><Stat value={f.live_vacancies} label="Live vacancies seen" onClick={() => { const el = document.getElementById("send-terr-vac"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} /><Stat value={f.new_7d} label="New in the last 7 days" /><Stat value={f.sen_ehcp.toLocaleString()} label="Pupils with an EHC plan" /><Stat value={f.coverage_pct == null ? "—" : f.coverage_pct + "%"} label="Coverage" /></Grid>
    <div id="send-terr-vac" className="card" style={{ padding: 12, marginBottom: 14 }}><b>Live vacancies</b>
      <Table head={["Role", "School", "Council", "Pay", "Closes", ""]} empty="No live vacancies seen in this territory yet.">{f.vacancies.map((x) => <tr key={x.id}><td style={TD}><b>{x.original_title}</b><br /><span style={TAG}>{FAM[x.profession_family] || x.profession_family}</span></td><td style={TD}>{x.school}</td><td style={TD}>{x.la_name}</td><td style={TD}>{x.salary_text}</td><td style={TD}>{date(x.closing_at)}</td><td style={TD}><Actions org={x.school} role={x.original_title} url={x.source_url} note="From SEND Intelligence territory" draft={{ vacancy_id: x.id }} onToast={onToast} setModal={setModal} /></td></tr>)}</Table></div>
    <div className="card" style={{ padding: 12, marginBottom: 14 }}><b>Opening soon</b><Table head={["School", "Council", "Opens"]} empty="None in this territory.">{f.opening_soon.map((o, i) => <tr key={i}><td style={TD}>{o.name}</td><td style={TD}>{o.la_name}</td><td style={TD}>{date(o.open_date)}</td></tr>)}</Table></div>
    <div className="card" style={{ padding: 12 }}><b>Coverage by council</b><Table head={["Council", "Schools", "Monitored", "Coverage"]} empty="Calculated hourly once jobs pages have been found.">{f.areas.map((a, i) => <tr key={i}><td style={TD}>{a.area_name}</td><td style={TD}>{a.schools}</td><td style={TD}>{a.sources_monitored}</td><td style={TD}>{a.coverage_pct}%</td></tr>)}</Table></div>
  </div>);
}

// Ofsted and CQC area SEND inspection outcome (the local area partnership as a whole).
const AREA = { "Widespread and/or systemic failings": ["Area SEND: systemic failings", "#FDECEC", "#9B1C1C"], "Inconsistent experiences and outcomes": ["Area SEND: inconsistent", "#FFF4E0", "#8A5300"], "Typically positive experiences and outcomes": ["Area SEND: positive", "#E6F4F2", "#06776F"] };
const AreaTag = ({ a }) => (a && AREA[a.outcome] ? <span style={FLAG(AREA[a.outcome][1], AREA[a.outcome][2])} title={a.outcome + (a.published ? ", published " + a.published : "")}>{AREA[a.outcome][0]}</span> : null);
const COUNCIL_SORT = { ehcp_growth_1y: "EHC plans, 1-year growth", ehcp_growth_5y: "EHC plans, 5-year growth", ehcp: "EHC plans, total", requests_growth_1y: "Assessment requests, 1-year growth", pct_20wk_low: "Plans issued within 20 weeks (lowest first)", hn_growth: "High needs funding growth", inclusion_concerns: "Ofsted inclusion concerns", renewals: "Contracts ending in 18 months", open: "Open SEND tenders", live_vacancies: "Live vacancies seen" };
const Growth = ({ v }) => (v == null ? <span>—</span> : <span style={{ color: v > 0 ? "#B42318" : "#0E8C7E", fontWeight: 700 }}>{pct(v)}</span>);

function Councils({ onToast }) {
  const [open, setOpen] = useState(null); const [sort, setSort] = useState("ehcp_growth_1y"); const [flt, setFlt] = useState("");
  const { data: r, err, loading } = useLoad("/api/send-market?view=councils");
  if (open) return <CouncilDetail code={open} onBack={() => setOpen(null)} onToast={onToast} />;
  if (loading) return <Loading />; if (err) return <Err e={err} />;
  let list = r.councils.filter((c) => c.ehcp != null);
  if (flt === "sv") list = list.filter((c) => c.safety_valve); if (flt === "dbv") list = list.filter((c) => c.dbv); if (flt === "fail") list = list.filter((c) => c.area_send && /systemic/.test(c.area_send.outcome));
  const key = (c) => (sort === "pct_20wk_low" ? -(c.pct_20wk ?? 999) : sort === "renewals" || sort === "open" ? c.tenders[sort] : (c[sort] ?? -1e9));
  list = [...list].sort((a, b) => key(b) - key(a));
  return (<div>
    <div style={NOTE}>Where SEND demand is growing and money is under pressure. Figures come from official sources (listed below the table); Qura's own figures are vacancies and tenders it has seen. A fast-growing council with low coverage may still be under-reported here.</div>
    <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
      <select className="in" value={sort} onChange={(e) => setSort(e.target.value)}>{Object.entries(COUNCIL_SORT).map(([k, l]) => <option key={k} value={k}>Sort: {l}</option>)}</select>
      <select className="in" value={flt} onChange={(e) => setFlt(e.target.value)}><option value="">All councils</option><option value="sv">Have had a Safety Valve agreement</option><option value="dbv">Delivering Better Value councils</option><option value="fail">Area SEND inspection: systemic failings</option></select>
      <span className="muted" style={{ fontSize: 12.5 }}>{list.length} councils</span>
      <button className="btn btn-light" onClick={() => download("/api/send-export?what=councils", onToast)}>Download CSV</button>
    </div>
    <div className="card" style={{ padding: 12, marginBottom: 14 }}>
      <Table head={["Council", "EHC plans", "1 year", "5 years", "Requests, 1 year", "Within 20 weeks", "High needs 2026-27", "Ofsted concerns", "Tenders", "Vacancies", ""]} empty="Council figures load from the first data run.">{list.map((c) => <tr key={c.code}>
        <td style={TD}><b>{c.name}</b><br />{c.safety_valve && <span style={FLAG("#FDECEC", "#9B1C1C")}>Safety Valve {c.sv_year}</span>}{c.dbv && <span style={FLAG("#FFF4E0", "#8A5300")}>DBV</span>}<AreaTag a={c.area_send} />{c.ehcp_note && <span style={TAG} title={c.ehcp_note}>Data break</span>}</td>
        <td style={TD}>{(c.ehcp || 0).toLocaleString()}</td><td style={TD}><Growth v={c.ehcp_growth_1y} /></td><td style={TD}><Growth v={c.ehcp_growth_5y} /></td><td style={TD}><Growth v={c.requests_growth_1y} /></td><td style={TD}>{c.pct_20wk == null ? "—" : c.pct_20wk + "%"}</td>
        <td style={TD}>{money(c.hn_now)}<br /><span className="muted" style={{ fontSize: 12 }}>{pct(c.hn_growth)}</span></td><td style={TD}>{c.inclusion_concerns || ""}</td>
        <td style={TD} className="muted">{c.tenders.open ? c.tenders.open + " open" : ""}{c.tenders.signals ? <><br />{c.tenders.signals} early</> : ""}{c.tenders.renewals ? <><br />{c.tenders.renewals} ending</> : ""}</td>
        <td style={TD}>{c.live_vacancies || ""}{c.coverage_pct != null && <><br /><span className="muted" style={{ fontSize: 12 }}>{c.coverage_pct}% coverage</span></>}</td>
        <td style={TD}><button className="btn btn-primary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setOpen(c.code)}>Open</button></td></tr>)}</Table>
    </div>
    <div className="card muted" style={{ padding: 14, fontSize: 12.5 }}><b>Sources</b> (Open Government Licence v3.0)<br />{Object.values(r.sources || {}).map((s, i) => <div key={i}>{s}</div>)}Ofsted concerns count the council's in-scope schools graded "Needs attention" or "Urgent improvement" for inclusion, or in special measures or serious weaknesses.</div>
  </div>);
}
function TenderRows({ items }) {
  return items.map((t) => <tr key={t.id}><td style={TD}><a href={t.url} target="_blank" rel="noopener noreferrer"><b>{t.title}</b></a><br /><span style={TAG}>{CATS[t.category] || t.category}</span>{t.is_framework && <span style={FLAG("#E8F1FF", "#1D4ED8")}>Framework</span>}{t.is_dps && <span style={FLAG("#E8F1FF", "#1D4ED8")}>DPS</span>}<span className="muted" style={{ fontSize: 12 }}> {t.source}{t.nation && t.nation !== "England" ? " · " + t.nation : ""}</span></td><td style={TD}>{t.buyer}</td><td style={TD}>{t.value_amount ? money(Number(t.value_amount)) : "—"}</td><td style={TD} className="muted">{t.stage === "tender" && t.closing_at ? "Closes " + date(t.closing_at) : "Published " + date(t.published_at)}{t.contract_end && <><br />Ends {date(t.contract_end)}</>}{t.max_extent && t.max_extent !== t.contract_end && <><br />Up to {date(t.max_extent)}</>}</td><td style={TD} className="muted">{(t.suppliers || []).slice(0, 3).map((s, i) => <div key={i}>{s}</div>)}</td></tr>);
}
function CouncilDetail({ code, onBack, onToast }) {
  const { data: r, err, loading } = useLoad("/api/send-market?view=council&code=" + code);
  if (loading) return <Loading />; if (err) return <Err e={err} />;
  const c = r.council; const years = Object.keys(c.ehcp || {}).sort(); const max = Math.max(1, ...years.map((y) => (c.ehcp[y] || {}).total || 0));
  const section = (title, list, empty) => <div className="card" style={{ padding: 12, marginBottom: 14 }}><b>{title}</b><Table head={["Notice", "Buyer", "Value", "Dates", "Suppliers"]} empty={empty}><TenderRows items={list} /></Table></div>;
  return (<div>
    <div className="row" style={{ gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}><button className="btn btn-light" onClick={onBack}>All councils</button><b>{c.la_name}</b>{c.safety_valve && <a style={FLAG("#FDECEC", "#9B1C1C")} href={c.sv_url} target="_blank" rel="noopener noreferrer">Safety Valve agreement {c.sv_year}</a>}{c.dbv && <span style={FLAG("#FFF4E0", "#8A5300")}>Delivering Better Value, tranche {c.dbv_tranche}</span>}{c.area_send_outcome && AREA[c.area_send_outcome] && <a style={FLAG(AREA[c.area_send_outcome][1], AREA[c.area_send_outcome][2])} href={c.area_send_url} target="_blank" rel="noopener noreferrer">{AREA[c.area_send_outcome][0]}{c.area_send_published ? " (" + date(c.area_send_published) + ")" : ""}</a>}</div>
    <Grid><Stat value={(c.ehcp_latest || 0).toLocaleString()} label="EHC plans, January 2026" /><Stat value={pct(c.ehcp_growth_1y)} label={"in 1 year (" + pct(c.ehcp_growth_5y) + " in 5)"} /><Stat value={(c.requests_latest || 0).toLocaleString()} label={"assessment requests in 2025 (" + pct(c.requests_growth_1y) + ")"} /><Stat value={c.pct_20wk == null ? "—" : c.pct_20wk + "%"} label="new plans issued within 20 weeks" /><Stat value={money(c.hn_now)} label={"high needs 2026-27 (" + pct(c.hn_growth) + " on 2025-26)"} /></Grid>
    {c.ehcp_note && <div style={NOTE}>{c.ehcp_note}</div>}
    <div className="card" style={{ padding: 12, marginBottom: 14 }}><b>EHC plans by year</b> <span className="muted" style={{ fontSize: 12.5 }}>Where plans name a setting, January 2026: special {(c.ehcp_special || 0).toLocaleString()}, mainstream {(c.ehcp_mainstream || 0).toLocaleString()}, alternative provision {(c.ehcp_ap || 0).toLocaleString()}, independent special {(c.ehcp_indep_special || 0).toLocaleString()}.</span>
      <Table head={["Year", "Plans", "", "Requests", "Within 20 weeks"]} empty="">{[...years].reverse().map((y) => { const n = (c.ehcp[y] || {}).total || 0; const cy = y.slice(0, 4); const t = (c.timeliness || {})[cy] || {}; return <tr key={y}><td style={TD}>{y}</td><td style={TD}>{n.toLocaleString()}</td><td style={TD}><span style={{ display: "inline-block", height: 9, borderRadius: 4, background: "var(--teal, #0E8C7E)", width: Math.round((n / max) * 160) }} /></td><td style={TD}>{(c.requests || {})[cy] ?? ""}</td><td style={TD}>{t.total ? Math.round((t.within20 / t.total) * 1000) / 10 + "%" : ""}</td></tr>; })}</Table>
      {c.hn_url && <p className="muted" style={{ fontSize: 12.5 }}>High needs figures: <a href={c.hn_url} target="_blank" rel="noopener noreferrer">ESFA allocation page</a>.</p>}</div>
    <div className="card" style={{ padding: 12, marginBottom: 14 }}><b>Schools with Ofsted inclusion or quality concerns</b><Table head={["School", "Inspected", "Inclusion", "Concern", ""]} empty="None among this council's in-scope schools in the latest file.">{r.concerns.map((i) => <tr key={i.urn}><td style={TD}>{i.school}</td><td style={TD}>{date(i.inspected_at)}</td><td style={TD}>{i.inclusion || "—"}</td><td style={TD}>{i.recent_concern === "SM" ? "Special measures" : i.recent_concern === "SWK" ? "Serious weaknesses" : ""}</td><td style={TD}><a href={i.report_url} target="_blank" rel="noopener noreferrer">Report</a></td></tr>)}</Table></div>
    {section("Early signals", r.tenders.signals, "No pipeline or market engagement notices seen in the last 12 months.")}
    {section("Open tenders", r.tenders.open, "No open SEND tenders seen.")}
    {section("Contracts ending in the next 18 months", r.tenders.renewals, "None seen yet. This fills as Qura reads back through past award notices.")}
    {section("Frameworks and dynamic purchasing systems", r.tenders.frameworks, "None seen.")}
  </div>);
}

const NATIONS = { england: "England", scotland: "Scotland", wales: "Wales", northern_ireland: "Northern Ireland" };
const TKINDS = { open: "Open tenders", signals: "Early signals", renewals: "Contracts ending soon", frameworks: "Frameworks and DPS" };
function Tenders({ onToast }) {
  const [kind, setKind] = useState("open"); const [cat, setCat] = useState("no_transport"); const [nation, setNation] = useState(""); const [page, setPage] = useState(1);
  const { data: r, err, loading } = useLoad("/api/send-market?view=tenders&kind=" + kind + "&page=" + page + (cat ? "&category=" + cat : "") + (nation ? "&nation=" + nation : ""));
  return (<div>
    <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>{Object.entries(TKINDS).map(([k, l]) => <button key={k} className={"btn " + (k === kind ? "btn-primary" : "btn-light")} onClick={() => { setKind(k); setPage(1); }}>{l}</button>)}</div>
    <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
      <select className="in" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }}><option value="no_transport">All except transport</option><option value="">Everything</option>{Object.entries(CATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <select className="in" value={nation} onChange={(e) => { setNation(e.target.value); setPage(1); }}><option value="">All UK</option>{Object.entries(NATIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      {r && <span className="muted" style={{ fontSize: 12.5 }}>{(r.total || 0).toLocaleString()} notices</span>}
      <button className="btn btn-light" onClick={() => download("/api/send-export?what=tenders&kind=" + kind + (nation ? "&nation=" + nation : ""), onToast)}>Download CSV</button>
    </div>
    {r && <div style={NOTE}>{r.note}{r.progress && r.progress.find_a_tender_read_to ? " Notices read so far: Find a Tender to " + date(r.progress.find_a_tender_read_to) + ", Contracts Finder to " + date(r.progress.contracts_finder_read_to) + (r.progress.scotland_read_to ? ", Public Contracts Scotland to " + r.progress.scotland_read_to : "") + "." : ""}</div>}
    {loading ? <Loading /> : err ? <Err e={err} /> : <div className="card" style={{ padding: 12 }}>
      <Table head={["Notice", "Buyer", "Value", "Dates", kind === "renewals" ? "Current supplier" : "Suppliers"]} empty="Nothing here yet. The first runs work back through 3 years of notices."><TenderRows items={r.items} /></Table>
      <Pager total={r.total} page={r.page} size={r.pageSize} onPage={setPage} />
    </div>}
  </div>);
}

function useLeaflet() {
  const [ok, setOk] = useState(typeof window !== "undefined" && !!window.L);
  useEffect(() => {
    if (window.L) { setOk(true); return; }
    if (!document.getElementById("leaflet-css")) { const l = document.createElement("link"); l.id = "leaflet-css"; l.rel = "stylesheet"; l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l); }
    let s = document.getElementById("leaflet-js");
    if (!s) { s = document.createElement("script"); s.id = "leaflet-js"; s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; document.head.appendChild(s); }
    const done = () => setOk(!!window.L); s.addEventListener("load", done); return () => s.removeEventListener("load", done);
  }, []);
  return ok;
}
const escHtml = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function MapView() {
  const [mode, setMode] = useState("schools");
  const ready = useLeaflet(); const el = useRef(null);
  const { data: r, err, loading } = useLoad(mode === "heat" ? "/api/send-territory?view=heat" : "/api/send?view=map");
  useEffect(() => {
    if (!ready || !r || !el.current) return;
    const L = window.L; const m = L.map(el.current).setView([54.4, -3.4], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(m);
    if (mode === "heat") {
      const max = Math.max(1, ...r.areas.map((a) => a.live_vacancies || 0));
      for (const a of r.areas) { const low = a.coverage_pct == null || a.coverage_pct < 30; L.circleMarker([a.lat, a.lng], { radius: 6 + 22 * Math.sqrt((a.live_vacancies || 0) / max), color: low ? "#8A94A8" : "#0E8C7E", weight: 1, dashArray: low ? "3 3" : null, fillOpacity: a.live_vacancies ? 0.55 : 0.15 }).addTo(m).bindPopup("<b>" + escHtml(a.name) + "</b><br>" + a.schools + " schools in scope<br>" + a.live_vacancies + " live SEND vacancies seen<br>Coverage: " + (a.coverage_pct == null ? "not yet measured" : a.coverage_pct + "%")); }
    } else {
      const col = { special: "#0E8C7E", ap: "#B7791F", mainstream_unit: "#4A6FA5" };
      for (const p of r.points) L.circleMarker([p.lat, p.lng], { radius: p.live ? 7 : 4, color: col[p.setting_group] || "#555", weight: 1, fillOpacity: p.live ? 0.9 : 0.5 }).addTo(m).bindPopup("<b>" + escHtml(p.name) + "</b><br>" + escHtml(SETTING[p.setting_group] || "") + "<br>" + escHtml(p.la_name) + "<br>" + (p.live ? p.live + " live SEND vacancies" : "No live vacancies seen"));
    }
    return () => m.remove();
  }, [ready, r, mode]);
  return (<div>
    <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
      <button className={"btn " + (mode === "schools" ? "btn-primary" : "btn-light")} onClick={() => setMode("schools")}>Schools</button>
      <button className={"btn " + (mode === "heat" ? "btn-primary" : "btn-light")} onClick={() => setMode("heat")}>Councils</button>
      <span className="muted" style={{ fontSize: 12.5 }}>{mode === "heat" ? "Circle size shows live SEND vacancies Qura has seen. Grey dashed circles have under 30% coverage." : "Green special, amber alternative provision, blue SEN units. Larger dots have live vacancies."}</span>
    </div>
    {err ? <Err e={err} /> : (loading || !ready) ? <Loading /> : null}
    <div ref={el} style={{ height: 520, borderRadius: 14, border: "1px solid var(--line)", display: loading || err ? "none" : "block" }} />
  </div>);
}

function Accuracy() {
  const { data: a } = useLoad("/api/send?view=accuracy");
  const r = a && a.latest;
  if (!r) return <div className="card muted" style={{ padding: 14, marginBottom: 14, fontSize: 13 }}><b>Accuracy check</b><br />Every Monday Qura tests itself against {a && a.golden ? a.golden.pages : 36} school jobs pages whose vacancies were checked by hand, and re-checks 20 live vacancies on the schools' own sites. The first results appear after the next Monday run.</div>;
  const v = (x) => (x == null ? "n/a" : x + "%");
  return (<div className="card" style={{ padding: 14, marginBottom: 14 }}>
    <b>Accuracy check</b> <span className="muted" style={{ fontSize: 12.5 }}>Weekly, last run {date(r.at)}. Tested against {a.golden ? a.golden.pages : ""} school jobs pages with a reference answer, plus 20 live vacancies re-checked on the schools' own sites.</span>
    <Grid>
      <Stat value={v(r.extractor && r.extractor.jobs_found_pct)} label="of advertised jobs found" />
      <Stat value={v(r.classifier && r.classifier.send_recall_pct)} label="of SEND roles recognised as SEND" />
      <Stat value={v(r.extractor && r.extractor.closing_dates_right_pct)} label="closing dates read correctly" />
      <Stat value={v(r.live && r.live.still_advertised_pct)} label="of live vacancies still on the school's page" />
    </Grid>
  </div>);
}

function Coverage() {
  const { data: c, err, loading } = useLoad("/api/send?view=coverage");
  if (loading) return <Loading />; if (err) return <Err e={err} />;
  const rows = [...(c.areas || [])].sort((a, b) => (b.schools || 0) - (a.schools || 0));
  return (<div><Accuracy /><div style={NOTE}>Coverage is the share of a council's in-scope schools whose own jobs page Qura checks daily. A low figure means Qura cannot see that area well; it does not mean there is no demand.</div>
    <div className="card" style={{ padding: 12 }}><Table head={["Council", "Schools", "Special", "AP", "SEN units", "Monitored", "Coverage"]} empty="Coverage is calculated hourly once jobs pages have been found.">{rows.map((a, i) => <tr key={i}><td style={TD}>{a.area_name}</td><td style={TD}>{a.schools}</td><td style={TD}>{a.special}</td><td style={TD}>{a.ap}</td><td style={TD}>{a.mainstream_units}</td><td style={TD}>{a.sources_monitored}</td><td style={TD}><b>{a.coverage_pct}%</b></td></tr>)}</Table></div></div>);
}

function Insights() {
  const { data: i, err, loading } = useLoad("/api/send?view=insights");
  const th = useLoad("/api/send-market?view=therapy");
  if (loading) return <Loading />; if (err) return <Err e={err} />;
  const PROF = [["speech_language", "SLT"], ["occupational_therapy", "OT"], ["physiotherapy", "Physio"], ["psychology", "Psychology"]];
  return (<div>
    <div className="card" style={{ padding: 12, marginBottom: 14 }}><b>Therapy demand across sectors</b> <span className="muted" style={{ fontSize: 12.5 }}>Live therapy adverts by region: health employers in Qura's healthcare feed beside schools. Each cell shows health / schools.</span>
      {th.loading ? <Loading /> : th.err ? <Err e={th.err} /> : <><Table head={["Region", ...PROF.map((p) => p[1])]} empty="No adverts yet.">{th.data.regions.map((r) => <tr key={r.region}><td style={TD}>{r.region}</td>{PROF.map(([k]) => <td key={k} style={TD}>{r.health[k] || 0} / <b>{r.school[k] || 0}</b></td>)}</tr>)}</Table><p className="muted" style={{ fontSize: 12 }}>{th.data.note}</p></>}
    </div>
    <div className="card" style={{ padding: 12, marginBottom: 14 }}><b>Repeat hiring</b> <span className="muted" style={{ fontSize: 12.5 }}>{i.notes.repeat_hiring}</span><Table head={["School", "Council", "Role", "Adverts"]} empty="Builds up as Qura sees adverts over time.">{i.repeat_hiring.map((r, k) => <tr key={k}><td style={TD}>{r.school}</td><td style={TD}>{r.la}</td><td style={TD}>{r.role}</td><td style={TD}>{r.adverts}</td></tr>)}</Table></div>
    <div className="card" style={{ padding: 12, marginBottom: 14 }}><b>Pay benchmarks</b> <span className="muted" style={{ fontSize: 12.5 }}>{i.notes.pay_benchmarks}</span><Table head={["Role", "Region", "Adverts", "Median low", "Median high"]} empty="Needs at least 3 adverts with pay for a role and region.">{i.pay_benchmarks.map((p, k) => <tr key={k}><td style={TD}>{p.role}</td><td style={TD}>{p.region}</td><td style={TD}>{p.adverts}</td><td style={TD}>{gbp(p.median_low || 0)}</td><td style={TD}>{gbp(p.median_high || 0)}</td></tr>)}</Table></div>
    <div className="card" style={{ padding: 12 }}><b>School changes</b> <span className="muted" style={{ fontSize: 12.5 }}>New schools in scope, trust moves and status changes from the weekly official file.</span><Table head={["When", "School", "Change"]} empty="Changes appear after the second weekly update.">{i.school_changes.map((e, k) => <tr key={k}><td style={TD}>{date(e.at)}</td><td style={TD}>{e.send_organisations && e.send_organisations.name}</td><td style={TD}>{String(e.event).replace(/_/g, " ")}{e.detail && (e.detail.from || e.detail.to) ? ": " + (e.detail.from || "none") + " to " + (e.detail.to || "none") : ""}</td></tr>)}</Table></div>
  </div>);
}

const TABS = [["overview", "Overview"], ["vacancies", "Vacancies"], ["territories", "Territories"], ["councils", "Councils"], ["tenders", "Tenders"], ["schools", "Schools"], ["map", "Map"], ["coverage", "Coverage"], ["insights", "Insights"]];

export default function SendIntelligence({ onToast }) {
  const toast = onToast || (() => {});
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem("qura_send_tab") || "overview"; } catch (e) { return "overview"; } });
  const [modal, setModal] = useState(null);
  const offer = useLoad("/api/send-offer");
  const [preset, setPreset] = useState(null);
  const pick = (k, p) => { setPreset(p || null); setTab(k); try { sessionStorage.setItem("qura_send_tab", k); } catch (e) {} };
  const views = { overview: Overview, vacancies: Vacancies, territories: Territories, councils: Councils, tenders: Tenders, schools: Schools, map: MapView, coverage: Coverage, insights: Insights };
  const View = views[tab] || Overview;
  return (
    <div>
      <div className="row" style={{ alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>SEND Intelligence</h2>
        <span className="chip" style={{ background: "#E6F4F2", color: "#06776F", fontSize: 11, fontWeight: 700 }}>Pilot</span>
      </div>
      <p className="muted" style={{ marginTop: 0, fontSize: 13.5 }}>Special schools, alternative provision and SEN units across the UK: vacancies, councils, tenders and territories.</p>
      {offer.loading ? <Loading /> : offer.err ? <Err e={offer.err} /> : !offer.data.hasAccess ? <Offer offer={offer.data} onToast={toast} reload={offer.reload} /> : <>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 14 }}>{TABS.map(([k, l]) => <button key={k} className={"btn " + (k === tab ? "btn-primary" : "btn-light")} style={{ fontSize: 13, padding: "6px 12px" }} onClick={() => pick(k)}>{l}</button>)}</div>
        <View key={tab + JSON.stringify(preset || {})} onToast={toast} setModal={setModal} go={(k, p) => { pick(k, p); try { window.scrollTo(0, 0); } catch (e) {} }} preset={preset} />
        {offer.data.founder && <FounderSales offer={offer.data} onToast={toast} reload={offer.reload} />}
        <p className="muted" style={{ fontSize: 11.5, marginTop: 18, lineHeight: 1.6 }}>Schools data: Get Information about Schools, Department for Education. Contains public sector information licensed under the Open Government Licence v3.0. Vacancies come only from school, trust and council pages Qura is allowed to check; coverage is partial. Qura holds no data about pupils, families or EHC plans. <a href="/send-data.html" target="_blank" rel="noopener noreferrer">How Qura uses data</a>.</p>
      </>}
      {modal && <DraftModal req={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
