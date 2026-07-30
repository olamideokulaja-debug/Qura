import React, { useState, useEffect } from "react";
import { BarChart3, Check, Globe, Network, Package, Radar, Rss, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { PageHead, SectionHead, Stat } from "../components/ui.jsx";
import { supabase } from "../supabase.js";

// Extracted from App.jsx on 27 July 2026. Behaviour unchanged.

export function PlatformContent() {
  const items = [
    { i: Rss, t: "24/7 live marketplace", d: "A live feed of demand and supply across every market, refreshing around the clock." },
    { i: Radar, t: "Automated market mapping", d: "The market is mapped for you continuously, so your team never maps regions by hand." },
    { i: ShieldCheck, t: "Fragile professions", d: "Specialist coverage of the scarce clinical roles the NHS most struggles to fill." },
    { i: Users, t: "Verified decision-makers", d: "Reach the right people, credit-controlled to keep every message considered." },
    { i: Sparkles, t: "AI assistant", d: "A 24/7 AI assistant that replies, qualifies and drafts in your voice." },
    { i: Globe, t: "Relocation & mobility", d: "Move talent between countries with a managed concierge on a vetted partner network." },
    { i: Network, t: "Public sector intelligence", d: "ICB and council intelligence, summarised for you and refreshed daily." },
    { i: BarChart3, t: "Analytics & weekly reports", d: "Board-ready activity reports, generated automatically." },
  ];
  return (<><h1 className="disp" style={{ fontSize: 36, fontWeight: 700, margin: "0 0 6px" }}>The platform</h1><p className="muted" style={{ fontSize: 16, maxWidth: 620, marginTop: 0 }}>One live platform across the NHS, private healthcare and international markets, 24/7.</p><div className="grid g3" style={{ marginTop: 28 }}>{items.map((x) => (<div key={x.t} className="card" style={{ padding: 22 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center" }}><x.i size={21} color="#1E54E6" /></div><div style={{ fontWeight: 600, fontSize: 16, marginTop: 12 }}>{x.t}</div><p className="muted" style={{ fontSize: 13.5, marginTop: 5, lineHeight: 1.55 }}>{x.d}</p></div>))}</div></>);
}

export function WhySwitch() {
  const CRMS = ["Bullhorn", "Tracker", "Salesforce", "Access"];
  const ROWS = [
    { f: "Data accuracy", crm: "You maintain it by hand; it decays fast", qura: "Live, verified contacts with last-checked dates" },
    { f: "Market mapping", crm: "Hours mapping regions manually", qura: "Mapped for you, continuously, in real time" },
    { f: "Live opportunities", crm: "You chase and log leads yourself", qura: "A 24/7 feed of live vacancies and needs" },
    { f: "Fragile professions", crm: "Generic pipelines", qura: "Niche vacancies summarised as they appear" },
    { f: "Reach decision-makers", crm: "Cold lists you buy and clean", qura: "Verified decision-makers, credit-controlled" },
    { f: "AI assistant", crm: "A bolt-on, if any", qura: "Built-in 24/7 AI assistant that replies in your voice" },
    { f: "Time to value", crm: "Months of setup and data entry", qura: "Live in minutes" },
  ];
  const cell = { padding: "13px 16px", fontSize: 13, borderTop: "1px solid var(--line)" };
  return (
    <div>
      <PageHead title="Why switch to Qura" sub="The CRMs you know store your data. Qura keeps it correct, live and mapped for you." right={<span className="chip chip-cyan">vs legacy CRMs</span>} />
      <div className="card" style={{ padding: 20, marginBottom: 16, background: "var(--navy)", color: "#fff", border: "none" }}>
        <div className="grid g3" style={{ gap: 16 }}>{[["Consented", "Every contact opted in, never scraped"], ["Real time", "Market mapping, no manual region work"], ["24/7", "Live opportunities and AI cover"]].map(([n, l]) => (<div key={l}><div className="disp" style={{ fontSize: 28, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 12.5, color: "#9FB0D0" }}>{l}</div></div>))}</div>
      </div>
      <div className="faint row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12, fontSize: 12.5, alignItems: "center" }}>Coming from {CRMS.map((c) => (<span key={c} className="chip chip-grey" style={{ fontWeight: 600 }}>{c}</span>))} ? Here is what changes.</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr" }}>
          <div style={{ padding: "14px 16px", fontWeight: 700, fontSize: 13, background: "var(--bg)" }}>Capability</div>
          <div style={{ padding: "14px 16px", fontWeight: 700, fontSize: 13, background: "var(--bg)", borderLeft: "1px solid var(--line)" }}>Legacy CRM</div>
          <div style={{ padding: "14px 16px", fontWeight: 700, fontSize: 13, background: "var(--cyan-soft)", color: "#06776F", borderLeft: "1px solid var(--line)" }}>Qura</div>
          {ROWS.map((r, i) => ([
            <div key={"f" + i} style={{ ...cell, fontWeight: 600, fontSize: 13.5 }}>{r.f}</div>,
            <div key={"c" + i} style={{ ...cell, color: "var(--muted)", borderLeft: "1px solid var(--line)" }}>{r.crm}</div>,
            <div key={"q" + i} style={{ ...cell, borderLeft: "1px solid var(--line)" }}><span className="row" style={{ gap: 7, alignItems: "flex-start" }}><Check size={15} color="#0E8C7E" style={{ flexShrink: 0, marginTop: 1 }} />{r.qura}</span></div>,
          ]))}
        </div>
      </div>
      <div className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>Qura complements your CRM or replaces it. Correct data is the value: every contact carries a last-checked date, and the register is continuously re-verified.</div>
    </div>
  );
}

export function MarketMap({ go }) {
  // Every figure on this page is now counted from real data by /api/market-map:
  // opportunities from the live procurement feed, decision-makers from the
  // register. Vacancies and supplier counts are deliberately absent rather than
  // invented, because nothing computes them yet.
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        let token = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = (data && data.session && data.session.access_token) || "";
        }
        const res = await fetch("/api/market-map", { headers: token ? { Authorization: "Bearer " + token } : {} });
        const j = await res.json();
        if (dead) return;
        if (res.ok) setData(j); else setError("Sign in to view the market map.");
      } catch (e) {
        if (!dead) setError("Could not load the market map. Please try again.");
      }
    })();
    return () => { dead = true; };
  }, []);

  const rows = (data && data.rows) || [];
  const live = rows.filter((x) => x.opportunities > 0 || x.decisionMakers > 0);
  const maxOpps = Math.max(1, ...live.map((x) => x.opportunities));
  const when = data && data.refreshedAt ? new Date(data.refreshedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null;

  return (
    <div>
      <PageHead title="Market map" sub="Where the demand is, counted from live procurement notices and our decision-maker register." />

      <div className="grid-stats" style={{ marginBottom: 18 }}>
        <Stat label="Decision-makers" value={data ? String((data.totals || {}).decisionMakers ?? 0) : "..."} icon={Users} />
        <Stat label="Live opportunities" value={data ? String((data.totals || {}).opportunities ?? 0) : "..."} icon={Target} accent="cyan" />
        <Stat label="Regions with activity" value={data ? String((data.totals || {}).regionsWithActivity ?? 0) : "..."} icon={Rss} />
        <Stat label="Suppliers mapped" value={data ? String((data.totals || {}).suppliers ?? 0) : "..."} icon={Package} accent="cyan" />
      </div>

      {error ? (
        <div className="card" style={{ padding: 18, color: "#8A1030" }}>{error}</div>
      ) : (
        <div className="card" style={{ padding: 20 }}>
          <SectionHead
            title="Coverage by region"
            action={<span className="faint" style={{ fontSize: 12 }}>{when ? "Procurement data to " + when : "Loading"}</span>}
          />
          {!data ? (
            <div className="faint" style={{ fontSize: 13, padding: "10px 0" }}>Counting...</div>
          ) : live.length === 0 ? (
            <div className="faint" style={{ fontSize: 13, padding: "10px 0", lineHeight: 1.6 }}>
              No activity mapped yet. Regions appear here as procurement notices and decision-makers are matched to them.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>{live.map((x) => (
              <div key={x.region} onClick={() => go && go("feed")} className="lift" style={{ cursor: "pointer", padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 12 }}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14.5 }}>{x.region}</span>
                  <span className="faint" style={{ fontSize: 12.5 }}>
                    {x.opportunities} {x.opportunities === 1 ? "opportunity" : "opportunities"} · {x.decisionMakers} decision-{x.decisionMakers === 1 ? "maker" : "makers"}
                  </span>
                </div>
                <div className="row" style={{ gap: 10, alignItems: "center" }}>
                  <div style={{ flex: 1, height: 8, background: "var(--bg)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: Math.round((x.opportunities / maxOpps) * 100) + "%", height: "100%", background: "var(--teal)", borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            ))}</div>
          )}
        </div>
      )}

      <div className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.6 }}>
        Opportunities are counted from procurement notices published on {(data && (data.sources || []).join(", ")) || "Find a Tender, Contracts Finder, the EU notice board and SAM.gov"}, refreshed every morning, plus demand posted by suppliers on Qura. Decision-makers are counted from our own register and placed by organisation, so some sit under "Not mapped" until we can place them. Open vacancy and supplier counts are not shown, because nothing computes them yet.
      </div>
    </div>
  );
}
