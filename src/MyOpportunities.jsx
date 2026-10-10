// What healthcare demand relates to this clinician.
//
// Replaces a screen that showed agency staffing contracts, some worth several
// hundred thousand pounds, to individual clinicians, under a heading claiming
// they were "roles matched to your specialty". They were neither matched nor
// roles.
//
// What a clinician sees now is real and checkable: procurement notices where an
// organisation is buying the kind of work they do. A tender for ultrasound
// technologists means that health centre needs sonographers, usually months
// before any vacancy is advertised. That is worth more to a clinician than a
// job board, and no job board has it.
//
// Nothing is padded. If nothing matches, the screen says so and explains what
// would change that.
//
// Since 2 October 2026 (Qura Opportunity Engine) the page opens on live roles:
// roles posted on Qura (Qura Direct) and live NHS Jobs vacancies Qura has found
// (Discovered by Qura, always with the source named and a link to apply there).
// The procurement notices are the second tab.

import React, { useState, useEffect, useCallback } from "react";
import { Target, ExternalLink, Check, X, Info, Search, Bell } from "lucide-react";
import { PageHead } from "./components/ui.jsx";
import { matchFeed, matchLabel } from "./matching.js";
import { supabase } from "./supabase.js";

const authHeaders = async () => {
  let t = "";
  try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  return t ? { Authorization: "Bearer " + t } : {};
};

const toneFor = (score) =>
  score >= 80 ? { bg: "var(--cyan-soft)", fg: "var(--teal)" }
  : score >= 60 ? { bg: "var(--ok-bg)", fg: "var(--ok)" }
  : { bg: "#EEF1F7", fg: "#5A6783" };

function ProcurementNotices() {
  const [profile, setProfile] = useState(undefined);
  const [matches, setMatches] = useState(null);
  const [openId, setOpenId] = useState("");

  const load = useCallback(async () => {
    const h = await authHeaders();
    let prof = null, feed = [];
    try {
      const r = await fetch("/api/profile", { headers: h });
      if (r.ok) { const j = await r.json(); prof = j.profile || null; }
    } catch (e) {}
    try {
      const r = await fetch("/api/demand", { headers: h });
      if (r.ok) { const j = await r.json(); feed = j.items || []; }
    } catch (e) {}
    setProfile(prof);
    setMatches(prof ? matchFeed(prof, feed, 25) : []);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (profile === undefined) {
    return <div className="muted">Loading...</div>;
  }

  const incomplete = !profile || !profile.profession;

  return (
    <div>
      {/* Said once, plainly. These are not vacancies, and letting a clinician
          believe otherwise would waste their time. */}
      <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--bg)" }}>
        <div className="row" style={{ gap: 9, alignItems: "flex-start" }}>
          <Info size={16} color="var(--teal)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            These are live procurement notices, which are different from job adverts. When an
            organisation buys the kind of work you do, it usually means they need people like
            you, often months before a vacancy appears anywhere. Use them to know where to
            look, and who to speak to.
          </div>
        </div>
      </div>

      {incomplete ? (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Finish your profile first</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6, maxWidth: 560 }}>
            Matching works from your profession, country and experience. Add those under
            Get verified and this fills in straight away.
          </div>
        </div>
      ) : !matches || !matches.length ? (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Nothing matching {profile.profession} right now</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6, maxWidth: 580 }}>
            The feed refreshes daily from Find a Tender, Contracts Finder, TED and
            SAM.gov. We only show notices that genuinely relate to your profession,
            so an empty list means nothing relevant to you was published.
          </div>
        </div>
      ) : (
        <>
          <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            {matches.length} {matches.length === 1 ? "notice relates" : "notices relate"} to {profile.profession}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matches.map((m) => {
              const tone = toneFor(m.match.score);
              const open = openId === m.id;
              return (
                <div key={m.id} className="card" style={{ padding: 18 }}>
                  <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <span className="chip" style={{ background: tone.bg, color: tone.fg, fontWeight: 700, fontSize: 11 }}>
                          <Target size={11} /> {matchLabel(m.match.score)}
                        </span>
                        {m.region ? <span className="faint" style={{ fontSize: 12 }}>{m.region}</span> : null}
                        {m.source ? <span className="faint" style={{ fontSize: 12 }}>· {m.source}</span> : null}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 7, lineHeight: 1.35 }}>{m.title}</div>
                      <div className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>{m.buyer}</div>
                    </div>
                    {m.url ? (
                      <a className="btn btn-light" style={{ fontSize: 13 }} href={m.url} target="_blank" rel="noreferrer">
                        Open notice <ExternalLink size={14} />
                      </a>
                    ) : null}
                  </div>

                  <button className="btn btn-ghost" style={{ fontSize: 12.5, marginTop: 10, padding: 0 }}
                    onClick={() => setOpenId(open ? "" : m.id)}>
                    {open ? "Hide" : "Why this is relevant to you"}
                  </button>

                  {open ? (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                      {m.match.reasons.map((r) => (
                        <div key={r.label} className="row" style={{ gap: 8, padding: "4px 0", fontSize: 13.5 }}>
                          {r.ok ? <Check size={14} color="var(--ok)" /> : <X size={14} color="var(--faint)" />}
                          <span style={{ opacity: r.ok ? 1 : 0.6 }}>{r.label}</span>
                        </div>
                      ))}
                      {/* The contacts the harvester pulled off the notice. This is
                          the part a clinician cannot get anywhere else. */}
                      {m.contacts && m.contacts.length ? (
                        <div style={{ marginTop: 10 }}>
                          <div className="faint" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".07em" }}>
                            WHO IS BUYING
                          </div>
                          {m.contacts.slice(0, 3).map((c, i) => (
                            <div key={i} style={{ fontSize: 13, marginTop: 4 }}>
                              <b>{c.name}</b>{c.role ? " · " + c.role : ""}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const TYPES = [["", "All"], ["permanent", "Permanent"], ["fixed_term", "Fixed-term"], ["locum_bank", "Locum / Bank"]];

function LiveRoles() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [applied, setApplied] = useState({});

  const fetchPage = useCallback(async (qq, t, p) => {
    const h = await authHeaders();
    const r = await fetch("/api/opportunities?v=2&page=" + p + (qq ? "&q=" + encodeURIComponent(qq) : "") + (t ? "&type=" + t : ""), { headers: h });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Could not load roles.");
    return j;
  }, []);
  const load = useCallback(async (qq, t) => {
    setBusy(true); setNote("");
    try { const j = await fetchPage(qq, t, 1); setData(j); setItems(j.items || []); setPage(1); } catch (e) { setNote(e.message); }
    setBusy(false);
  }, [fetchPage]);
  useEffect(() => { load("", ""); }, [load]);
  useEffect(() => { const t = setTimeout(() => { const v = input.trim(); if (v !== q) { setQ(v); load(v, kind); } }, 600); return () => clearTimeout(t); }, [input]);

  const more = async () => {
    try { const j = await fetchPage(q, kind, page + 1); const seen = new Set(items.map((i) => i.id)); setItems([...items, ...(j.items || []).filter((i) => !seen.has(i.id))]); setPage(page + 1); setData({ ...data, hasMore: j.hasMore }); } catch (e) {}
  };
  const post = async (body) => {
    const h = await authHeaders();
    const r = await fetch("/api/opportunities", { method: "POST", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Something went wrong.");
    return j;
  };
  const addAlert = async (term) => {
    try { const j = await post({ action: "alert_add", q: term }); setData({ ...data, alerts: j.alerts }); setNote(j.already ? "You already have that alert." : "Alert set. We will tell you when a new \"" + term + "\" role appears."); } catch (e) { setNote(e.message); }
  };
  const removeAlert = async (a) => { try { const j = await post({ action: "alert_remove", id: a.id }); setData({ ...data, alerts: j.alerts }); } catch (e) { setNote(e.message); } };
  // The advert opens straight away; the click is saved against the clinician so
  // Qura can ask later whether they applied (application outcome tracking).
  const openSource = (o) => {
    window.open(o.sourceUrl, "_blank", "noopener");
    post({ action: "click", id: o.id, platform: "web" }).then((j) => {
      if (j && j.trackingId) setNote("Added to My applications as opened on " + (o.sourceName || "the original site") + ". In about 2 days we will ask whether you applied.");
    }).catch(() => {});
  };
  const express = async (o) => {
    try {
      const h = await authHeaders();
      const r = await fetch("/api/applications", { method: "POST", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId: o.id, role: o.role, employer: o.employer }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Could not send your interest.");
      setApplied({ ...applied, [o.id]: true });
    } catch (e) { setNote(e.message); }
  };

  const alerts = (data && data.alerts) || [];
  const hasAlert = alerts.some((a) => (a.q || "").toLowerCase() === q.toLowerCase());
  return (
    <div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <div className="row" style={{ flex: 1, minWidth: 260, gap: 8, border: "1px solid var(--line)", borderRadius: 999, padding: "4px 14px", background: "#fff" }}>
          <Search size={15} color="var(--faint)" />
          <input style={{ flex: 1, border: 0, outline: "none", padding: "7px 0", fontSize: 14, background: "transparent" }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search any role, e.g. Clinical Research Associate" />
        </div>
        {TYPES.map(([k, l]) => (
          <button key={l} className="chip" onClick={() => { setKind(k); load(q, k); }} style={{ padding: "7px 13px", cursor: "pointer", border: "1px solid " + (kind === k ? "var(--navy, #0A1730)" : "var(--line)"), background: kind === k ? "var(--navy, #0A1730)" : "#fff", color: kind === k ? "#fff" : "#5A6783", fontWeight: 700, fontSize: 12.5 }}>{l}</button>
        ))}
      </div>
      {note ? <div className="card" style={{ padding: 12, marginBottom: 12, fontSize: 13.5 }}>{note}</div> : null}
      {alerts.length ? (
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 10, fontSize: 12.5 }}>
          <span className="faint"><Bell size={12} /> Your alerts:</span>
          {alerts.map((a) => <button key={a.id} className="chip" onClick={() => removeAlert(a)} title="Remove this alert" style={{ cursor: "pointer", border: 0, background: "var(--cyan-soft)", color: "var(--teal)", fontWeight: 700, fontSize: 11.5 }}>{(a.q || a.family) + "  ×"}</button>)}
        </div>
      ) : null}
      {data && items.length ? (
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <div className="muted" style={{ fontSize: 13 }}>{Number(data.total || 0).toLocaleString("en-GB")} live {data.total === 1 ? "role" : "roles"}{data.usedProfileFamily ? " for your profession. Search to see any other role." : q ? " for \"" + q + "\"." : "."}</div>
          {q && !hasAlert ? <button className="btn btn-ghost" style={{ fontSize: 13, padding: 0 }} onClick={() => addAlert(q)}><Bell size={13} /> Alert me to new "{q}" roles</button> : null}
        </div>
      ) : null}
      {busy && !items.length ? <div className="muted">Loading...</div> : null}
      {!busy && data && !items.length ? (
        <div className="card" style={{ padding: 22, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{q ? "No live roles match \"" + q + "\" right now" : "No live roles match that filter right now"}</div>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.6 }}>Nothing is wrong. Qura searches roles posted on Qura and live NHS Jobs vacancies, and none match yet.</div>
          {(data.related || []).length ? (
            <div style={{ marginTop: 14 }}>
              <div className="faint" style={{ fontSize: 12 }}>Related roles with live vacancies</div>
              <div className="row" style={{ gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
                {data.related.map((r) => <button key={r.title} className="btn btn-light" style={{ fontSize: 13 }} onClick={() => { setInput(r.title); }}>{r.title} ({r.count})</button>)}
              </div>
            </div>
          ) : null}
          {q ? <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={hasAlert} onClick={() => addAlert(q)}><Bell size={14} /> {hasAlert ? "Alert set" : "Create an alert for \"" + q + "\""}</button> : null}
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((o) => {
          const discover = o.kind === "discover";
          return (
            <div key={o.id} className="card" style={{ padding: 18 }}>
              <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5, lineHeight: 1.35 }}>{o.role}</div>
                  <div className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>{[o.employer, o.region].filter(Boolean).join(" · ")}</div>
                  <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {!discover ? <span className="chip" style={{ background: "#F3EEFF", color: "#5B3FD1", fontWeight: 700, fontSize: 11 }}>Qura Direct</span> : null}
                    {o.market ? <span className="chip" style={{ fontSize: 11 }}>{o.market}</span> : null}
                    {o.employmentLabel ? <span className="chip" style={{ fontSize: 11, background: "var(--cyan-soft)", color: "var(--teal)" }}>{o.employmentLabel}</span> : null}
                    {o.rate ? <span className="chip" style={{ fontSize: 11 }}>{o.rate}</span> : null}
                    {o.closes ? <span className="faint" style={{ fontSize: 12 }}>Closes {o.closes === "today" ? "today" : "in " + o.closes}</span> : null}
                    {typeof o.fit === "number" ? <span className="faint" style={{ fontSize: 12 }}>· {o.fit}% fit (Qura's assessment)</span> : null}
                  </div>
                  {discover ? <div style={{ fontSize: 12, marginTop: 8 }}><b style={{ color: "var(--teal)" }}>Discovered by Qura</b> <span className="faint">· {o.attribution || "Source: " + o.sourceName}{o.claimedBy ? " · Claimed on Qura by " + o.claimedBy : ""}</span></div> : null}
                  {o.summary ? <div className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>{o.summary}</div> : null}
                </div>
                {discover ? (
                  <button className="btn btn-light" style={{ fontSize: 13 }} onClick={() => openSource(o)}>Apply on {o.sourceName} <ExternalLink size={14} /></button>
                ) : (
                  <button className="btn btn-primary" style={{ fontSize: 13 }} disabled={applied[o.id]} onClick={() => express(o)}>{applied[o.id] ? "Interest sent" : "Express interest"}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {data && data.hasMore ? <div style={{ textAlign: "center", marginTop: 14 }}><button className="btn btn-light" onClick={more}>Show more roles</button></div> : null}
      {items.some((o) => o.kind === "discover") ? <div className="faint" style={{ fontSize: 12, marginTop: 14, lineHeight: 1.6 }}>Roles marked "Discovered by Qura" were found on NHS Jobs. Qura shows a short extract and links to the original advert, where you apply. The employer has not posted them on Qura unless it says so.</div> : null}
    </div>
  );
}

export default function MyOpportunities() {
  const [tab, setTab] = useState("roles");
  return (
    <div>
      <PageHead title="Opportunities for me" sub={tab === "roles" ? "Live roles on Qura and NHS Jobs, matched to you" : "Organisations currently buying the kind of work you do"} />
      <div className="row" style={{ gap: 6, marginBottom: 16 }}>
        {[["roles", "Live roles"], ["notices", "Procurement notices"]].map(([k, l]) => (
          <button key={k} className="chip" onClick={() => setTab(k)} style={{ padding: "8px 15px", cursor: "pointer", border: 0, background: tab === k ? "var(--teal)" : "#EEF1F7", color: tab === k ? "#fff" : "#5A6783", fontWeight: 700, fontSize: 13 }}>{l}</button>
        ))}
      </div>
      {tab === "roles" ? <LiveRoles /> : <ProcurementNotices />}
    </div>
  );
}
