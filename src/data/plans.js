// Extracted from App.jsx, 27 July 2026. Pure data only, no components and no
// behaviour, so moving it cannot change how anything renders.

export const MARKETS = [["all", "All markets"], ["nhs", "NHS"], ["private", "Private"], ["australia", "Australia"], ["newzealand", "New Zealand"], ["international", "International"]];

export const CURRENCY = { all: { sym: "£", code: "GBP", rate: 1 }, nhs: { sym: "£", code: "GBP", rate: 1 }, private: { sym: "£", code: "GBP", rate: 1 }, australia: { sym: "A$", code: "AUD", rate: 1.95 }, newzealand: { sym: "NZ$", code: "NZD", rate: 2.15 }, international: { sym: "$", code: "USD", rate: 1.27 } };

export const PLAN_LABEL = { trial: "Free trial", starter: "Starter", growth: "Growth", enterprise: "Enterprise" };

export const PREMIUM_FEATURES = [["proposals", "AI proposals"], ["analytics", "Analytics"], ["leaderboard", "Leaderboard"], ["intel", "Market intelligence"]];

export const ALL_PREMIUM = ["proposals", "analytics", "leaderboard", "intel", "psintel"];

export const CREDIT_TIERS = { trial: { dm: 15, invite: 15 }, starter: { dm: 5, invite: 10 }, growth: { dm: 25, invite: 30 }, enterprise: { dm: 100, invite: 100 } };

export const PLAN_ACCESS = { trial: ALL_PREMIUM, starter: [], growth: ALL_PREMIUM, enterprise: ALL_PREMIUM };

export const FEED_STAGES = [
  ["Requirement posted", "A healthcare organisation posts a live requirement."],
  ["Suppliers alerted", "Premium suppliers receive an instant alert."],
  ["Direct response", "Interested companies respond through Qura."],
  ["Meeting booked", "An intro or demo call is booked in the Qura calendar."],
  ["Meeting recorded", "AI transcript, minutes, action list and CRM updates generated."],
  ["AI generates outputs", "Proposal, follow-up email, presentation and pricing document."],
  ["Follow-up booked", "A second meeting is scheduled to review the proposal."],
  ["Proposal reviewed", "The proposal is discussed and refined."],
  ["Contract generated", "A DocuSign-style contract is produced inside Qura."],
  ["Contract signed", "Both parties execute the contract digitally."],
  ["Status updated", "The opportunity moves automatically to Fulfilled."],
];

export const STATUS_STAGES = [1, 4, 6, 9, 11];

export const MARKET_TREND = [{ w: "6w", d: 6.4 }, { w: "5w", d: 5.9 }, { w: "4w", d: 5.1 }, { w: "3w", d: 4.6 }, { w: "2w", d: 3.8 }, { w: "1w", d: 3.1 }];

export const SUP_PERF = { s1: { winRate: 74, avgFill: 3.1, wins: 31 }, s2: { winRate: 68, avgFill: 2.6, wins: 27 }, s3: { winRate: 55, avgFill: 4.2, wins: 14 }, s4: { winRate: 71, avgFill: 3.4, wins: 22 }, s5: { winRate: 63, avgFill: 2.9, wins: 38 }, s6: { winRate: 58, avgFill: 3.8, wins: 12 } };

export const SUPPLIERS = [
  { id: "s1", name: "Harley Street Imaging", type: "Harley Street clinic", init: "HI", tag: "Consultant-led private MRI, ultrasound and self-pay diagnostics in central London.", cats: ["MRI", "ultrasound", "diagnostic", "private", "self-pay"], loc: "Harley Street, London", rating: 4.9, premium: true, verified: true, kit: [{ n: "Private MRI", s: "Same-week appointments", lead: "1 week" }, { n: "Consultant ultrasound", s: "Obstetric & MSK", lead: "3 days" }, { n: "Executive health checks", s: "Self-pay packages", lead: "1 week" }] },
  { id: "s2", name: "The Wellington Private Hospital", type: "Private hospital", init: "WP", tag: "Full-service private hospital with theatres, imaging and inpatient care.", cats: ["private hospital", "theatres", "imaging", "inpatient"], loc: "London", rating: 4.8, premium: true, verified: true, kit: [{ n: "Private theatres", s: "Elective surgery", lead: "2 weeks" }, { n: "Diagnostic imaging", s: "MRI, CT and ultrasound", lead: "1 week" }] },
  { id: "s3", name: "Dr. A. Rahman (Independent)", type: "Self-employed consultant", init: "AR", tag: "Independent consultant offering private clinics and remote reporting.", cats: ["consultant", "private clinic", "reporting", "self-employed"], loc: "Harley Street, London", rating: 4.9, premium: false, verified: true, kit: [{ n: "Private clinics", s: "Consultant-led", lead: "1 week" }, { n: "Remote reporting", s: "24 to 48h turnaround", lead: "2 days" }] },
  { id: "s4", name: "Cromwell Private Clinic", type: "Private clinic", init: "CP", tag: "Independent multi-specialty private clinic with diagnostics and outpatient care.", cats: ["private clinic", "outpatient", "diagnostics", "multi-specialty"], loc: "Kensington, London", rating: 4.7, premium: true, verified: true, kit: [{ n: "Outpatient clinics", s: "Multi-specialty", lead: "1 week" }, { n: "Day-case procedures", s: "Minor surgery", lead: "2 weeks" }] },
  { id: "s5", name: "Nuffield Private Practice", type: "Private hospital", init: "NP", tag: "Private hospital group offering surgery, diagnostics and consultant clinics.", cats: ["private hospital", "surgery", "diagnostics"], loc: "Regional", rating: 4.6, premium: false, verified: true, kit: [{ n: "Consultant clinics", s: "Self-pay & insured", lead: "1 week" }, { n: "Elective surgery", s: "Day-case & inpatient", lead: "3 weeks" }] },
  { id: "s6", name: "London Women's Health Clinic", type: "Private clinic", init: "LW", tag: "Women's health and fertility clinic with consultant sonography and gynaecology.", cats: ["private clinic", "womens health", "fertility", "sonography", "gynaecology"], loc: "Harley Street, London", rating: 4.9, premium: true, verified: true, kit: [{ n: "Fertility sonography", s: "Consultant-led", lead: "3 days" }, { n: "Gynaecology clinics", s: "Private & self-pay", lead: "1 week" }] },
];

export const FEED_STATUS = [
  { k: "live", l: "Live", c: "#10B981", bg: "rgba(16,185,129,.12)" },
  { k: "discussion", l: "In discussion", c: "#F59E0B", bg: "rgba(245,158,11,.15)" },
  { k: "proposal", l: "Proposal sent", c: "#2D6BFF", bg: "rgba(45,107,255,.12)" },
  { k: "contract", l: "Contract pending", c: "#F97316", bg: "rgba(249,115,22,.15)" },
  { k: "fulfilled", l: "Fulfilled", c: "#0E8C7E", bg: "rgba(14,140,126,.14)" },
];
