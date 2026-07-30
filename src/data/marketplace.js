import { Briefcase, FileText, Link2, Sparkles, Stethoscope, Trophy } from "lucide-react";

// Extracted from App.jsx, 27 July 2026. Pure data only, no components and no
// behaviour, so moving it cannot change how anything renders.

export const REGISTER = { total: 64, deduped: 64, orgs: 43 };

export const SPECIALTIES = ["Audiology", "Sonography", "Radiography & Radiology", "Echocardiography", "Respiratory", "Speech & Language Therapy", "Pathology", "Biomedical Science", "Ophthalmology", "Gastroenterology", "Oncology", "Dermatology"];

export const REAL_OPPS = [{"org": "Imperial College Healthcare NHS Trust", "role": "Audiology staffing", "spec": "Audiology", "val": "£420K", "market": "NHS UK", "loc": "UK", "close": "4 days", "pr": "high", "score": 70, "status": "New", "source": "NHS pipeline"}, {"org": "Barts Health NHS Trust", "role": "Sonography staffing", "spec": "Sonography", "val": "£190K", "market": "NHS UK", "loc": "UK", "close": "8 days", "pr": "med", "score": 77, "status": "In progress", "source": "NHS pipeline"}, {"org": "Guy's and St Thomas' NHS Foundation Trust", "role": "Radiography & Radiology staffing", "spec": "Radiography & Radiology", "val": "£95K", "market": "NHS UK", "loc": "UK", "close": "12 days", "pr": "low", "score": 84, "status": "Qualified", "source": "NHS pipeline"}, {"org": "King's College Hospital NHS Foundation Trust", "role": "Echocardiography staffing", "spec": "Echocardiography", "val": "£260K", "market": "NHS UK", "loc": "UK", "close": "16 days", "pr": "high", "score": 91, "status": "Proposal", "source": "NHS pipeline"}, {"org": "Croydon Health Services NHS Trust", "role": "Respiratory staffing", "spec": "Respiratory", "val": "£310K", "market": "NHS UK", "loc": "UK", "close": "4 days", "pr": "med", "score": 70, "status": "New", "source": "NHS pipeline"}, {"org": "Cambridge University Hospitals NHS FT", "role": "Speech & Language Therapy staffing", "spec": "Speech & Language Therapy", "val": "£140K", "market": "NHS UK", "loc": "UK", "close": "8 days", "pr": "low", "score": 77, "status": "In progress", "source": "NHS pipeline"}, {"org": "Aneurin Bevan University Health Board", "role": "Pathology staffing", "spec": "Pathology", "val": "£225K", "market": "NHS UK", "loc": "UK", "close": "12 days", "pr": "high", "score": 84, "status": "Qualified", "source": "NHS pipeline"}, {"org": "University Hospitals of Derby and Burton NHS FT", "role": "Biomedical Science staffing", "spec": "Biomedical Science", "val": "£180K", "market": "NHS UK", "loc": "UK", "close": "16 days", "pr": "med", "score": 91, "status": "Proposal", "source": "NHS pipeline"}, {"org": "Hull University Teaching Hospitals NHS Trust", "role": "Ophthalmology staffing", "spec": "Ophthalmology", "val": "£90K", "market": "NHS UK", "loc": "UK", "close": "4 days", "pr": "low", "score": 70, "status": "New", "source": "NHS pipeline"}, {"org": "East Kent Hospitals University NHS FT", "role": "Gastroenterology staffing", "spec": "Gastroenterology", "val": "£275K", "market": "NHS UK", "loc": "UK", "close": "8 days", "pr": "high", "score": 77, "status": "In progress", "source": "NHS pipeline"}, {"org": "Kingston Hospital NHS Foundation Trust", "role": "Oncology staffing", "spec": "Oncology", "val": "£160K", "market": "NHS UK", "loc": "UK", "close": "12 days", "pr": "med", "score": 84, "status": "Qualified", "source": "NHS pipeline"}, {"org": "InHealth", "role": "Dermatology staffing", "spec": "Dermatology", "val": "£345K", "market": "NHS UK", "loc": "UK", "close": "16 days", "pr": "low", "score": 91, "status": "Proposal", "source": "NHS pipeline"}];

export const CLIENTS = [{"org": "Imperial College Healthcare NHS Trust", "status": "Active client", "spec": "Audiology"}, {"org": "Barts Health NHS Trust", "status": "Target", "spec": "Sonography"}, {"org": "Guy's and St Thomas' NHS Foundation Trust", "status": "In progress", "spec": "Radiography & Radiology"}, {"org": "King's College Hospital NHS Foundation Trust", "status": "Active client", "spec": "Echocardiography"}, {"org": "Croydon Health Services NHS Trust", "status": "Target", "spec": "Respiratory"}, {"org": "Cambridge University Hospitals NHS FT", "status": "New", "spec": "Speech & Language Therapy"}, {"org": "Aneurin Bevan University Health Board", "status": "Active client", "spec": "Pathology"}, {"org": "University Hospitals of Derby and Burton NHS FT", "status": "Target", "spec": "Biomedical Science"}, {"org": "Hull University Teaching Hospitals NHS Trust", "status": "In progress", "spec": "Ophthalmology"}, {"org": "East Kent Hospitals University NHS FT", "status": "Active client", "spec": "Gastroenterology"}, {"org": "Kingston Hospital NHS Foundation Trust", "status": "Target", "spec": "Oncology"}, {"org": "InHealth", "status": "New", "spec": "Dermatology"}, {"org": "Hywel Dda University Health Board", "status": "Active client", "spec": "Audiology"}, {"org": "Leeds Teaching Hospitals NHS Trust", "status": "Target", "spec": "Sonography"}, {"org": "North West London Procurement Services", "status": "In progress", "spec": "Radiography & Radiology"}, {"org": "OneWelbeck", "status": "Active client", "spec": "Echocardiography"}];

export const INTL_OPPS = [
  { org: "Cleveland Clinic Abu Dhabi", role: "ICU nurse cohort", val: "$1.8M", market: "Middle East", loc: "Abu Dhabi, UAE", close: "12 days", pr: "high", score: 91, status: "Qualified", source: "Tender portal" },
  { org: "Hamad Medical Corporation", role: "Perioperative leads", val: "$640K", market: "Middle East", loc: "Doha, QA", close: "18 days", pr: "med", score: 79, status: "New", source: "Framework renewal" },
  { org: "Lagos University Teaching Hospital", role: "Diagnostic radiographers", val: "$320K", market: "Africa", loc: "Lagos, NG", close: "9 days", pr: "med", score: 86, status: "In progress", source: "Direct enquiry" },
  { org: "Aga Khan University Hospital", role: "Oncology nursing", val: "$410K", market: "Africa", loc: "Nairobi, KE", close: "21 days", pr: "low", score: 72, status: "New", source: "Leadership change" },
];

export const OPPS = [...REAL_OPPS, ...INTL_OPPS];

export const CLINICIANS = [
  { name: "Dr. Sarah Ahmed", spec: "Sonographer (NOUS)", exp: "12 yrs", yrs: 12, loc: "London, UK", country: "United Kingdom", flag: "🇬🇧", sector: "NHS", rate: "£62/hr", avail: "From 14 Jul", match: 98, rating: 5.0, reviews: 14, last: "King's College Hospital" },
  { name: "Tunde Bakare", spec: "Audiologist (Paeds)", exp: "8 yrs", yrs: 8, loc: "London, UK", country: "United Kingdom", flag: "🇬🇧", sector: "Private", rate: "£48/hr", avail: "Immediate", match: 95, rating: 4.9, reviews: 11, last: "Imperial College Healthcare" },
  { name: "Maria Santos", spec: "Echocardiographer", exp: "10 yrs", yrs: 10, loc: "Manchester, UK", country: "United Kingdom", flag: "🇬🇧", sector: "NHS", rate: "£55/hr", avail: "From 1 Aug", match: 93, rating: 4.8, reviews: 9, last: "Guy's & St Thomas'" },
  { name: "Dr. Omar Farouk", spec: "Radiologist", exp: "15 yrs", yrs: 15, loc: "Birmingham, UK", country: "United Kingdom", flag: "🇬🇧", sector: "Both", rate: "£110/hr", avail: "Immediate", match: 90, rating: 5.0, reviews: 18, last: "Barts Health NHS Trust" },
  { name: "Emily Thompson", spec: "Sonographer (MSK)", exp: "6 yrs", yrs: 6, loc: "Auckland, NZ", country: "New Zealand", flag: "🇳🇿", sector: "Both", rate: "£58/hr", avail: "From 1 Sep", match: 92, rating: 4.9, reviews: 8, last: "Auckland City Hospital" },
  { name: "James Wilson", spec: "Radiographer (CT)", exp: "9 yrs", yrs: 9, loc: "Sydney, AU", country: "Australia", flag: "🇦🇺", sector: "Both", rate: "£54/hr", avail: "From 15 Aug", match: 89, rating: 4.8, reviews: 10, last: "Royal Prince Alfred" },
  { name: "Thabo Nkosi", spec: "Echocardiographer", exp: "11 yrs", yrs: 11, loc: "Cape Town, ZA", country: "South Africa", flag: "🇿🇦", sector: "Both", rate: "£52/hr", avail: "Immediate", match: 88, rating: 4.7, reviews: 7, last: "Groote Schuur Hospital" },
  { name: "Ava Reyes", spec: "ICU Nurse (RGN)", exp: "7 yrs", yrs: 7, loc: "Manila, PH", country: "Philippines", flag: "🇵🇭", sector: "Both", rate: "£28/hr", avail: "From 1 Oct", match: 86, rating: 4.8, reviews: 6, last: "St. Luke's Medical Center" },
  { name: "Chidi Okonkwo", spec: "Radiographer (MRI)", exp: "10 yrs", yrs: 10, loc: "Lagos, NG", country: "Nigeria", flag: "🇳🇬", sector: "Both", rate: "£30/hr", avail: "Immediate", match: 84, rating: 4.7, reviews: 5, last: "Lagos University Teaching Hospital", direct: true },
  { name: "Grace Bennett", spec: "Biomedical Scientist", exp: "9 yrs", yrs: 9, loc: "Leeds, UK", country: "United Kingdom", flag: "🇬🇧", sector: "NHS", rate: "£40/hr", avail: "From 21 Jul", match: 88, rating: 4.7, reviews: 6, last: "Cambridge University Hospitals" },
  { name: "Daniel Cole", spec: "Speech & Language Therapist", exp: "7 yrs", yrs: 7, loc: "Bristol, UK", country: "United Kingdom", flag: "🇬🇧", sector: "Private", rate: "£44/hr", avail: "Immediate", match: 85, rating: 4.6, reviews: 5, last: "Aneurin Bevan UHB" },
];

export const AGENCIES = [
  { name: "Apex Allied Health", spec: "AHP & diagnostics staffing", match: 98, rating: 4.9, deals: "120+ NHS placements", loc: "UK + International", framework: true, cqc: true },
  { name: "HCL Workforce", spec: "Nursing & care", match: 96, rating: 4.8, deals: "Framework approved", loc: "UK", framework: true, cqc: true },
  { name: "Pulse Healthcare", spec: "Mental health", match: 95, rating: 4.7, deals: "Rapid mobilisation", loc: "UK", framework: false, cqc: true },
  { name: "Sahel Medical Partners", spec: "Diagnostics & nursing", match: 92, rating: 4.6, deals: "International specialist", loc: "International", framework: false, cqc: false },
  { name: "Meridian Health Staffing", spec: "Imaging & physiology", match: 90, rating: 4.7, deals: "CDC delivery", loc: "UK + Gulf", framework: true, cqc: false },
];

export const MEETINGS = [
  { with: "Head of Resourcing", org: "Imperial College Healthcare", when: "Today, 14:30", type: "Discovery call", status: "Confirmed" },
  { with: "Imaging DOM", org: "Barts Health NHS Trust", when: "Tomorrow, 09:00", type: "Proposal review", status: "Confirmed" },
  { with: "Head of Audiology", org: "Guy's & St Thomas'", when: "Wed, 11:00", type: "Intro meeting", status: "Pending" },
  { with: "CDC Programme Lead", org: "Croydon Health Services", when: "Thu, 16:00", type: "Framework demo", status: "Confirmed" },
];

export const INTEL = [
  { tag: "Framework", text: "New NHS Workforce Alliance imaging lot opens for bids across 4 London trusts.", market: "NHS UK", t: "2h ago" },
  { tag: "Leadership", text: "Imperial College Healthcare appoints a new Imaging Director of Operations, signalling a staffing review.", market: "NHS UK", t: "5h ago" },
  { tag: "Expansion", text: "Three new Community Diagnostic Centres approved, lifting sonography and audiology demand.", market: "NHS UK", t: "1d ago" },
  { tag: "Contract", text: "Croydon Health Services ends incumbent diagnostics supplier; requirement now open.", market: "NHS UK", t: "1d ago" },
  { tag: "Funding", text: "Cancer and diagnostics workforce funding expands cardiac physiology capacity.", market: "NHS UK", t: "2d ago" },
];

export const STAGES = [
  { name: "Identified", deals: [{ o: "Imperial College", v: "£420K" }, { o: "Barts Health", v: "£190K" }] },
  { name: "Qualified", deals: [{ o: "Guy's & St Thomas'", v: "£310K" }, { o: "King's College", v: "£95K" }] },
  { name: "Proposal", deals: [{ o: "Croydon Health", v: "£260K" }, { o: "Cambridge Univ Hosp", v: "£225K" }] },
  { name: "Negotiation", deals: [{ o: "Aneurin Bevan UHB", v: "£180K" }] },
  { name: "Won", deals: [{ o: "Derby & Burton", v: "£345K" }] },
];

export const PIPE_DATA = [{ m: "Jan", v: 1.4 }, { m: "Feb", v: 1.9 }, { m: "Mar", v: 2.3 }, { m: "Apr", v: 2.1 }, { m: "May", v: 2.8 }, { m: "Jun", v: 3.4 }];

export const REGION_DATA = [{ r: "London", v: 8.1 }, { r: "South East", v: 5.0 }, { r: "Midlands", v: 4.2 }, { r: "North", v: 3.6 }, { r: "Wales", v: 2.0 }];

export const SPEC_DATA = [{"name": "Audiology", "value": 12, "c": "#2D6BFF"}, {"name": "Sonography", "value": 16, "c": "#00C2B8"}, {"name": "Radiography & Radiology", "value": 11, "c": "#7C5CFF"}, {"name": "Echocardiography", "value": 7, "c": "#F2A33C"}, {"name": "Respiratory", "value": 7, "c": "#E0586D"}, {"name": "Speech & Language Therapy", "value": 6, "c": "#1E54E6"}, {"name": "Pathology", "value": 7, "c": "#0F9D8C"}, {"name": "Biomedical Science", "value": 6, "c": "#9B6BFF"}, {"name": "Ophthalmology", "value": 7, "c": "#E68A2E"}, {"name": "Gastroenterology", "value": 6, "c": "#3FA9F5"}, {"name": "Oncology", "value": 8, "c": "#D14D8B"}, {"name": "Dermatology", "value": 7, "c": "#4CAF7D"}];

export const GMV_TREND = [{ m: "Jan", v: 9.2 }, { m: "Feb", v: 11.4 }, { m: "Mar", v: 13.1 }, { m: "Apr", v: 15.8 }, { m: "May", v: 19.2 }, { m: "Jun", v: 24.6 }];

export const REGIONS = [{ r: "London", v: 8.1, c: "#2D6BFF" }, { r: "South East", v: 5.0, c: "#00C2B8" }, { r: "Midlands", v: 4.2, c: "#7C5CFF" }, { r: "North", v: 3.6, c: "#F2A33C" }, { r: "Wales", v: 2.0, c: "#E0586D" }];

export const FUNNEL = [{ s: "Identified", n: 1248, pct: 100 }, { s: "Qualified", n: 612, pct: 49 }, { s: "Proposal", n: 318, pct: 25 }, { s: "Negotiation", n: 142, pct: 11 }, { s: "Won", n: 86, pct: 7 }];

export const TOP_AGENCIES = [{ n: "Apex Allied Health", v: "£3.2M", w: 18 }, { n: "HCL Workforce", v: "£2.4M", w: 12 }, { n: "Meridian Health Staffing", v: "£2.1M", w: 9 }, { n: "Sahel Medical", v: "£1.4M", w: 7 }];

export const TOP_OPPS = [{ o: "Imperial College Healthcare", r: "Sonography staffing", v: "£420K", m: "NHS UK" }, { o: "Barts Health", r: "Radiology staffing", v: "£310K", m: "NHS UK" }, { o: "Guy's & St Thomas'", r: "Audiology staffing", v: "£275K", m: "NHS UK" }, { o: "Cambridge Univ Hospitals", r: "MRI & CT staffing", v: "£260K", m: "NHS UK" }];

export const FEED_POOL = [
  { who: "Apex Allied Health", txt: "won a £420K sonography framework at Imperial College Healthcare", icon: Trophy, c: "ok" },
  { who: "Barts Health NHS Trust", txt: "posted a new requirement: audiology team cover", icon: FileText, c: "blue" },
  { who: "Dr. Sarah Ahmed", txt: "was shortlisted by King's College Hospital", icon: Stethoscope, c: "violet" },
  { who: "Meridian Health Staffing", txt: "joined as a verified agency", icon: Briefcase, c: "cyan" },
  { who: "HCL Workforce", txt: "sent an AI proposal to Croydon Health Services", icon: Sparkles, c: "cyan" },
  { who: "Guy's & St Thomas'", txt: "matched with 3 radiology partners", icon: Link2, c: "blue" },
  { who: "Cambridge University Hospitals", txt: "opened an MRI and CT requirement", icon: FileText, c: "blue" },
  { who: "Apex Allied Health", txt: "closed a £260K cardiac physiology deal", icon: Trophy, c: "ok" },
  { who: "Aneurin Bevan UHB", txt: "requested cancer and diagnostics cover", icon: FileText, c: "blue" },
  { who: "Pulse Healthcare", txt: "generated a proposal for Derby & Burton in 9 seconds", icon: Sparkles, c: "cyan" },
];

export const ALERTS = [
  { txt: "12 NHS framework deadlines close within 7 days", c: "amber" },
  { txt: "Audiology demand rising across CDCs, supply tight", c: "red" },
  { txt: "Clinician sign-ups hit a new weekly high", c: "ok" },
];
