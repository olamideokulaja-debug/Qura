// The FAQ page.
//
// Forty questions is too many for one list, so they are grouped by lens and
// collapsed. Someone arriving as a clinician should find their seven questions
// without scrolling past a supplier's eight.
//
// Six sit above the fold under Most asked. Each of those answers something a
// sceptical reader wants settled before they trust anything else on the page —
// including, deliberately, "does Qura's AI make recruitment decisions", because
// that is the question the whole platform's credibility rests on.
//
// Answers are the founder's wording, unchanged. Several of them draw the line
// between what Qura does and what an employer or buyer decides; paraphrasing
// them loosely would blur exactly the distinction they exist to protect.

import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { FAQ_GROUPS, MOST_ASKED } from "./data/faqs.js";

const allItems = () => FAQ_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g })));

function Item({ item, accent, open, onToggle }) {
  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      <button onClick={onToggle} className="row"
        style={{ width: "100%", textAlign: "left", gap: 12, padding: "15px 2px",
                 alignItems: "flex-start", cursor: "pointer", background: "none", border: "none" }}
        aria-expanded={open}>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 15, lineHeight: 1.45 }}>{item.q}</span>
        {open ? <ChevronUp size={17} color={accent} style={{ flexShrink: 0, marginTop: 2 }} />
              : <ChevronDown size={17} color="var(--faint)" style={{ flexShrink: 0, marginTop: 2 }} />}
      </button>
      {open ? (
        <div style={{ padding: "0 2px 18px", maxWidth: 760 }}>
          {item.a.map((p, i) => (
            <p key={i} style={{ fontSize: 14.5, lineHeight: 1.7, margin: i ? "10px 0 0" : 0, color: "var(--muted)" }}>{p}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function FAQ() {
  // One open at a time within a group. Accordions where everything can be open
  // at once turn back into the wall of text the grouping was meant to avoid.
  const [open, setOpen] = useState("");
  const [q, setQ] = useState("");

  const term = q.trim().toLowerCase();
  const matches = term
    ? allItems().filter((i) => (i.q + " " + i.a.join(" ")).toLowerCase().includes(term))
    : null;

  const most = allItems().filter((_, idx) => MOST_ASKED.includes(idx + 1));

  return (
    <div className="wrap" style={{ maxWidth: 860, padding: "34px 24px 70px" }}>
      <div className="row" style={{ gap: 10 }}>
        <HelpCircle size={22} color="var(--teal)" />
        <h1 className="disp" style={{ fontSize: 30, fontWeight: 700, margin: 0 }}>Questions, answered</h1>
      </div>
      <p className="muted" style={{ fontSize: 15.5, lineHeight: 1.6, margin: "10px 0 22px", maxWidth: 660 }}>
        How the platform actually works, lens by lens. If you are weighing Qura up, the
        six below are the ones most people want settled first.
      </p>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the FAQs"
        style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--line)",
                 borderRadius: 12, fontSize: 15, boxSizing: "border-box", marginBottom: 24 }} />

      {matches ? (
        <div className="card" style={{ padding: "4px 18px" }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".07em", padding: "14px 2px 4px" }}>
            {matches.length} {matches.length === 1 ? "RESULT" : "RESULTS"}
          </div>
          {matches.map((i) => (
            <Item key={i.q} item={i} accent={i.group.accent}
              open={open === i.q} onToggle={() => setOpen(open === i.q ? "" : i.q)} />
          ))}
          {!matches.length ? (
            <p className="muted" style={{ fontSize: 14.5, padding: "8px 2px 20px" }}>
              Nothing matching that. Email support@qurahealth.org and a person will answer.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: "4px 18px", marginBottom: 30, borderTop: "3px solid var(--teal)" }}>
            <div className="faint" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".07em", padding: "14px 2px 4px" }}>
              MOST ASKED
            </div>
            {most.map((i) => (
              <Item key={i.q} item={i} accent="var(--teal)"
                open={open === i.q} onToggle={() => setOpen(open === i.q ? "" : i.q)} />
            ))}
          </div>

          {FAQ_GROUPS.map((g) => (
            <div key={g.id} style={{ marginBottom: 22 }}>
              <div className="row" style={{ gap: 9, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: g.accent }} />
                <h2 className="disp" style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{g.label}</h2>
                <span className="faint" style={{ fontSize: 12.5 }}>{g.items.length}</span>
              </div>
              <div className="card" style={{ padding: "2px 18px" }}>
                {g.items.map((i) => (
                  <Item key={i.q} item={i} accent={g.accent}
                    open={open === i.q} onToggle={() => setOpen(open === i.q ? "" : i.q)} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <div className="muted" style={{ fontSize: 13.5, marginTop: 26, lineHeight: 1.6 }}>
        Still not answered? Email <b>support@qurahealth.org</b>. A person reads it.
      </div>
    </div>
  );
}
