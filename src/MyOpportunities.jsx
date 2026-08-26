// What healthcare demand relates to this clinician.
//
// Replaces a screen that showed agency staffing contracts — some worth several
// hundred thousand pounds — to individual clinicians, under a heading claiming
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

import React, { useState, useEffect, useCallback } from "react";
import { Target, ExternalLink, Check, X, Info } from "lucide-react";
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

export default function MyOpportunities() {
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
    return <div><PageHead title="Opportunities for me" sub="Where your skills are in demand" />
      <div className="muted">Loading...</div></div>;
  }

  const incomplete = !profile || !profile.profession;

  return (
    <div>
      <PageHead title="Opportunities for me"
        sub="Organisations currently buying the kind of work you do" />

      {/* Said once, plainly. These are not vacancies, and letting a clinician
          believe otherwise would waste their time. */}
      <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--bg)" }}>
        <div className="row" style={{ gap: 9, alignItems: "flex-start" }}>
          <Info size={16} color="var(--teal)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            These are live procurement notices, not job adverts. When an organisation
            buys the kind of work you do, it usually means they need people like you —
            often months before a vacancy appears anywhere. Use them to know where to
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
            so an empty list means nothing relevant was published — not that nothing
            was published.
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
