// My applications.
//
// Two facts sit side by side here and must never blur into one:
//
//   Qura Match        what our matching thinks of your profile against the role
//   Application status what has actually happened to your application
//
// They are visually separate, differently coloured, and each carries a line
// saying what it is. A clinician reading "Strong match" must not come away
// believing an employer has shortlisted them.
//
// The timeline stops at "Awaiting employer review" and stays there until an
// employer genuinely says otherwise. An open circle is honest. A ticked one
// that nobody earned is not.

import React, { useState, useEffect, useCallback } from "react";
import { Check, Clock, Circle, Target, Info } from "lucide-react";
import { PageHead } from "./components/ui.jsx";
import { supabase } from "./supabase.js";

const authHeaders = async () => {
  let t = "";
  try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  return t ? { Authorization: "Bearer " + t } : {};
};

const day = (iso) => {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  catch (e) { return ""; }
};

// Employer-confirmed statuses read differently from Qura's own, because they
// mean something happened at the other end.
const EMPLOYER = ["Viewed", "Under review", "Shortlisted", "Interview", "Offer", "Hired", "Not successful"];

export default function MyApplications() {
  const [apps, setApps] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/applications", { headers: await authHeaders() });
      if (r.ok) { const j = await r.json(); setApps(j.applications || []); }
      else setApps([]);
    } catch (e) { setApps([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (apps === null) {
    return <div><PageHead title="My applications" sub="Where each application has got to" />
      <div className="muted">Loading...</div></div>;
  }

  return (
    <div>
      <PageHead title="My applications" sub="Where each application has got to" />

      {/* Said once, at the top, so nothing below has to be hedged. */}
      <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--bg)" }}>
        <div className="row" style={{ gap: 9, alignItems: "flex-start" }}>
          <Info size={16} color="var(--teal)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            <b>Qura Match</b> is our view of how well your profile fits the role.
            <b> Application status</b> is what has actually happened. We only move an
            application to shortlisted, interview or offer when the organisation tells
            us, never on our own.
          </div>
        </div>
      </div>

      {!apps.length ? (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>No applications yet</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6 }}>
            When you apply through Qura, it appears here with its status and where it
            has got to.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {apps.map((a) => {
            const confirmed = EMPLOYER.includes(a.status);
            return (
              <div key={a.id} className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{a.role || "Role"}</div>
                <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{a.employer}</div>
                <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>Applied: {day(a.at)}</div>

                {/* The two facts, deliberately in separate boxes. */}
                <div className="row" style={{ gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                  {a.quraMatch != null || a.quraMatchLabel ? (
                    <div style={{ padding: "10px 14px", borderRadius: 12, background: "var(--cyan-soft)", minWidth: 190 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <Target size={13} color="var(--teal)" />
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--teal)", letterSpacing: ".05em" }}>QURA MATCH</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginTop: 3 }}>
                        {a.quraMatchLabel || (a.quraMatch + "%")}
                      </div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>Our assessment, not the employer's</div>
                    </div>
                  ) : null}

                  <div style={{ padding: "10px 14px", borderRadius: 12,
                    background: confirmed ? "var(--ok-bg)" : "var(--amber-bg)", minWidth: 210 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <Clock size={13} color={confirmed ? "var(--ok)" : "var(--amber)"} />
                      <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em",
                        color: confirmed ? "var(--ok)" : "var(--amber)" }}>APPLICATION STATUS</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginTop: 3 }}>{a.status}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                      {confirmed ? "Confirmed by the organisation" : "Set by Qura from what has happened"}
                    </div>
                  </div>
                </div>

                {a.nextStep ? (
                  <div style={{ fontSize: 13.5, marginTop: 12 }}>
                    <b>Next step:</b> {a.nextStep}
                  </div>
                ) : null}

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  {(a.timeline || []).map((t, i) => (
                    <div key={i} className="row" style={{ gap: 9, padding: "5px 0", fontSize: 13.5 }}>
                      {t.done ? <Check size={15} color="var(--ok)" />
                        : t.current ? <span style={{ width: 15, textAlign: "center", color: "var(--amber)", fontSize: 15, lineHeight: 1 }}>&bull;</span>
                        : <Circle size={14} color="var(--faint)" />}
                      <span style={{ opacity: t.done || t.current ? 1 : 0.55, fontWeight: t.current ? 600 : 400 }}>
                        {t.label}
                      </span>
                      {t.at ? <span className="faint" style={{ fontSize: 12 }}>· {day(t.at)}</span> : null}
                    </div>
                  ))}
                </div>

                {a.employerNote ? (
                  <div style={{ fontSize: 13, marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "var(--bg)" }}>
                    <b>From the organisation:</b> {a.employerNote}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
