// What else your organisation has done with this supplier.
//
// Shown to a hospital, GP practice or care provider when they open a supplier.
// The point is to stop a trust negotiating twice: audiology talking to a
// supplier while radiology, separately, meets the same one next month.
//
// It records the visit as it renders. That is deliberate — the intelligence
// only exists because colleagues are using Qura, so the act of looking is what
// creates the record for the next person.
//
// Nothing is invented. Before any colleague has engaged a supplier there is
// simply nothing to show, and the component renders nothing at all rather than
// an empty box implying an absence of engagement.

import React, { useState, useEffect, useRef } from "react";
import { Users, Building2 } from "lucide-react";
import { supabase } from "./supabase.js";

const authHeaders = async (json) => {
  let t = "";
  try { const { data } = await supabase.auth.getSession(); t = (data && data.session && data.session.access_token) || ""; } catch (e) {}
  const h = t ? { Authorization: "Bearer " + t } : {};
  if (json) h["content-type"] = "application/json";
  return h;
};

const ago = (iso) => {
  const d = (Date.now() - Date.parse(iso)) / 86400000;
  if (!isFinite(d)) return "";
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 31) return Math.round(d) + " days ago";
  if (d < 365) return Math.round(d / 30) + " months ago";
  return "over a year ago";
};

const VERB = { viewed: "looked at", contacted: "contacted", shortlisted: "shortlisted", engaged: "engaged" };

export default function CrossDepartment({ supplier, specialty, kind = "viewed" }) {
  const [data, setData] = useState(null);
  const recorded = useRef("");

  useEffect(() => {
    const name = supplier && supplier.name;
    if (!name) return;
    let alive = true;
    (async () => {
      // Record first, then read, so the reader's own visit is included in what
      // they see and the two never disagree.
      const key = name + "|" + (specialty || "") + "|" + kind;
      if (recorded.current !== key) {
        recorded.current = key;
        try {
          await fetch("/api/engagements", {
            method: "POST", headers: await authHeaders(true),
            body: JSON.stringify({ supplier: name, supplierName: name, specialty, kind }),
          });
        } catch (e) {}
      }
      try {
        const r = await fetch("/api/engagements?supplier=" + encodeURIComponent(name), { headers: await authHeaders(false) });
        if (r.ok && alive) setData(await r.json());
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, [supplier && supplier.name, specialty, kind]);

  // No organisation linked, or nobody else has touched this supplier: show
  // nothing. An empty panel would read as "no engagement", which is a claim
  // this cannot make.
  if (!data || !data.org || !data.others || !data.others.length) return null;

  const specialties = data.specialties || [];

  return (
    <div className="card" style={{ padding: 16, borderColor: "var(--amber)", background: "var(--amber-bg)" }}>
      <div className="row" style={{ gap: 9, alignItems: "flex-start" }}>
        <Users size={17} color="var(--amber)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--amber)" }}>
            {data.org.name} is already engaging this supplier
          </div>
          {specialties.length ? (
            <div style={{ fontSize: 13.5, marginTop: 4 }}>
              {specialties.length === 1 ? "In " : "Across "}
              <b>{specialties.join(", ")}</b>
            </div>
          ) : null}

          <div style={{ marginTop: 9 }}>
            {data.others.slice(0, 4).map((e, i) => (
              <div key={i} style={{ fontSize: 13, padding: "3px 0" }}>
                <b>{e.by}</b>{e.specialty ? " · " + e.specialty : ""}
                <span className="muted"> · {VERB[e.kind] || e.kind} {ago(e.at)}</span>
              </div>
            ))}
            {data.others.length > 4 ? (
              <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                and {data.others.length - 4} more
              </div>
            ) : null}
          </div>

          {/* The reason this matters, said once. Without it the panel is a
              curiosity rather than something that changes a decision. */}
          <div style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.55, color: "#6B5518" }}>
            Worth a conversation with them before you start your own. A single
            organisation-wide arrangement is usually better value than two departments
            negotiating separately, and your colleagues already know how this supplier
            performs.
          </div>
        </div>
      </div>
    </div>
  );
}

// The same intelligence in one line, for a supplier card in a list.
export function CrossDepartmentTag({ supplier }) {
  const [n, setN] = useState(0);
  const [specs, setSpecs] = useState([]);
  useEffect(() => {
    const name = supplier && supplier.name;
    if (!name) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/engagements?supplier=" + encodeURIComponent(name), { headers: await authHeaders(false) });
        if (!r.ok || !alive) return;
        const j = await r.json();
        setN((j.others || []).length);
        setSpecs(j.specialties || []);
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, [supplier && supplier.name]);

  if (!n) return null;
  return (
    <span className="chip" style={{ fontSize: 11, background: "var(--amber-bg)", color: "var(--amber)", fontWeight: 700 }}>
      <Building2 size={11} /> Already in use{specs.length ? " · " + specs[0] : ""}
    </span>
  );
}
