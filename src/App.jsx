import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  LayoutDashboard, Target, Users, Send, FileText, Calendar, GitBranch, Radar,
  BarChart3, Stethoscope, CreditCard, Search, Bell, Menu, X, ChevronRight,
  Sparkles, MapPin, Clock, TrendingUp, Building2, Plus, Check, Copy, RefreshCw,
  ArrowRight, Star, LogOut, Mail, Briefcase, UserCheck, MessageSquare, Award,
  Globe, Loader2, Heart, Home, Linkedin, ShieldCheck, Brain, Network, Quote, Zap,
  Trophy, Link2, AlertCircle, Gauge, Activity, Ticket, Truck, BadgeCheck, ClipboardList, CalendarClock, Smartphone, Instagram, Twitter, Music2, Upload, Settings, Pencil, Trash2, Rss, Package, Inbox, ArrowUp, ArrowDown, ChevronDown, Lock,
  Play, GraduationCap,
} from "lucide-react";
// Charts live in their own file and are loaded only when a signed-in screen
// needs them, so visitors to the public site never download the charting
// library. See src/components/charts.jsx.
const Charts = lazy(() => import("./components/charts.jsx"));
function Chart({ height, ...props }) {
  return (
    <Suspense fallback={<div style={{ height: height || 210 }} />}>
      <Charts {...props} />
    </Suspense>
  );
}
import { billingEnabled, startCheckout } from "./billing.js";
import { supabase, supabaseEnabled } from "./supabase.js";
import { PrivacyContent, RefundContent, CookieContent, CookieConsent } from "./pages/policies.jsx";
import { APPSTORE_URL, PLAYSTORE_URL, APP_LAUNCH, StoreBadge, StoreBadges } from "./components/store.jsx";
import { LAUNCH_DATE, CountdownBanner } from "./components/countdown.jsx";
import { PlatformContent, WhySwitch, MarketMap } from "./pages/sections.jsx";
import { CLIN_TAGLINES, CLIN_UNIVERSAL, CLIN_TABS, CLIN_COUNTRIES, ClinicianSection } from "./pages/clinician.jsx";
import { APP_NAME } from "./constants.js";
import { initAnalytics, trackPage, setMarketingMode } from "./lib/analytics.js";
import { QuraLogo, Wordmark, Avatar, useCountUp, Stat, Kpi, SectionHead, PageHead, Toggle, Stars, Reveal, PulseLine, DemoTag, IllustrativeBanner } from "./components/ui.jsx";
import { REGISTER, SPECIALTIES, REAL_OPPS, CLIENTS, INTL_OPPS, OPPS, CLINICIANS, AGENCIES, MEETINGS, INTEL, STAGES, PIPE_DATA, REGION_DATA, SPEC_DATA, GMV_TREND, REGIONS, FUNNEL, TOP_AGENCIES, TOP_OPPS, FEED_POOL, ALERTS } from "./data/marketplace.js";
import { PRIORITY, PROTECTED_LIST, REG_BODY, NURSE_TYPES, AHP_TYPES, SCIENCE_TYPES, DOCTOR_SPECIALTIES, RESIDENCE_LIST } from "./data/clinical.js";
import { MARKETS, CURRENCY, PLAN_LABEL, PREMIUM_FEATURES, ALL_PREMIUM, CREDIT_TIERS, PLAN_ACCESS, FEED_STAGES, STATUS_STAGES, MARKET_TREND, SUP_PERF, SUPPLIERS, FEED_STATUS } from "./data/plans.js";

const OWNER_EMAILS = (import.meta.env.VITE_OWNER_EMAILS || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

const LINKEDIN = "https://uk.linkedin.com/in/ola-folawiyo-922160142";

/* ===================================================================== */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;450;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
:root{
  --navy:#0A1A30; --navy2:#13243F; --blue:#2D6BFF; --blue600:#1E54E6;
  --teal:#0E8C7E; --teal600:#0B7468; --cyan:#00C2B8; --cyan-soft:#E1F6F3; --violet:#7C5CFF; --violet-soft:#F0ECFF;
  --text:#101D38; --muted:#586683; --faint:#97A3BC; --line:#E7ECF4;
  --bg:#EBF0F7; --bg2:#F6F8FC; --card:#FFFFFF;
  --ok:#12925A; --ok-bg:#E6F5EE; --amber:#B9760A; --amber-bg:#FBF1DF; --red:#D8434B; --red-bg:#FBEAEB;
  --r:14px; --r-lg:20px;
  --sh-xs:0 1px 2px rgba(16,29,56,.04);
  --sh-sm:0 1px 2px rgba(16,29,56,.04),0 2px 6px rgba(16,29,56,.055);
  --sh-md:0 6px 20px rgba(16,29,56,.09),0 2px 6px rgba(16,29,56,.05);
  --sh-lg:0 26px 60px rgba(16,29,56,.17),0 10px 24px rgba(16,29,56,.09);
}
*{box-sizing:border-box}
.cura{font-family:'Inter',system-ui,sans-serif;color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.55;letter-spacing:-.005em}
.cura h1,.cura h2,.cura h3,.cura h4,.disp{font-family:'Lora',Georgia,serif;font-weight:600;letter-spacing:-.012em;margin:0}
.num{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;font-weight:600;letter-spacing:-.02em}
button{font-family:inherit;cursor:pointer;border:none;background:none}
.cura input,.cura textarea{font-family:inherit}
.muted{color:var(--muted)} .faint{color:var(--faint)}
.wrap{max-width:none;margin:0 auto;padding:0 28px}
.row{display:flex;align-items:center}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--sh-sm);transition:box-shadow .22s ease,transform .22s ease,border-color .22s ease}
.card:hover{box-shadow:var(--sh-md)}
.chip{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:-.01em}
.chip-high{background:var(--red-bg);color:#B0353C}.chip-med{background:var(--amber-bg);color:#9A5E00}.chip-low{background:var(--ok-bg);color:#0C7A47}
.chip-blue{background:#E9F0FF;color:#1E54E6}.chip-cyan{background:var(--cyan-soft);color:#076B61}
.chip-violet{background:var(--violet-soft);color:#5B3FD6}.chip-grey{background:#EEF1F7;color:#586683}.chip-ok{background:var(--ok-bg);color:#0C7A47}
.in{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font-size:14px;background:#fff;outline:none;transition:.15s}
.in:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(14,140,126,.14)}
.btn{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:12px;font-weight:600;font-size:14px;transition:transform .16s cubic-bezier(.2,.7,.2,1),box-shadow .16s ease,background .16s ease,filter .16s ease;white-space:nowrap;text-decoration:none;box-shadow:var(--sh-xs)}
.btn:hover{transform:translateY(-1px);box-shadow:var(--sh-md)}
.btn:active{transform:translateY(0);box-shadow:var(--sh-xs)}
.btn-primary{background:linear-gradient(180deg,#12a08f,var(--teal));color:#fff;box-shadow:0 4px 14px rgba(14,140,126,.30)}.btn-primary:hover{filter:brightness(1.05);box-shadow:0 9px 22px rgba(14,140,126,.34)}
.btn-blue{background:var(--teal);color:#fff;box-shadow:0 2px 8px rgba(14,140,126,.26)}.btn-blue:hover{background:var(--teal600)}
.btn-dark{background:var(--navy);color:#fff}.btn-dark:hover{background:var(--navy2)}
.btn-ghost{background:#fff;color:var(--text);border:1px solid var(--line)}.btn-ghost:hover{border-color:#cdd6e6;box-shadow:var(--sh-md)}
.btn-light{background:#fff;color:var(--navy);border:1px solid var(--line)}.btn-light:hover{border-color:#c8d3e6;box-shadow:var(--sh-md)}
.btn-dghost{background:#fff;color:var(--navy);border:1px solid #fff;box-shadow:var(--sh-sm)}.btn-dghost:hover{background:#E9EFF7;box-shadow:var(--sh-md)}
.btn-ai{background:linear-gradient(100deg,var(--cyan),#16A6E6);color:#06303a;box-shadow:0 2px 10px rgba(0,194,184,.3)}.btn-ai:hover{filter:brightness(1.04)}
.navitem{display:flex;align-items:center;gap:11px;width:100%;padding:10px 12px;border-radius:11px;background:rgba(255,255,255,.04);color:#C2CDE2;font-size:13.5px;font-weight:500;transition:.14s;text-align:left}
.navitem:hover{background:rgba(255,255,255,.05);color:#fff}
.navitem.active{background:rgba(0,194,184,.14);color:#fff;font-weight:600;box-shadow:inset 3px 0 0 var(--cyan)}
.navitem.active svg{color:#5FE6DC}
.iconbtn{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:11px;border:1px solid var(--line);background:#fff;cursor:pointer;transition:.14s;color:var(--muted)}
.iconbtn:hover{border-color:#c8d3e6;box-shadow:var(--sh-sm);color:var(--navy)}
.login-field{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:var(--bg2);border-radius:11px;padding:0 13px;margin-top:6px;transition:.15s}
.login-field:focus-within{border-color:var(--teal);box-shadow:0 0 0 3px rgba(14,140,126,.12);background:#fff}
.login-field input{border:none;background:transparent;outline:none;width:100%;padding:12px 0;font-size:14px;color:var(--text);font-family:inherit}
.login-orb{position:absolute;border-radius:50%;filter:blur(10px);pointer-events:none}
@media(max-width:820px){.login-card{flex-direction:column!important;max-width:430px!important}.login-brand{display:none!important}}
.up{color:var(--ok);font-weight:600}
.live{width:8px;height:8px;border-radius:9px;background:var(--ok);box-shadow:0 0 0 0 rgba(18,146,90,.5);animation:lv 1.8s infinite}
@keyframes lv{0%{box-shadow:0 0 0 0 rgba(18,146,90,.5)}70%{box-shadow:0 0 0 7px rgba(18,146,90,0)}100%{box-shadow:0 0 0 0 rgba(18,146,90,0)}}
.fade{animation:fade .5s ease both}@keyframes fade{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
.reveal{animation:rv .7s ease both}@keyframes rv{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.feed-in{animation:fi .45s ease both}@keyframes fi{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}
.pulse{animation:pl 1.4s ease-in-out infinite}@keyframes pl{0%,100%{opacity:.45}50%{opacity:1}}
.grid{display:grid;gap:18px}
.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}.main{grid-template-columns:2fr 1fr}
.grid-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px}.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.scrollx::-webkit-scrollbar{height:8px;width:8px}.scrollx::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:9px}
@media(max-width:960px){.g2,.g3,.g4,.main,.grid-stats,.grid-2,.grid-3{grid-template-columns:1fr}.hsm{display:none!important}.h1{font-size:38px!important}}
@media(max-width:600px){.grid-stats,.g4{grid-template-columns:1fr 1fr}.wrap{padding:0 18px}}
@media(max-width:760px){.appcanvas{padding:20px 16px!important}.topbar-pad{padding-left:16px!important;padding-right:16px!important}.ph-title{font-size:24px!important}}
.show-sm{display:none}@media(max-width:960px){.show-sm{display:inline-flex!important}}
.lift{transition:transform .2s cubic-bezier(.2,.7,.2,1), box-shadow .2s ease}
.lift:hover{transform:translateY(-3px);box-shadow:var(--sh-lg)}
.rv{opacity:0;transform:translateY(24px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
.rv.in{opacity:1;transform:none}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#076B61}
.ph-accent{width:34px;height:4px;border-radius:999px;background:linear-gradient(90deg,var(--teal),var(--cyan));margin-bottom:13px}
.sh-accent{display:inline-block;width:15px;height:3px;border-radius:999px;background:linear-gradient(90deg,var(--teal),var(--cyan));margin-right:10px;vertical-align:middle}
.scrolly::-webkit-scrollbar{width:11px}.scrolly::-webkit-scrollbar-thumb{background:#D2DAEA;border-radius:9px;border:3px solid transparent;background-clip:padding-box}.scrolly::-webkit-scrollbar-thumb:hover{background:#BDC8DE;background-clip:padding-box}
.heroh{font-size:clamp(34px,6.2vw,58px);line-height:1.06;letter-spacing:-.01em}
.draw{stroke-dasharray:900;stroke-dashoffset:900;animation:draw 2.4s .3s ease forwards}
@keyframes draw{to{stroke-dashoffset:0}}
/* ---- UI upscale ---- */
.card{position:relative;transition:box-shadow .3s cubic-bezier(.2,.7,.2,1),transform .3s cubic-bezier(.2,.7,.2,1),border-color .3s ease}
.card:hover{transform:translateY(-2px);border-color:#DCE4F1}
.lift:hover{transform:translateY(-4px)}
.btn{position:relative;overflow:hidden}
.btn::after{content:'';position:absolute;inset:0;background:linear-gradient(120deg,transparent 32%,rgba(255,255,255,.30) 50%,transparent 68%);transform:translateX(-130%);transition:transform .65s ease;pointer-events:none}
.btn:hover::after{transform:translateX(130%)}
.chip{transition:transform .15s ease,box-shadow .15s ease}
.navitem{position:relative;transition:background .18s ease,color .18s ease,transform .18s ease}
.navitem:hover{transform:translateX(2px)}
.navitem.active{background:linear-gradient(90deg,rgba(0,194,184,.22),rgba(0,194,184,.05))}
.in:focus,.login-field:focus-within{box-shadow:0 0 0 4px rgba(14,140,126,.15)}
.gradient-text{background:linear-gradient(100deg,var(--teal),var(--cyan) 45%,var(--blue));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.orb-float{animation:orbf 9s ease-in-out infinite}
@keyframes orbf{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(0,-22px) scale(1.07)}}
.reveal{animation:rv .8s cubic-bezier(.2,.7,.2,1) both}
.stagger>*{animation:rv .7s cubic-bezier(.2,.7,.2,1) both}
.stagger>*:nth-child(1){animation-delay:.04s}.stagger>*:nth-child(2){animation-delay:.1s}.stagger>*:nth-child(3){animation-delay:.16s}.stagger>*:nth-child(4){animation-delay:.22s}.stagger>*:nth-child(5){animation-delay:.28s}.stagger>*:nth-child(6){animation-delay:.34s}
a{transition:color .15s ease}
::selection{background:rgba(0,194,184,.22)}
.mesh{background:radial-gradient(60% 90% at 12% 8%,rgba(0,194,184,.13),transparent 60%),radial-gradient(50% 80% at 90% 10%,rgba(45,107,255,.11),transparent 60%),radial-gradient(60% 90% at 50% 100%,rgba(124,92,255,.09),transparent 60%)}
.glow-hover{transition:box-shadow .3s ease,transform .3s ease}
.glow-hover:hover{box-shadow:0 18px 50px rgba(14,140,126,.18);transform:translateY(-3px)}
@media(prefers-reduced-motion:reduce){*{animation-duration:.001s!important;transition-duration:.06s!important}}
.cura p{text-align:justify;text-justify:inter-word;-webkit-hyphens:auto;hyphens:auto}
.cura [style*="text-align: center"] p,.cura [style*="text-align:center"] p{text-align:center;-webkit-hyphens:manual;hyphens:manual}
.lb{flex:1 0 auto}
.lb .sec.home > .wrap,.lb .wrap.sec.home{max-width:1280px;margin-left:auto;margin-right:auto}
.lb .sec.story .wrap,.lb .sec.fragile.wrap{max-width:1440px;margin-left:auto;margin-right:auto}
.shot-wrap{border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 60px rgba(10,23,48,.22);background:#0A1730;position:relative}
.shot-wrap{position:relative;width:100%;aspect-ratio:1200/752;max-height:calc(100vh - 224px);max-width:calc((100vh - 224px) * 1.595);margin:0 auto}
.shot-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .55s ease;border-radius:16px}
.shot-wrap img.on{opacity:1}
.shot-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:9px;color:rgba(255,255,255,.75);font-size:13px;font-weight:600}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.shot-tabs{display:flex;gap:6px;justify-content:center;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.shot-tabs::-webkit-scrollbar{display:none}
.shot-thumb{border:1px solid var(--line);background:#fff;border-radius:9px;padding:7px 11px;cursor:pointer;font-size:12px;font-weight:600;color:#5A6783;transition:all .16s ease;white-space:nowrap;flex:0 0 auto}
.shot-thumb:hover{border-color:var(--blue);color:var(--navy)}
.shot-thumb.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.snap{background:#0A1730;border-radius:16px;overflow:hidden;box-shadow:0 22px 60px rgba(10,23,48,.34);border:1px solid rgba(255,255,255,.09)}
.snap-bar{display:flex;gap:6px;align-items:center;padding:10px 12px;background:rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.08)}
.snap-dot{width:9px;height:9px;border-radius:99px}
.snap-body{padding:16px;min-height:290px}
.snap-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);margin-bottom:8px;animation:snapIn .42s ease both}
.snap-pill{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:99px;background:rgba(0,194,184,.18);color:#7EEDE4;border:1px solid rgba(0,194,184,.34);white-space:nowrap}
.snap-input{display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:99px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:#C9D6EC;font-size:12.5px;margin-bottom:12px}
.snap-note{font-size:11px;color:rgba(255,255,255,.5);margin-top:10px}
@keyframes snapIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.snap-row:nth-child(2){animation-delay:.07s}.snap-row:nth-child(3){animation-delay:.14s}.snap-row:nth-child(4){animation-delay:.21s}
.step-btn{width:100%;text-align:left;display:flex;gap:13px;align-items:flex-start;padding:14px 15px;border-radius:13px;border:1px solid var(--line);background:#fff;cursor:pointer;transition:all .18s ease}
.step-btn:hover{border-color:var(--blue);transform:translateX(3px)}
.step-btn.on{border-color:var(--cyan);background:var(--cyan-soft)}
.step-num{width:26px;height:26px;border-radius:99px;display:grid;place-items:center;font-size:12px;font-weight:800;flex-shrink:0;background:#EEF1F7;color:#5A6783}
.step-btn.on .step-num{background:var(--teal);color:#fff}
.lb .sec{display:none!important}
.lb[data-view="home"] .sec.home,.lb[data-view="clinicians"] .sec.clinicians,.lb[data-view="suppliers-app"] .sec.suppliers-app,.lb[data-view="market"] .sec.market,.lb[data-view="fragile"] .sec.fragile,.lb[data-view="solutions"] .sec.solutions,.lb[data-view="story"] .sec.story,.lb[data-view="how"] .sec.how,.lb[data-view="pricing"] .sec.pricing{display:block!important}
.navlink{color:var(--muted);font-size:14.5px;font-weight:500;text-decoration:none;transition:color .15s}
.navlink:hover{color:var(--navy)}
`;





/* ===================== data (real register, deduped + masked) ===================== */


// Decision-maker register (named individuals) is served from /api/contacts to
// signed-in users only. It must never ship in the public browser bundle.





function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        let token = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = (data && data.session && data.session.access_token) || "";
        }
        const r = await fetch("/api/contacts", { headers: token ? { Authorization: "Bearer " + token } : {} });
        const j = await r.json();
        if (!live) return;
        if (r.ok && Array.isArray(j.contacts)) setContacts(j.contacts);
        else { setContacts([]); setDenied(r.status === 401); }
      } catch (e) {
        if (live) { setContacts([]); setDenied(false); }
      }
      if (live) setLoading(false);
    })();
    return () => { live = false; };
  }, []);
  return { contacts, loading, denied };
}















const TESTIMONIALS = [
  { name: "Jane", role: "Sonographer", quote: "They were great every step of the way, even calling out of hours and visiting once I had relocated to the UK." },
  { name: "Fred", role: "Sonographer", quote: "A reliable point of contact with the Trust who kept me informed, advocated for me and helped me secure a permanent role." },
  { name: "Lucy", role: "Sonographer", quote: "A really good experience, always checking in with timely feedback that left me feeling reassured." },
];
const CASE_STUDIES = [{
  title: "CDC Sonography Programme", sector: "NHS England", tag: "Diagnostics",
  challenge: "The Community Diagnostic Centre programme needed specialist sonographers across obstetric, gynaecological, general and MSK modalities, one of the most acutely affected fragile professions. An existing non-specialist supplier had failed, leaving sites understaffed and diagnostic capacity unrealised.",
  pillars: [
    { t: "Clinically led screening", b: "Rigorous pre-screening using bespoke clinical competency assessments." },
    { t: "Dedicated account management", b: "A single account lead owned the journey with direct NHS England liaison throughout." },
    { t: "International pipeline", b: "Established reach across Australia, New Zealand, Canada and South Africa to access talent others cannot." },
  ],
  milestones: [
    { m: "Week 2", o: "8 clinically approved CVs submitted and approved by the NHS England team" },
    { m: "Week 2", o: "6 candidates progressed to interview and offer stage" },
    { m: "Week 4", o: "First offer made" },
    { m: "End of Month 2", o: "First international candidate deployed and in post in the UK" },
    { m: "Ongoing", o: "Positive feedback from the CDC National Lead and senior NHS England stakeholders" },
  ],
  result: "Despite compressed timelines over the festive period, measurable outcomes were delivered within two months of engagement, with NHS England references available on request.",
  quote: { q: "Delivering where others could not, with clinical credibility and speed.", by: "CDC National Lead feedback" }
}];
const SOLUTIONS = [
  { l: "Permanent", d: "Direct permanent placements across every market.", i: UserCheck, lead: true },
  { l: "Insourcing", d: "On-site clinical insourcing projects.", i: Building2 },
  { l: "Contract", d: "Fixed-term and project contracts.", i: FileText },
  { l: "International", d: "Compliant overseas recruitment pipelines.", i: Globe },
  { l: "Locum", d: "Short-term cover, on demand.", i: Clock, subtle: true },
  { l: "Tenders", d: "Formal procurement opportunities where organisations invite suppliers to submit competitive bids for contracts and services.", i: Award },
  { l: "Regional Projects", d: "Large-scale workforce or service initiatives delivered across multiple Trusts, ICBs or healthcare systems within a geographical region.", i: MapPin },
  { l: "PSLs", d: "Preferred Supplier Lists: approved supplier panels used to source recruitment services from trusted, pre-qualified partners.", i: BadgeCheck },
  { l: "MSPs", d: "Managed Service Providers: a single provider that manages an organisation's temporary workforce supply, often overseeing multiple agencies through one contract.", i: Network },
  { l: "RPOs", d: "Recruitment Process Outsourcing: all or part of an organisation's hiring process outsourced to a specialist recruitment partner.", i: Briefcase },
];
const CLIENT_TYPES = [
  { l: "NHS hospitals & trusts", i: Building2 }, { l: "Private hospitals & clinics", i: Building2 },
  { l: "Harley Street & boutique clinics", i: Sparkles }, { l: "GP practices & federations", i: Stethoscope },
  { l: "Complex care providers", i: Heart }, { l: "Care homes & nursing homes", i: Home },
  { l: "SEND schools", i: Award }, { l: "Community diagnostic centres", i: Radar },
  { l: "Mental health hospitals", i: Activity }, { l: "Mobile unit providers", i: Truck },
  { l: "Local councils & governing bodies", i: Network }, { l: "International health systems", i: Globe },
];
const EVENTS = [
  { day: "18", mon: "JUL", title: "Insourcing at Scale: The CDC Opportunity", date: "18 Jul 2026", time: "13:00 BST", host: "Director of Diagnostics, London ICB", seats: "12 of 40 seats left", price: "Free for members", spec: "Sonography & Imaging", status: "Open" },
  { day: "24", mon: "JUL", title: "Neighbourhood Health: Staffing the New Model", date: "24 Jul 2026", time: "16:00 BST", host: "Chair, NW London ICB", seats: "By application", price: "Invite only", spec: "Multi-specialty", status: "Application" },
  { day: "31", mon: "JUL", title: "Audiology Workforce Round-table", date: "31 Jul 2026", time: "12:30 BST", host: "Head of Audiology, NHS Trust", seats: "22 of 40 seats left", price: "Free for members", spec: "Audiology", status: "Open" },
  { day: "07", mon: "AUG", title: "International Pipelines: AHP Supply", date: "7 Aug 2026", time: "10:00 BST", host: "Workforce Lead, NHS England", seats: "30 of 50 seats left", price: "£149", spec: "AHP", status: "Open" },
];
const EDGE_ROWS = [
  { f: "Data freshness", gen: "Old, generic exports that age fast", q: "Live intelligence, refreshed continuously" },
  { f: "Specialty depth", gen: "One-size-fits-all listings", q: "Specialist by modality, down to NOUS and paeds audiology" },
  { f: "Decision-maker access", gen: "Switchboards and generic inboxes", q: "Named, senior contacts who check Qura daily" },
  { f: "Framework coverage", gen: "Framework-only or unclear", q: "Framework and non-framework, CQC and non-CQC, clearly flagged" },
  { f: "Outcome focus", gen: "Volume of leads", q: "Right partner on merit, saving NHS time and agency spend" },
];
const CRM_BEST = [
  { i: GitBranch, t: "Salesforce-grade pipeline", b: "Full opportunity lifecycle and forecasting, without the bloat." },
  { i: Zap, t: "Pipedrive-simple flow", b: "A clean, fast, drag-and-drop way of working your deals." },
  { i: Sparkles, t: "HubSpot-style automation", b: "AI outreach, proposals and follow-ups that run themselves." },
];
const TARIFF_MONTH = "July 2026";
const TARIFFS = [
  { spec: "Sonography", session: "£780", day: "£1,420", wli: "£62/hr", trend: "+4%" },
  { spec: "Audiology", session: "£540", day: "£980", wli: "£48/hr", trend: "+2%" },
  { spec: "Radiography & Radiology", session: "£690", day: "£1,260", wli: "£58/hr", trend: "+3%" },
  { spec: "Echocardiography", session: "£720", day: "£1,310", wli: "£60/hr", trend: "+5%" },
  { spec: "Respiratory", session: "£560", day: "£1,020", wli: "£50/hr", trend: "0%" },
  { spec: "Speech & Language Therapy", session: "£500", day: "£910", wli: "£45/hr", trend: "+1%" },
  { spec: "Pathology", session: "£610", day: "£1,110", wli: "£53/hr", trend: "+2%" },
  { spec: "Biomedical Science", session: "£520", day: "£950", wli: "£46/hr", trend: "+1%" },
  { spec: "Ophthalmology", session: "£740", day: "£1,350", wli: "£64/hr", trend: "+3%" },
  { spec: "Gastroenterology", session: "£760", day: "£1,380", wli: "£66/hr", trend: "+4%" },
  { spec: "Oncology", session: "£800", day: "£1,460", wli: "£70/hr", trend: "+5%" },
  { spec: "Dermatology", session: "£700", day: "£1,280", wli: "£60/hr", trend: "+2%" },
];
const SITES = [
  { name: "Ealing Neighbourhood Health Hub", type: "Neighbourhood health centre", open: "Opens Aug 2026", mgr: "Site Manager, NW London", clinical: ["Sonographers ×3", "Audiologists ×2", "Echocardiographer ×1"], nonclinical: ["Reception ×2", "Bookings coordinator"], shortlisted: 14, status: "Shortlisting" },
  { name: "Croydon Community Diagnostic Centre", type: "Community diagnostic centre", open: "Live now", mgr: "CDC Programme Lead, South London", clinical: ["Radiographers ×4", "MRI radiographer ×2"], nonclinical: ["Admin team ×3", "Site coordinator"], shortlisted: 9, status: "Hiring" },
  { name: "Leeds North Diagnostic Hub", type: "Community diagnostic centre", open: "Opens Sep 2026", mgr: "Operational Manager, West Yorkshire", clinical: ["Sonographers ×2", "Biomedical scientists ×2"], nonclinical: ["Reception ×2"], shortlisted: 5, status: "Planning" },
];
const MOBILE_UNITS = [
  { name: "InHealth", spec: "Mobile MRI, CT & breast screening", coverage: "National", clients: "Private + NHS", status: "Verified" },
  { name: "Vanguard Healthcare Solutions", spec: "Mobile theatres & endoscopy units", coverage: "National", clients: "Private + NHS", status: "Verified" },
  { name: "Medneo", spec: "Mobile & modular MRI and CT", coverage: "National", clients: "Private", status: "Verified" },
  { name: "Compleo", spec: "Mobile diagnostic & imaging units", coverage: "National", clients: "Private", status: "Verified" },
  { name: "Alliance Medical Mobile", spec: "Mobile CT, MRI & PET-CT", coverage: "National", clients: "Private + NHS", status: "Verified" },
  { name: "Cobalt Mobile Imaging", spec: "Mobile MRI & PET-CT", coverage: "South & Midlands", clients: "Private", status: "New" },
];
const CHANNELS = [
  { k: "Mobile app", h: "Qura for iOS & Android", i: Smartphone }, { k: "Website", h: "qurahealth.org", i: Globe },
  { k: "LinkedIn", h: "/company/qura", i: Linkedin }, { k: "Instagram", h: "@qura.crm", i: Instagram },
  { k: "TikTok", h: "@qura", i: Music2 }, { k: "X", h: "@qura", i: Twitter },
];
const prChip = (p) => p === "high" ? "chip-high" : p === "med" ? "chip-med" : "chip-low";
const prLabel = (p) => p === "high" ? "High" : p === "med" ? "Medium" : "Low";

/* ===================== atoms ===================== */






/* ===================== proposal generator ===================== */
const THINK_STEPS = ["Analysing the requirement", "Matching available clinicians", "Pulling market intelligence", "Drafting a tailored proposal"];
function ProposalGenerator({ onSaved, initialOpp }) {
  const [sel, setSel] = useState(initialOpp || OPPS[0]);
  useEffect(() => { if (initialOpp) setSel(initialOpp); }, [initialOpp]);
  const [phase, setPhase] = useState("idle");
  const [step, setStep] = useState(0);
  const [proposal, setProposal] = useState(null);
  const [err, setErr] = useState(false);
  const [copied, setCopied] = useState(false);
  const fallback = (o) => ({
    title: `Workforce solution for ${o.org}`,
    summary: `${APP_NAME} proposes a fully managed staffing solution for the ${o.role.toLowerCase()} requirement at ${o.org}, mobilising pre-vetted, compliance-ready clinicians against a ${o.val} contract within your timeline.`,
    understanding: `We understand ${o.org} needs reliable, credentialed cover for ${o.role.toLowerCase()} in ${o.loc}, with a decision window of ${o.close}. Continuity of care and compliance are the priority.`,
    solution: ["Dedicated account lead with weekly delivery reporting", "Registered clinicians matched to your specialty and grade", "Single managed contract with full audit trail and SLAs"],
    clinicians: ["Dr. Sarah Ahmed, Consultant (98% match)", "Maria Santos, ICU Nurse (93% match)"],
    pricing: `Indicative value ${o.val}, billed against agreed framework rates with no upfront platform fee.`,
    next: "A 30-minute call this week to confirm scope and mobilisation dates.",
  });
  const generate = async () => {
    setErr(false); setProposal(null); setPhase("thinking"); setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, THINK_STEPS.length - 1)), 750);
    try {
      const res = await fetch("/api/anthropic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: `You are the proposal engine inside ${APP_NAME}, a healthcare staffing platform. Write a concise, confident B2B proposal for this opportunity. Respond with ONLY valid JSON, no markdown, no preamble. Opportunity: organisation "${sel.org}", requirement "${sel.role}", market "${sel.market}", location "${sel.loc}", value "${sel.val}", decision window "${sel.close}". JSON shape: {"title": string, "summary": string (1-2 sentences), "understanding": string (1-2 sentences), "solution": [3 short strings], "clinicians": [2 short strings like "Name, role (NN% match)"], "pricing": string (1 sentence, reference the value), "next": string (1 sentence call to action)}. When relevant you may cite these generic proven outcomes (never name any agency): first clinically approved CVs typically submitted within 2 weeks, candidates progressed to interview within 2 weeks, and the first international candidate deployed and in post within 2 months, with NHS England references available on request. British English. No em dashes.` }] }),
      });
      const data = await res.json();
      const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      setProposal(JSON.parse(txt.replace(/```json|```/g, "").trim()));
    } catch (e) { setErr(true); setProposal(fallback(sel)); }
    finally { clearInterval(timer); setTimeout(() => setPhase("done"), 300); }
  };
  const copyAll = () => {
    if (!proposal) return;
    const t = `${proposal.title}\n\n${proposal.summary}\n\nUnderstanding\n${proposal.understanding}\n\nSolution\n${proposal.solution.map((s) => "• " + s).join("\n")}\n\nMatched clinicians\n${proposal.clinicians.map((s) => "• " + s).join("\n")}\n\nCommercials\n${proposal.pricing}\n\nNext step\n${proposal.next}`;
    navigator.clipboard?.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="grid-2" style={{ alignItems: "start" }}>
      <div className="card" style={{ padding: 20 }}>
        <div className="chip chip-cyan" style={{ marginBottom: 12 }}><Sparkles size={13} /> AI proposal generator</div>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600 }}>Pick an opportunity</h3>
        <p className="muted" style={{ marginTop: 0, fontSize: 13.5 }}>{APP_NAME} drafts a tailored, send-ready proposal in seconds.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 6 }}>
          {((initialOpp && !OPPS.slice(0, 5).some((o) => o.org === initialOpp.org)) ? [initialOpp, ...OPPS.slice(0, 4)] : OPPS.slice(0, 5)).map((o, i) => (
            <button key={i} onClick={() => setSel(o)} style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12, transition: ".13s", border: "1.5px solid " + (sel.org === o.org ? "var(--blue)" : "var(--line)"), background: sel.org === o.org ? "#F3F7FF" : "#fff" }}>
              <div className="row" style={{ justifyContent: "space-between" }}><span style={{ fontWeight: 600, fontSize: 14 }}>{o.org}</span><span className={"chip " + prChip(o.pr)}>{prLabel(o.pr)}</span></div>
              <div className="muted row" style={{ fontSize: 12.5, marginTop: 4, gap: 10 }}><span>{o.role}</span><span>·</span><span style={{ fontWeight: 600, color: "var(--text)" }}>{o.val}</span></div>
            </button>
          ))}
        </div>
        <button className="btn btn-ai" style={{ width: "100%", marginTop: 16, justifyContent: "center", padding: "13px" }} onClick={generate} disabled={phase === "thinking"}>
          {phase === "thinking" ? <><Loader2 size={17} className="pulse" /> Generating</> : <><Sparkles size={17} /> Generate proposal</>}
        </button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden", minHeight: 420 }}>
        <div style={{ background: "var(--navy)", padding: "16px 20px" }} className="row"><Wordmark light sub="PROPOSAL ENGINE" /><div style={{ marginLeft: "auto", fontSize: 11.5, color: "#9FB0D0", fontWeight: 600 }}>PROPOSAL</div></div>
        {phase === "idle" && <div style={{ padding: 48, textAlign: "center" }}><div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--cyan-soft)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><FileText size={26} color="#06776F" /></div><div className="muted" style={{ fontSize: 14, maxWidth: 280, margin: "0 auto" }}>Your generated proposal appears here, branded and ready to send.</div></div>}
        {phase === "thinking" && <div style={{ padding: "36px 28px" }}>{THINK_STEPS.map((s, i) => (<div key={i} className="row" style={{ gap: 12, padding: "11px 0", opacity: i <= step ? 1 : .35, transition: ".3s" }}>{i < step ? <Check size={18} color="var(--ok)" /> : i === step ? <Loader2 size={18} className="pulse" color="var(--blue)" /> : <div style={{ width: 18, height: 18, borderRadius: 9, border: "2px solid var(--line)" }} />}<span style={{ fontSize: 14.5, fontWeight: i === step ? 600 : 500 }}>{s}</span></div>))}</div>}
        {phase === "done" && proposal && (
          <div className="fade" style={{ padding: "22px 24px" }}>
            {err && <div className="chip chip-med" style={{ marginBottom: 12 }}>Demo mode draft</div>}
            <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 12px" }}>{proposal.title}</h2>
            <p style={{ fontSize: 14.5, margin: "0 0 18px" }}>{proposal.summary}</p>
            {[["Understanding your need", proposal.understanding], ["Commercials", proposal.pricing], ["Next step", proposal.next]].map(([h, body]) => (
              <div key={h} style={{ marginBottom: 16 }}><div className="disp" style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", color: "var(--blue)", marginBottom: 5 }}>{h.toUpperCase()}</div><div style={{ fontSize: 14 }}>{body}</div></div>
            ))}
            <div style={{ marginBottom: 16 }}><div className="disp" style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", color: "var(--blue)", marginBottom: 6 }}>PROPOSED SOLUTION</div>{proposal.solution?.map((s, i) => <div key={i} className="row" style={{ gap: 8, fontSize: 14, marginBottom: 6 }}><Check size={15} color="var(--cyan)" style={{ marginTop: 2, flexShrink: 0 }} />{s}</div>)}</div>
            <div style={{ background: "var(--cyan-soft)", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}><div className="disp row" style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", color: "#06776F", marginBottom: 7, gap: 6 }}><Sparkles size={13} /> MATCHED CLINICIANS</div>{proposal.clinicians?.map((c, i) => <div key={i} style={{ fontSize: 13.5, marginBottom: 4 }}>{c}</div>)}</div>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => onSaved?.(sel, proposal)}><Send size={15} /> Send proposal</button>
              <button className="btn btn-ghost" onClick={copyAll}>{copied ? <Check size={15} color="var(--ok)" /> : <Copy size={15} />}</button>
              <button className="btn btn-ghost" onClick={generate}><RefreshCw size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== agency screens ===================== */
function OnboardingChecklist({ go, sentN = 0, bookedN = 0 }) {
  const [profileDone, setProfileDone] = useState(false);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_settings"); if (r?.value) setProfileDone(true); } catch (e) {} })(); }, []);
  const steps = [
    { done: sentN > 0, t: "Send your first AI proposal", k: "proposals", cta: "Open generator" },
    { done: bookedN > 0, t: "Book your first meeting", k: "meetings", cta: "Book meeting" },
    { done: profileDone, t: "Complete your profile", k: "settings", cta: "Go to settings" },
  ];
  const doneN = steps.filter((s) => s.done).length;
  if (doneN >= 3) return null;
  return (
    <div className="card" style={{ padding: 22, marginBottom: 18, background: "linear-gradient(120deg,var(--cyan-soft),#fff 70%)" }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}><div><div className="disp" style={{ fontWeight: 700, fontSize: 17 }}>Get set up on {APP_NAME}</div><div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>Three quick steps to your first win.</div></div><span className="chip chip-cyan">{doneN} of 3 done</span></div>
      <div style={{ height: 6, borderRadius: 6, background: "#fff", margin: "14px 0 16px", overflow: "hidden" }}><div style={{ height: "100%", width: `${(doneN / 3) * 100}%`, background: "linear-gradient(90deg,var(--teal),var(--cyan))", borderRadius: 6, transition: ".3s" }} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{steps.map((s, i) => (<div key={i} className="row" style={{ justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 11, background: "#fff", border: "1px solid var(--line)" }}><div className="row" style={{ gap: 11 }}>{s.done ? <div style={{ width: 24, height: 24, borderRadius: 999, background: "var(--ok-bg)", display: "grid", placeItems: "center" }}><Check size={15} color="#0C7A47" /></div> : <div style={{ width: 24, height: 24, borderRadius: 999, border: "2px solid var(--line)" }} />}<span style={{ fontWeight: 600, fontSize: 14, color: s.done ? "var(--muted)" : "var(--text)" }}>{s.t}</span></div>{s.done ? <span className="chip chip-low">Done</span> : <button className="btn btn-light" style={{ fontSize: 13, padding: "7px 12px" }} onClick={() => go(s.k)}>{s.cta} <ArrowRight size={13} /></button>}</div>))}</div>
    </div>
  );
}
const Dashboard = ({ go, sentN = 0, bookedN = 0, name }) => (
  <div>
    <IllustrativeBanner />
    <PageHead title={"Welcome back" + (name ? ", " + name : "")} sub="Here is what is moving across your markets today." right={<button className="btn btn-ai" onClick={() => go("proposals")}><Sparkles size={16} /> New proposal</button>} />
    <OnboardingChecklist go={go} sentN={sentN} bookedN={bookedN} />
    <div className="grid-stats" style={{ marginBottom: 18 }}>
      <Stat label="Live opportunities" value="1,248" delta="12% vs 30d" icon={Target} />
      <Stat label="Pipeline value" value="£24.6M" delta="21% vs 30d" icon={GitBranch} accent="cyan" />
      <Stat label="Meetings booked" value="86" delta="9% vs 30d" icon={Calendar} />
      <Stat label="Proposals sent" value="63" delta="14% vs 30d" icon={FileText} accent="cyan" />
    </div>
    <div className="grid-2" style={{ marginBottom: 18 }}>
      <div className="card" style={{ padding: 20 }}>
        <SectionHead title="Pipeline value trend" action={<span className="chip chip-blue">£M</span>} />
        <Chart kind="pipeline" data={PIPE_DATA} height={210} />
      </div>
      <div className="card" style={{ padding: 20 }}>
        <SectionHead title="Top opportunities" action={<button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => go("opportunities")}>View all</button>} />
        {OPPS.slice(0, 4).map((o, i) => (<div key={i} className="row" style={{ justifyContent: "space-between", padding: "11px 0", borderBottom: i < 3 ? "1px solid var(--line)" : "none" }}><div><div style={{ fontWeight: 600, fontSize: 14 }}>{o.org}</div><div className="muted" style={{ fontSize: 12.5 }}>{o.role} · {o.market}</div></div><div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, fontSize: 14 }}>{o.val}</div><span className={"chip " + prChip(o.pr)} style={{ marginTop: 3 }}>{o.close}</span></div></div>))}
      </div>
    </div>
    <div className="card" style={{ padding: 20 }}>
      <SectionHead title="Market intelligence" action={<button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => go("intel")}>All signals</button>} />
      {INTEL.slice(0, 3).map((it, i) => (<div key={i} className="row" style={{ gap: 12, padding: "11px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}><span className="chip chip-grey">{it.tag}</span><span style={{ fontSize: 14, flex: 1 }}>{it.text}</span><span className="faint" style={{ fontSize: 12 }}>{it.t}</span></div>))}
    </div>
  </div>
);
const Opportunities = ({ go, onPropose, market = "all", onToast }) => {
  const [f, setF] = useState("All"); const [q, setQ] = useState("");
  const [savedIds, setSavedIds] = useState([]);
  const saveOpp = async (o) => { const id = o.org + "|" + o.role; const entry = { id, org: o.org, role: o.role, market: o.market, val: o.val, loc: o.loc, close: o.close, source: o.source, score: o.score, pr: o.pr }; try { let list = []; try { const r = await window.storage?.get("qura_saved_opps"); if (r?.value) list = JSON.parse(r.value); } catch (e) {} if (!Array.isArray(list)) list = []; if (!list.some((x) => x.id === id)) { list = [entry, ...list]; await window.storage?.set("qura_saved_opps", JSON.stringify(list)); } } catch (e) {} setSavedIds((v) => v.includes(id) ? v : [...v, id]); if (onToast) onToast("Opportunity saved"); };
  const mapMkt = { all: "All", nhs: "NHS UK", private: "Private UK", international: "International" };
  useEffect(() => { setF(mapMkt[market] || "All"); }, [market]);
  const markets = ["All", "NHS UK", "Private UK", "International", "Africa", "Middle East"];
  // Real procurement notices from the daily feed, shown above the illustrative
  // set. Until this, the web Clinical Demand page showed only examples while
  // the live notices sat in the API unread.
  const [live, setLive] = useState([]);
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        let token = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = (data && data.session && data.session.access_token) || "";
        }
        const r = await fetch("/api/demand", { headers: token ? { Authorization: "Bearer " + token } : {} });
        const j = await r.json();
        if (dead || !Array.isArray(j.items)) return;
        setLive(j.items.filter((n) => n.live && !n.seeded).map((n) => ({
          org: n.buyer, role: n.title, spec: n.profession || "Healthcare services",
          val: n.rate || "Value not stated",
          market: n.market === "NHS" ? "NHS UK" : n.market === "Private" ? "Private UK" : "International",
          loc: n.region || "UK", close: n.closes || "See notice",
          pr: "live", score: null, status: "Live", source: n.source, url: n.url,
        })));
      } catch (e) {}
    })();
    return () => { dead = true; };
  }, []);
  const ALL_OPPS = [...live, ...OPPS];

  const list = ALL_OPPS.filter((o) => (f === "All" || o.market === f || (f === "International" && ["Middle East", "Africa"].includes(o.market))) && o.org.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHead title="Opportunities" sub={live.length ? `${live.length} live procurement notices, refreshed daily, plus ${OPPS.length} illustrative examples` : `${OPPS.length} opportunities across your markets`} right={CURRENCY[market].rate !== 1 ? <span className="chip" style={{ background: "var(--cyan-soft)", color: "#06776F" }}>Converted at {CURRENCY[market].sym}{CURRENCY[market].rate}/£</span> : null} />
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row" style={{ gap: 10, marginBottom: 12, flexWrap: "wrap" }}><div className="row" style={{ flex: 1, minWidth: 220, gap: 8, border: "1px solid var(--line)", borderRadius: 999, padding: "0 14px", background: "var(--bg2)" }}><Search size={16} className="faint" /><input className="in" style={{ border: "none", boxShadow: "none", padding: "10px 0" }} placeholder="Search organisations" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
        <div className="row scrollx" style={{ gap: 8, overflowX: "auto", paddingBottom: 4 }}>{markets.map((m) => (<button key={m} onClick={() => setF(m)} className="chip" style={{ padding: "7px 14px", whiteSpace: "nowrap", background: f === m ? "var(--blue)" : "#EEF1F7", color: f === m ? "#fff" : "#5A6783" }}>{m}</button>))}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map((o, i) => (
          <div key={i} className="card lift" style={{ padding: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div className="row" style={{ gap: 14 }}><div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><Building2 size={20} color="#1E54E6" /></div><div><div className="row" style={{ gap: 9 }}><span style={{ fontWeight: 600, fontSize: 15.5 }}>{o.org}</span><span className="chip chip-cyan"><Sparkles size={11} /> {o.score}</span><span className="chip chip-grey" style={{ fontSize: 11 }}>{o.market}</span></div><div className="muted row hsm" style={{ fontSize: 13, gap: 14, marginTop: 4 }}><span>{o.role}</span><span className="row" style={{ gap: 4 }}><MapPin size={12} />{o.loc}</span><span className="row" style={{ gap: 4 }}><Radar size={12} />{o.source}</span>{o.url ? <a href={o.url} target="_blank" rel="noreferrer" style={{ color: "var(--teal)", fontSize: 12.5 }}>Open notice</a> : null}{!o.url ? <DemoTag /> : null}</div></div></div>
              <div className="row" style={{ gap: 16 }}><div style={{ textAlign: "right" }}><div className="disp" style={{ fontWeight: 700, fontSize: 17 }}>{convMoney(o.val, market)}</div><span className="row faint" style={{ fontSize: 12, gap: 4, justifyContent: "flex-end" }}><Clock size={11} />Closes {o.close}</span></div><span className={"chip " + prChip(o.pr)}>{prLabel(o.pr)}</span><button className={"btn hsm " + (savedIds.includes(o.org + "|" + o.role) ? "btn-light" : "btn-ghost")} onClick={() => saveOpp(o)} disabled={savedIds.includes(o.org + "|" + o.role)}>{savedIds.includes(o.org + "|" + o.role) ? <><Star size={14} fill="currentColor" /> Saved</> : <><Star size={14} /> Save</>}</button><button className="btn btn-ai hsm" onClick={() => onPropose(o)}><Sparkles size={14} /> Propose</button></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const DecisionMakers = ({ plan = "starter", onToast }) => {
  const { contacts: DMS, loading: dmsLoading, denied: dmsDenied } = useContacts();
  const [q, setQ] = useState(""); const [sp, setSp] = useState("All");
  const tier = CREDIT_TIERS[plan] || CREDIT_TIERS.starter;
  const today = new Date().toISOString().slice(0, 10);
  const [used, setUsed] = useState({ date: today, dm: 0, invite: 0 });
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_credits"); let v = r?.value ? JSON.parse(r.value) : null; if (!v || v.date !== today) v = { date: today, dm: 0, invite: 0 }; setUsed(v); } catch (e) {} })(); }, []);
  const persist = (v) => { setUsed(v); try { window.storage?.set("qura_credits", JSON.stringify(v)); } catch (e) {} };
  const dmLeft = Math.max(0, tier.dm - used.dm);
  const inviteLeft = Math.max(0, tier.invite - used.invite);
  const spendDM = (n) => { if (used.dm + n > tier.dm) { if (onToast) onToast("Out of message credits today. Upgrade for more."); return false; } persist({ date: today, dm: used.dm + n, invite: used.invite }); return true; };
  const spendInvite = (n) => { if (used.invite + n > tier.invite) { if (onToast) onToast("Out of follow-invite credits today. Upgrade for more."); return false; } persist({ date: today, dm: used.dm, invite: used.invite + n }); return true; };
  const [shot, setShot] = useState(false); const [pick, setPick] = useState([]);
  const list = DMS.filter((d) => (sp === "All" || d.spec === sp) && (d.name.toLowerCase().includes(q.toLowerCase()) || d.org.toLowerCase().includes(q.toLowerCase())));
  const specChip = (x) => { const i = SPECIALTIES.indexOf(x); return SPEC_DATA[i] ? SPEC_DATA[i].c : "#1E54E6"; };
  const keyOf = (d) => d.name + "|" + d.org;
  const toggle = (k) => setPick((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k]);
  const reveal = (d) => { if (spendDM(1) && onToast) onToast("Contact revealed for " + d.name + " · 1 credit used"); };
  const invite = (d) => { if (spendInvite(1) && onToast) onToast("Follow invite sent to " + d.name); };
  const sendShot = () => { if (!pick.length) return; if (spendDM(pick.length) && onToast) { onToast("Mailshot sent to " + pick.length + " decision-makers · " + pick.length + " credits used"); setPick([]); setShot(false); } };
  return (
    <div>
      <PageHead title="Decision makers" sub={"Named healthcare decision-makers across " + REGISTER.orgs + " NHS and independent organisations, researched and maintained by the founders. Contact details are held back until you choose to reveal them."} right={<button className={"btn " + (shot ? "btn-primary" : "btn-light")} onClick={() => { setShot((v) => !v); setPick([]); }}><Send size={14} /> {shot ? "Cancel mailshot" : "Mailshot"}</button>} />
      <div className="grid-stats" style={{ marginBottom: 14 }}><Stat label="NHS trusts & ICBs in England" value="250+" icon={Building2} /><Stat label="Founder community" value="13,000+" icon={Users} accent="cyan" /><Stat label="Researched contacts" value={String(REGISTER.deduped)} icon={ShieldCheck} /></div>
      <div className="card" style={{ padding: "14px 16px", marginBottom: 14, background: "#F4F7FB", border: "1px solid var(--line)" }}>
        <div style={{ fontSize: 12.5, lineHeight: 1.65, color: "var(--muted)" }}>
          <strong style={{ color: "var(--navy)" }}>How this directory was built.</strong> This is a founder-populated
          directory, compiled over many years from publicly available business information: official organisation
          websites, publicly accessible professional profiles, conference and event speaker listings, published
          papers, board papers and other legitimate public sources. It has been independently researched, verified
          and maintained by Qura's founders so that you do not have to repeat that work.
          {" "}Qura claims no ownership of any individual's contact information, and the directory is provided solely
          to support legitimate business communication between healthcare organisations, suppliers and professionals.
          Records are reviewed and updated regularly, and any individual can ask to be removed at
          {" "}<a href="mailto:privacy@qurahealth.org" style={{ color: "var(--teal)" }}>privacy@qurahealth.org</a>,
          which we action promptly. Please use these details professionally and in line with our
          {" "}<a href="/terms.html" style={{ color: "var(--teal)" }}>terms</a>.
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--navy)", color: "#fff", border: "none" }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div className="row" style={{ gap: 20 }}>
            <div><div className="disp" style={{ fontSize: 22, fontWeight: 700 }}>{dmLeft}<span style={{ fontSize: 13, color: "#8295B6" }}> / {tier.dm}</span></div><div style={{ fontSize: 12, color: "#9FB0D0" }}>Message credits today</div></div>
            <div><div className="disp" style={{ fontSize: 22, fontWeight: 700 }}>{inviteLeft}<span style={{ fontSize: 13, color: "#8295B6" }}> / {tier.invite}</span></div><div style={{ fontSize: 12, color: "#9FB0D0" }}>Follow-invites today</div></div>
          </div>
          <div className="hsm" style={{ maxWidth: 330, fontSize: 12, color: "#9FB0D0", lineHeight: 1.5 }}>Credits keep Qura specialist, not spam. They reset daily and scale with your plan, so every message to a hospital is a considered one.</div>
        </div>
      </div>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="row" style={{ gap: 8, border: "1px solid var(--line)", borderRadius: 999, padding: "0 14px", background: "var(--bg2)", marginBottom: 12 }}><Search size={16} className="faint" /><input className="in" style={{ border: "none", boxShadow: "none", padding: "10px 0" }} placeholder="Search name or organisation" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="row scrollx" style={{ gap: 8, overflowX: "auto", paddingBottom: 4 }}>{["All", ...SPECIALTIES].map((m) => (<button key={m} onClick={() => setSp(m)} className="chip" style={{ padding: "7px 14px", whiteSpace: "nowrap", background: sp === m ? "var(--blue)" : "#EEF1F7", color: sp === m ? "#fff" : "#5A6783" }}>{m}</button>))}</div>
      </div>
      <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{list.length} contacts shown{shot ? " · tap cards to select, then send" : ""}</div>
      <div className="grid-3">{list.map((d, i) => { const k = keyOf(d); const on = pick.includes(k); return (
        <div key={i} className="card lift" style={{ padding: 18, border: on ? "2px solid var(--cyan)" : "1px solid var(--line)", cursor: shot ? "pointer" : "default" }} onClick={shot ? () => toggle(k) : undefined}>
          <div className="row" style={{ justifyContent: "space-between" }}><Avatar initials={d.name.split(" ").slice(-2).map((x) => x[0]).join("")} size={44} />{shot ? <span style={{ width: 22, height: 22, borderRadius: 999, border: "2px solid " + (on ? "var(--cyan)" : "var(--line)"), background: on ? "var(--cyan)" : "#fff", display: "grid", placeItems: "center" }}>{on ? <Check size={13} color="#fff" /> : null}</span> : <span className="chip" style={{ background: specChip(d.spec) + "1A", color: specChip(d.spec) }}>{d.spec}</span>}</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 12 }}>{d.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{d.role}</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>{d.org}</div>
          <div className="faint row" style={{ fontSize: 12, gap: 6, marginTop: 8 }}><Mail size={12} /><span style={{ letterSpacing: 1 }}>{"•••••@•••"}</span></div>
          {!shot && <div className="row" style={{ gap: 8, marginTop: 14 }}><button className="btn btn-ghost hsm" style={{ flex: 1, justifyContent: "center", padding: "9px", fontSize: 13 }} onClick={() => reveal(d)}><Mail size={14} /> Reveal (1)</button><button className="btn btn-light hsm" style={{ justifyContent: "center", padding: "9px 11px" }} onClick={() => invite(d)} title="Invite to follow your company"><Bell size={14} /></button></div>}
        </div>
      ); })}</div>
      {shot && <div style={{ position: "sticky", bottom: 16, marginTop: 16 }}><div className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 8px 30px rgba(10,23,48,.18)" }}><div style={{ fontSize: 13.5 }}><b>{pick.length}</b> selected · costs <b>{pick.length}</b> credit{pick.length === 1 ? "" : "s"} ({dmLeft} left today)</div><button className="btn btn-primary" onClick={sendShot} disabled={!pick.length || pick.length > dmLeft}><Send size={15} /> Send mailshot</button></div></div>}
    </div>
  );
};
const Outreach = () => {
  const seq = [{ ch: "Email", to: "Sarah Whitfield", subj: "Theatre staffing partnership", status: "Opened", icon: Mail }, { ch: "LinkedIn", to: "Khalid Al-Mansoori", subj: "Connection + intro note", status: "Replied", icon: Users }, { ch: "Email", to: "Dr. Amara Okeke", subj: "Follow-up: radiographers", status: "Sent", icon: Mail }, { ch: "Call task", to: "James Patterson", subj: "Discovery call prep", status: "Scheduled", icon: Calendar }];
  return (
    <div>
      <PageHead title="Outreach" sub="Multi-channel sequences across email, LinkedIn and calls" right={<button className="btn btn-primary"><Plus size={16} /> New sequence</button>} />
      <div className="grid-stats" style={{ marginBottom: 18 }}><Stat label="Active sequences" value="14" icon={Send} /><Stat label="Open rate" value="62%" delta="6% vs 30d" icon={Mail} accent="cyan" /><Stat label="Reply rate" value="28%" delta="4% vs 30d" icon={MessageSquare} /><Stat label="Meetings booked" value="19" icon={Calendar} accent="cyan" /></div>
      <div className="card" style={{ padding: 20 }}><SectionHead title="Live sequence: Q3 framework push" />{seq.map((s, i) => (<div key={i} className="row" style={{ gap: 14, padding: "13px 0", borderBottom: i < seq.length - 1 ? "1px solid var(--line)" : "none" }}><div style={{ width: 38, height: 38, borderRadius: 10, background: "#EEF3FF", display: "grid", placeItems: "center" }}><s.icon size={16} color="#1E54E6" /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{s.subj}</div><div className="muted" style={{ fontSize: 12.5 }}>{s.ch} · to {s.to}</div></div><span className={"chip " + (s.status === "Replied" ? "chip-low" : s.status === "Opened" ? "chip-blue" : "chip-grey")}>{s.status}</span></div>))}</div>
    </div>
  );
};
const Proposals = ({ onSaved, initialOpp }) => (<div><PageHead title="Proposals" sub="Turn any opportunity into a send-ready, branded proposal in seconds." right={<span className="chip chip-cyan"><Sparkles size={13} /> Powered by AI</span>} /><ProposalGenerator onSaved={onSaved} initialOpp={initialOpp} /></div>);
const Meetings = ({ sent = [], booked = [], onBook, onEdit, onDelete }) => {
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState({ type: "", org: "", who: "", when: "" });
  const lbl = { fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 };
  const ib = { width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", flexShrink: 0 };
  const list = [...booked, ...sent.map((s) => ({ type: "Discovery call", with: "Awaiting reply", org: s.org, when: "To schedule", status: "Pending", isNew: true })), ...MEETINGS];
  const openNew = () => { setEditId(null); setF({ type: "", org: "", who: "", when: "" }); setShow(true); };
  const openEdit = (m) => { setEditId(m.id); setF({ type: m.type, org: m.org, who: m.with, when: m.when }); setShow(true); };
  const close = () => { setShow(false); setEditId(null); };
  const submit = () => { const data = { type: f.type || "Meeting", with: f.who || "New contact", org: f.org || "To confirm", when: f.when || "To schedule", status: "Pending", isNew: true }; if (editId != null) onEdit?.(editId, data); else onBook?.(data); close(); };
  return (
  <div>
    <PageHead title="Meetings" sub="Booked and pending meetings, synced to your calendar" right={<button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Book meeting</button>} />
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{list.map((m, i) => (<div key={i} className="card row lift" style={{ padding: 18, gap: 16, justifyContent: "space-between", border: m.isNew ? "1.5px solid var(--cyan)" : "1px solid var(--line)" }}><div className="row" style={{ gap: 16 }}><div style={{ width: 50, height: 50, borderRadius: 12, background: "var(--cyan-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Calendar size={20} color="#06776F" /></div><div><div style={{ fontWeight: 600, fontSize: 15 }}>{m.type}</div><div className="muted" style={{ fontSize: 13 }}>{m.with} · {m.org}</div></div></div><div className="row" style={{ gap: 10 }}><span className="row faint hsm" style={{ fontSize: 13, gap: 5 }}><Clock size={13} />{m.when}</span><span className={"chip " + (m.status === "Confirmed" ? "chip-low" : "chip-med")}>{m.status}</span>{m.id != null && (<><button title="Edit" onClick={() => openEdit(m)} style={{ ...ib, color: "var(--muted)" }}><Pencil size={15} /></button><button title="Delete" onClick={() => onDelete?.(m.id)} style={{ ...ib, color: "var(--red)" }}><Trash2 size={15} /></button></>)}</div></div>))}</div>
    {show && (<div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(10,23,51,.55)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 20 }} className="fade" onClick={close}><div className="card" style={{ width: "100%", maxWidth: 420, padding: 24 }} onClick={(e) => e.stopPropagation()}>
      <SectionHead title={editId != null ? "Edit meeting" : "Book a meeting"} />
      <label style={lbl}>Meeting type</label><input className="in" placeholder="e.g. Discovery call" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} />
      <label style={{ ...lbl, marginTop: 12 }}>Organisation</label><input className="in" placeholder="e.g. Imperial College Healthcare" value={f.org} onChange={(e) => setF({ ...f, org: e.target.value })} />
      <label style={{ ...lbl, marginTop: 12 }}>With</label><input className="in" placeholder="Contact name" value={f.who} onChange={(e) => setF({ ...f, who: e.target.value })} />
      <label style={{ ...lbl, marginTop: 12 }}>When</label><input className="in" placeholder="e.g. Thu 14:00" value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })} />
      <div className="row" style={{ gap: 10, marginTop: 18, justifyContent: "flex-end" }}><button className="btn btn-light" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={submit}><Check size={15} /> {editId != null ? "Save changes" : "Add meeting"}</button></div>
    </div></div>)}
  </div>
  );
};

const Pipeline = ({ sent = [], moves = {}, onMove, onBack, lost = {}, onWon, onLost, market = "all" }) => {
  const [openKey, setOpenKey] = useState(null);
  const base = [];
  STAGES.forEach((st, si) => st.deals.forEach((d) => base.push({ o: d.o, v: d.v, si })));
  sent.forEach((s) => base.push({ o: s.org, v: s.val, si: 2, isNew: true }));
  const deals = base.map((d) => { const key = d.o + "|" + d.v; return { ...d, key, si: moves[key] != null ? moves[key] : d.si }; });
  const sel = deals.find((d) => d.key === openKey);
  const lostN = Object.keys(lost).length;
  return (
  <div>
    <PageHead title="Pipeline & CRM" sub={convMoney("£24.6M", market) + " across 5 stages"} right={<div className="row" style={{ gap: 8 }}><span className="chip chip-grey">Tap a deal to open it</span>{CURRENCY[market].rate !== 1 && <span className="chip" style={{ background: "var(--cyan-soft)", color: "#06776F" }}>Converted at {CURRENCY[market].sym}{CURRENCY[market].rate}/£</span>}{lostN > 0 && <span className="chip" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{lostN} lost</span>}</div>} />
    <div className="row scrollx" style={{ gap: 14, overflowX: "auto", alignItems: "flex-start", paddingBottom: 8 }}>{STAGES.map((st, si) => { const col = deals.filter((d) => d.si === si && !lost[d.key]); return (<div key={si} style={{ minWidth: 220, flex: "1 0 220px" }}><div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{st.name}</span><span className="chip chip-grey">{col.length}</span></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{col.map((d) => (<button key={d.key} onClick={() => setOpenKey(d.key)} className="card lift" style={{ padding: 14, width: "100%", textAlign: "left", cursor: "pointer", border: d.isNew ? "1.5px solid var(--cyan)" : "1px solid var(--line)" }}><div className="row" style={{ justifyContent: "space-between", gap: 6 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{d.o}</div>{d.isNew && <span className="chip chip-cyan" style={{ fontSize: 10 }}>New</span>}</div><div className="disp" style={{ fontWeight: 700, fontSize: 16, marginTop: 6, color: si === STAGES.length - 1 ? "var(--ok)" : "var(--text)" }}>{convMoney(d.v, market)}</div><div style={{ height: 4, borderRadius: 4, marginTop: 10, background: "#EDF1F8" }}><div style={{ height: "100%", width: `${(si + 1) * 20}%`, borderRadius: 4, background: si === STAGES.length - 1 ? "var(--ok)" : "var(--blue)" }} /></div></button>))}</div></div>); })}</div>
    {openKey && sel && (<><div onClick={() => setOpenKey(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,23,51,.4)", zIndex: 60 }} /><div className="fade" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 92vw)", background: "#fff", zIndex: 61, boxShadow: "var(--sh-lg)", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "radial-gradient(120% 90% at 100% 0%, #14294C 0%, var(--navy) 60%)", padding: "20px 22px", color: "#fff" }}><div className="row" style={{ justifyContent: "space-between" }}><span className="chip" style={{ background: "rgba(0,194,184,.16)", color: "#5FE6DC" }}>{STAGES[sel.si].name}</span><button onClick={() => setOpenKey(null)} style={{ background: "none", color: "#fff" }}><X size={20} /></button></div><h2 className="disp" style={{ fontSize: 22, fontWeight: 700, marginTop: 14 }}>{sel.o}</h2><div className="num" style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>{convMoney(sel.v, market)}</div></div>
      <div style={{ padding: 22, flex: 1, overflowY: "auto" }}><SectionHead title="Stage" /><div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 18 }}>{STAGES.map((st, i) => (<div key={i} className="row" style={{ gap: 11, padding: "8px 0" }}><div style={{ width: 22, height: 22, borderRadius: 999, background: i < sel.si ? "var(--ok)" : i === sel.si ? "var(--blue)" : "#EDF1F8", display: "grid", placeItems: "center", flexShrink: 0 }}>{i < sel.si ? <Check size={13} color="#fff" /> : i === sel.si ? <div style={{ width: 8, height: 8, borderRadius: 999, background: "#fff" }} /> : null}</div><span style={{ fontSize: 14, fontWeight: i === sel.si ? 600 : 400, color: i <= sel.si ? "var(--text)" : "var(--muted)" }}>{st.name}</span></div>))}</div><div className="card" style={{ padding: 16, background: "var(--bg)", border: "none" }}><div className="row" style={{ justifyContent: "space-between", fontSize: 13.5, marginBottom: 8 }}><span className="muted">Deal value</span><span style={{ fontWeight: 700 }}>{convMoney(sel.v, market)}</span></div><div className="row" style={{ justifyContent: "space-between", fontSize: 13.5 }}><span className="muted">Current stage</span><span style={{ fontWeight: 600 }}>{STAGES[sel.si].name}</span></div></div></div>
      <div style={{ padding: 18, borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 10 }}><div className="row" style={{ gap: 10 }}><button className="btn btn-light" style={{ flex: 1, justifyContent: "center", opacity: sel.si === 0 ? .5 : 1 }} disabled={sel.si === 0} onClick={() => onBack && onBack(sel.key, sel.si)}>Back</button><button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", opacity: sel.si >= STAGES.length - 1 ? .5 : 1 }} disabled={sel.si >= STAGES.length - 1} onClick={() => onMove && onMove(sel.key, sel.si)}>Advance <ArrowRight size={15} /></button></div><div className="row" style={{ gap: 10 }}><button className="btn" style={{ flex: 1, justifyContent: "center", background: "var(--red-bg)", color: "var(--red)" }} onClick={() => { onLost && onLost(sel.key); setOpenKey(null); }}>Mark as lost</button><button className="btn" style={{ flex: 1, justifyContent: "center", background: "var(--ok-bg)", color: "#0C7A47" }} onClick={() => { onWon && onWon(sel.key); setOpenKey(null); }}><Check size={15} /> Mark as won</button></div></div>
    </div></>)}
  </div>
  );
};

const perfFor = (id) => SUP_PERF[id] || { isNew: true };
const perfFrom = (id, feed) => { const base = SUP_PERF[id]; const won = (feed || []).filter((p) => p.status === 4 && p.winnerId === id && p.days); if (!base && won.length === 0) return { isNew: true }; const wins = (base ? base.wins : 0) + won.length; const totalDays = (base ? base.avgFill * base.wins : 0) + won.reduce((a, p) => a + p.days, 0); const avgFill = wins ? +(totalDays / wins).toFixed(1) : (base ? base.avgFill : null); return { winRate: base ? base.winRate : null, avgFill, wins, isNew: false, freshWins: won.length }; };


const KIT_STOP = new Set(["and","the","for","with","full","service","services","ready","site","fixed","week","weeks","unit","units","team","teams","rate","rates","pool","loan","staff","clinic","clinics","relocatable","install","managed","approved","framework","compliant","integrated","point","care","based","new"]);
const kitToCats = (kit) => { const w = new Set(); (kit || []).forEach((k) => ((k.n || "") + " " + (k.s || "")).toLowerCase().split(/[^a-z0-9]+/).forEach((t) => { if (t.length >= 3 && !KIT_STOP.has(t) && !/^[0-9]/.test(t)) w.add(t); })); return [...w]; };
const catSupplier = (cat) => (cat && cat.kit && cat.kit.length) ? { id: "you", name: cat.name || "My company", type: "Your company", init: (cat.name || "Me").slice(0, 2).toUpperCase(), cats: kitToCats(cat.kit), kit: cat.kit, premium: true, verified: true, mine: true } : null;
const matchKit = (p, userCat) => { const hay = ((p.body || "") + " " + ((p.reqs || []).join(" "))).toLowerCase(); const pool = [...SUPPLIERS]; const you = catSupplier(userCat); if (you) pool.unshift(you); return pool.filter((s) => s.cats.some((c) => hay.includes(c.toLowerCase()))); };


const marketLabel = { nhs: "NHS", private: "Private", international: "International" };

const convMoney = (str, market) => { const cur = CURRENCY[market] || CURRENCY.all; if (!str || cur.rate === 1) return str; const m = String(str).match(/([0-9.]+)\s*([KMkm]?)/); if (!m) return str; let v = parseFloat(m[1]); const suf = m[2].toUpperCase(); v = v * (suf === "M" ? 1e6 : suf === "K" ? 1e3 : 1) * cur.rate; let out; if (v >= 1e6) out = (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M"; else if (v >= 1e3) out = Math.round(v / 1e3) + "K"; else out = Math.round(v).toString(); return cur.sym + out; };








const FEED_SEED = [
  { id: "f1", org: "North London Community Diagnostic Centre", who: "Dr. Amara Okafor", title: "Clinical Operations Lead", init: "AO", ago: "2h", body: "Proud to announce the opening of our new Community Diagnostic Centre over the coming months. We are urgently seeking 5 MRI radiographers and 6 sonographers to start within 3 months, with imaging equipment on the ground within a month. If you can help, please reach out.", reqs: ["5 MRI radiographers", "6 sonographers", "Imaging equipment", "Start within 3 months"], market: "nhs", budget: "£1.8M", status: 0, posted: "Tue 09:14", responders: 4 },
  { id: "f2", org: "Whitmore NHS Foundation Trust", who: "Sarah Bennett", title: "Head of Elective Recovery", init: "SB", ago: "5h", body: "Gynaecology is now our single largest specialty on the elective list. We are opening additional consultant-led insourcing capacity and need partners who can run clinics inside our systems and governance, closer to where women live. Weekend and evening lists preferred.", reqs: ["Consultant-led gynaecology", "Insourcing capacity", "Weekend & evening lists"], market: "nhs", budget: "£640K", status: 1, posted: "Tue 06:40", responders: 7 },
  { id: "f3", org: "Meridian Private Hospitals Group", who: "James Aluko", title: "Group Procurement Director", init: "JA", ago: "1d", body: "Expanding endoscopy across three sites. Seeking a supplier for decontamination equipment plus a managed sonography service. Now at proposal stage with a shortlisted partner.", reqs: ["Endoscopy decontamination", "Managed sonography", "3 sites"], market: "private", budget: "£920K", status: 2, posted: "Mon 11:20", responders: 5 },
  { id: "f4", org: "Coastal Care Partnership", who: "Priya Nair", title: "Director of Operations", init: "PN", ago: "3d", body: "Cardiac diagnostics mobile unit requirement, now closed. Thank you to everyone who responded so quickly.", reqs: ["Cardiac diagnostics", "Mobile unit"], market: "private", budget: "£310K", status: 4, posted: "Tue 08:00", fulfilled: "Thu 15:30", days: 2, responders: 9, winnerId: "s4", winner: "anon" },
  { id: "f5", org: "Gulf Health Group (Dubai)", who: "Dr. Layla Hassan", title: "Chief Medical Officer", init: "LH", ago: "6h", body: "Opening two new diagnostic centres across the UAE. We are seeking managed sonography and MRI imaging partners, and welcome UK-based suppliers who can support international deployment.", reqs: ["MRI imaging", "Managed sonography", "UAE deployment", "International"], market: "international", budget: "$2.4M", status: 0, posted: "Tue 07:30", responders: 3 },
  { id: "au1", fragile: true, org: "Western Sydney Imaging Group", who: "Dr. Nadia Rahman", title: "Clinical Director", init: "NR", ago: "3h", body: "The South West Sydney growth corridor is expanding fast and the July 2025 MBS reforms have opened up MRI access, so our volumes are climbing. We urgently need 4 sonographers and 3 CT/MRI radiographers across Liverpool and Campbelltown. Sponsorship available for the right overseas candidates.", reqs: ["4 sonographers", "3 CT/MRI radiographers", "Liverpool & Campbelltown", "Sponsorship available"], market: "australia", budget: "A$1.2M", status: 0, posted: "Wed 08:10", responders: 5 },
  { id: "au2", org: "Melbourne Cardiac Diagnostics", who: "Tom Fitzgerald", title: "Operations Manager", init: "TF", ago: "7h", body: "Growing our private echo service and need experienced cardiac sonographers. With roughly a quarter of the workforce nearing retirement, we are open to part-time, flexible and relocating candidates.", reqs: ["Cardiac sonographers", "Echocardiography", "Part-time or full-time"], market: "australia", budget: "A$540K", status: 1, posted: "Wed 05:30", responders: 6 },
  { id: "au3", fragile: true, org: "Queensland Regional Health Service", who: "Dr. Ava Nguyen", title: "Imaging Lead", init: "AN", ago: "1d", body: "Radiographers remain in national shortage across nearly every state, and regional access is our biggest challenge. Seeking CT radiographers and a locum sonographer for our rural sites, with generous regional loadings.", reqs: ["CT radiographers", "Locum sonographer", "Regional loadings"], market: "australia", budget: "A$780K", status: 0, posted: "Tue 14:05", responders: 3 },
  { id: "au4", org: "Perth Allied Health Network", who: "Sophie Clarke", title: "Workforce Lead", init: "SC", ago: "2d", body: "Building a broad allied health and nursing pipeline. With around half of advertised imaging roles going unfilled, we are widening our search to allied health professionals and nurses across Western Australia. International applications welcome.", reqs: ["Allied health professionals", "Registered nurses", "International welcome"], market: "australia", budget: "A$1.5M", status: 0, posted: "Mon 10:40", responders: 4 },
  { id: "nz1", fragile: true, org: "Auckland Community Diagnostics", who: "Hana Williams", title: "Service Manager", init: "HW", ago: "5h", body: "Like most of New Zealand, we rely heavily on overseas-trained sonographers, with the majority of new registrants each year coming from abroad. We are recruiting 3 sonographers, with a supported supervision and orientation period on arrival.", reqs: ["3 sonographers", "Overseas-trained welcome", "Supervision & orientation"], market: "newzealand", budget: "NZ$900K", status: 0, posted: "Wed 06:55", responders: 4 },
  { id: "nz2", fragile: true, org: "Wellington Regional Hospital", who: "Dr. James Patel", title: "Radiology Lead", init: "JP", ago: "1d", body: "Expanding our MRI service and need experienced MRI radiographers. Relocation support and registration assistance provided for international applicants.", reqs: ["MRI radiographers", "Relocation support", "Registration assistance"], market: "newzealand", budget: "NZ$620K", status: 1, posted: "Tue 09:20", responders: 5 },
];

function LiveFeedScreen({ onBook, onToast, role = "operator", market = "all", onMarket, displayName, go }) {
  const [feed, setFeed] = useState(FEED_SEED);
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState(null);
  const [saved, setSaved] = useState({});
  const [hyd, setHyd] = useState(false);
  const [userCat, setUserCat] = useState(null);
  const [showAn, setShowAn] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [draftMarket, setDraftMarket] = useState(market !== "all" ? market : "nhs");
  const [draftBudget, setDraftBudget] = useState("");
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_feed"); if (r?.value) setFeed(JSON.parse(r.value)); } catch (e) {} try { const s = await window.storage?.get("qura_feed_saved"); if (s?.value) setSaved(JSON.parse(s.value)); } catch (e) {} try { const c = await window.storage?.get("qura_catalogue"); if (c?.value) setUserCat(JSON.parse(c.value)); } catch (e) {} try { const a = await window.storage?.get("qura_feed_showan"); if (a?.value) setShowAn(JSON.parse(a.value)); } catch (e) {} try { const b = await window.storage?.get("qura_feed_filter"); if (b && b.value != null) setStatusFilter(JSON.parse(b.value)); } catch (e) {} setHyd(true); })(); }, []);
  useEffect(() => { if (hyd) try { window.storage?.set("qura_feed", JSON.stringify(feed)); } catch (e) {} }, [feed, hyd]);
  useEffect(() => { if (hyd) try { window.storage?.set("qura_feed_saved", JSON.stringify(saved)); } catch (e) {} }, [saved, hyd]);
  useEffect(() => { if (hyd) try { window.storage?.set("qura_feed_showan", JSON.stringify(showAn)); } catch (e) {} }, [showAn, hyd]);
  useEffect(() => { if (hyd) try { window.storage?.set("qura_feed_filter", JSON.stringify(statusFilter)); } catch (e) {} }, [statusFilter, hyd]);
  const _meBase = ROLE_META[role] || ROLE_META.operator;
  const me = (displayName && displayName.trim()) ? { ..._meBase, who: displayName } : _meBase;
  const isSupplier = role === "agency" || role === "operator" || role === "clinician";
  const init2 = (me.who || "Qura").slice(0, 2).toUpperCase();
  const post = () => { if (!draft.trim()) return; setFeed((f) => [{ id: "u" + Date.now(), org: me.who, who: me.who, title: me.label, init: init2, ago: "now", body: draft.trim(), reqs: [], market: draftMarket, budget: draftBudget.trim() ? CURRENCY[draftMarket].sym + draftBudget.trim() : undefined, status: 0, posted: "Just now", responders: 0, mine: true }, ...f]); setDraft(""); setDraftBudget(""); onToast?.("Requirement posted to the live feed"); };
  const setStatus = (id, idx) => setFeed((f) => f.map((p) => { if (p.id !== id) return p; const np = { ...p, status: idx }; if (idx === 4 && !p.fulfilled) { np.fulfilled = "Just now"; np.days = p.days || 2; np.winner = p.winner || "anon"; } return np; }));
  const advance = (p) => setStatus(p.id, Math.min(p.status + 1, FEED_STATUS.length - 1));
  const fulfill = (id, winnerId) => setFeed((f) => f.map((p) => p.id === id ? { ...p, status: 4, fulfilled: p.fulfilled || "Just now", days: p.days || 2, winner: "anon", winnerId: winnerId || null } : p));
  const respond = (p) => { setFeed((f) => f.map((x) => x.id === p.id ? { ...x, status: Math.max(x.status, 1), responders: x.responders + 1 } : x)); onBook?.({ type: "Intro call", with: p.who, org: p.org, when: "To schedule", status: "Pending", isNew: true }); onToast?.("Response sent · intro call requested & logged to meetings"); };
  const applyDirect = (p) => { setFeed((f) => f.map((x) => x.id === p.id ? { ...x, status: Math.max(x.status, 1), applicants: (x.applicants || 0) + 1 } : x)); onToast?.("Application sent directly to the hiring manager · no agency fee"); };
  const matchSuppliers = (p) => matchKit(p, userCat).slice(0, 3);
  const requestDemo = (s, p) => { onBook?.({ type: "Demo call", with: s.name, org: p.org, when: "To schedule", status: "Pending", isNew: true }); onToast?.("Demo requested via " + s.name + " · logged to meetings"); };
  const sel = feed.find((p) => p.id === openId);
  const scoped = market === "all" ? feed : feed.filter((p) => p.market === market);
  const liveN = scoped.filter((p) => p.status === 0).length;
  const fulfN = scoped.filter((p) => p.status === 4).length;
  const ff = scoped.filter((p) => p.status === 4 && p.days);
  const avgFill = ff.length ? (ff.reduce((a, p) => a + p.days, 0) / ff.length).toFixed(1) : null;
  const totalResp = scoped.reduce((a, p) => a + (p.responders || 0), 0);
  const statusData = FEED_STATUS.map((s, i) => ({ name: s.l, v: scoped.filter((p) => p.status === i).length, c: s.c }));
  const trend = [...MARKET_TREND, { w: "Now", d: avgFill ? Number(avgFill) : MARKET_TREND[MARKET_TREND.length - 1].d }];
  const regionData = [["NHS", "nhs", "#0E8C7E"], ["Private", "private", "#2D6BFF"], ["Australia", "australia", "#F59E0B"], ["New Zealand", "newzealand", "#8B5CF6"], ["International", "international", "#00C2B8"]].map(([name, k, c]) => ({ name, v: feed.filter((p) => p.market === k).length, c }));
  const shown = feed.filter((p) => (statusFilter == null || p.status === statusFilter) && (market === "all" || p.market === market));
  return (
    <div>
      <PageHead title="Live feed" sub="Real-time demand and supply across the Qura marketplace" right={<span className="chip chip-cyan"><span className="live" /> Live marketplace</span>} />
      <div className="card" style={{ padding: 14, marginBottom: 16, background: "linear-gradient(120deg, var(--navy), #14294d)", color: "#fff", border: "none" }}><div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div className="row" style={{ gap: 10 }}><Globe size={18} color="#5FE6DC" /><div style={{ fontSize: 13.5 }}><b>The market is mapped for you.</b> <span style={{ color: "#9FB0D0" }}>No more mapping regions by hand for hours.</span></div></div><button className="btn hsm" style={{ background: "#00C2B8", color: "#04211F", fontWeight: 700 }} onClick={() => go && go("marketmap")}>Open market map <ArrowRight size={14} /></button></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>{[["Live now", liveN, "var(--cyan)"], ["Fulfilled", fulfN, "var(--teal)"], ["Avg time to fill", avgFill ? avgFill + "d" : "—", "var(--blue)"], ["Total responses", totalResp, "var(--navy)"]].map(([l, v, c]) => (<div key={l} className="card" style={{ padding: 16 }}><div className="num disp" style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div><div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{l}</div></div>))}</div>
      <button className="btn btn-light" style={{ marginBottom: 16 }} onClick={() => setShowAn((v) => !v)}><BarChart3 size={15} /> Marketplace analytics <ChevronRight size={14} style={{ transform: showAn ? "rotate(90deg)" : "none", transition: ".15s" }} /></button>
      {showAn && (<div className="g2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, marginBottom: 16 }}>
        <div className="card" style={{ padding: 18 }}><SectionHead title="Opportunities by status" /><div style={{ height: 190 }}><Chart kind="status" data={statusData} statusFilter={statusFilter} onSelect={(i) => setStatusFilter((f) => f === i ? null : i)} height="100%" /></div></div>
        <div className="card" style={{ padding: 18 }}><SectionHead title="Time to fill trend (days)" /><div style={{ height: 190 }}><Chart kind="timeToFill" data={trend} height="100%" /></div></div>
        <div className="card" style={{ padding: 18 }}><SectionHead title="Demand by market" /><div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>{regionData.map((r) => { const total = feed.length || 1; const pct = Math.round((r.v / total) * 100); return (<div key={r.name}><div className="row" style={{ justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}><span style={{ fontWeight: 600 }}>{r.name}</span><span className="muted num">{r.v} · {pct}%</span></div><div style={{ height: 8, borderRadius: 6, background: "#EDF1F8", overflow: "hidden" }}><div style={{ height: "100%", width: pct + "%", background: r.c, borderRadius: 6 }} /></div></div>); })}</div></div>
      </div>)}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>{init2}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <textarea className="in" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Post a live requirement, an update or an announcement..." style={{ minHeight: 68, resize: "vertical", width: "100%" }} />
            <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: "wrap" }}>{[["nhs", "NHS"], ["private", "Private"], ["international", "International"]].map(([k, l]) => (<button key={k} onClick={() => setDraftMarket(k)} style={{ padding: "5px 11px", fontSize: 12, fontWeight: 600, borderRadius: 999, cursor: "pointer", border: "1px solid var(--line)", background: draftMarket === k ? "var(--teal)" : "#fff", color: draftMarket === k ? "#fff" : "var(--navy)" }}>{l}</button>))}<div className="row" style={{ gap: 4, border: "1px solid var(--line)", borderRadius: 999, padding: "0 10px", background: "#fff" }}><span className="num" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}>{CURRENCY[draftMarket].sym}</span><input value={draftBudget} onChange={(e) => setDraftBudget(e.target.value)} placeholder="Budget (optional)" style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, width: 128, padding: "6px 0", fontFamily: "inherit" }} /></div></div>
              <div className="row" style={{ justifyContent: "space-between", marginTop: 10, gap: 10, flexWrap: "wrap" }}>
              <span className="faint" style={{ fontSize: 12.5 }}>Premium suppliers are alerted the moment you post.</span>
              <button className="btn btn-primary" onClick={post}><Send size={15} /> Post to feed</button>
            </div>
          </div>
        </div>
      </div>
      <div className="row" style={{ gap: 8, fontSize: 12.5, color: "#06776F", fontWeight: 500, marginBottom: 14, padding: "10px 14px", background: "var(--cyan-soft)", borderRadius: 11 }}><Zap size={14} color="#06776F" /> First come, first served. Premium suppliers respond and clinicians apply directly, with no agency fee.</div>
      <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 14 }}>{MARKETS.map(([k, l]) => (<button key={k} onClick={() => onMarket && onMarket(k)} style={{ padding: "6px 13px", fontSize: 12.5, fontWeight: 600, borderRadius: 999, cursor: "pointer", border: "1px solid var(--line)", background: market === k ? "var(--navy)" : "#fff", color: market === k ? "#fff" : "var(--navy)" }}>{l}</button>))}</div>
      {statusFilter != null && <div className="row" style={{ gap: 8, marginBottom: 12 }}><span className="chip" style={{ background: FEED_STATUS[statusFilter].bg, color: FEED_STATUS[statusFilter].c, gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: FEED_STATUS[statusFilter].c }} /> Filtered: {FEED_STATUS[statusFilter].l}</span><button className="btn btn-light" style={{ padding: "5px 11px", fontSize: 12.5 }} onClick={() => setStatusFilter(null)}>Clear <X size={13} /></button></div>}
      {shown.length === 0 && <div className="card" style={{ padding: 30, textAlign: "center" }}><div className="muted">No posts in this status.</div></div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{shown.map((p) => { const st = FEED_STATUS[p.status]; return (
        <div key={p.id} className="card" style={{ padding: 20 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
            <div className="row" style={{ gap: 12, minWidth: 0 }}>
              <div style={{ width: 46, height: 46, borderRadius: 999, background: p.mine ? "var(--teal)" : "var(--cyan-soft)", color: p.mine ? "#fff" : "#06776F", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>{p.init}</div>
              <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 15 }}>{p.org}</div><div className="muted" style={{ fontSize: 12.5 }}>{p.who} · {p.title} · {p.ago}</div></div>
            </div>
            <div className="row" style={{ gap: 6, flexShrink: 0 }}>{p.market && <span className="chip" style={{ background: "var(--bg)", color: "var(--muted)", fontSize: 10 }}>{marketLabel[p.market]}</span>}<span className="chip" style={{ background: st.bg, color: st.c, gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: st.c }} /> {st.l}</span></div>
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: "14px 0 0" }}>{p.body}</p>
          {(p.budget || (p.reqs && p.reqs.length > 0)) && <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>{p.fragile && <span className="chip" style={{ background: "rgba(200,16,46,.10)", color: "#C8102E", fontWeight: 700 }}>Fragile profession</span>}{p.budget && <span className="chip" style={{ background: "var(--cyan-soft)", color: "#06776F", fontWeight: 700 }}>Budget {p.budget}</span>}{(p.reqs || []).map((r, i) => (<span key={i} className="chip chip-grey">{r}</span>))}</div>}
          {p.status === 4 && (<div className="card" style={{ padding: 14, marginTop: 14, background: "var(--ok-bg)", border: "none" }}><div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}><div className="row" style={{ gap: 8, color: "#0C7A47", fontWeight: 600, fontSize: 13.5 }}><Check size={15} /> Fulfilled by a verified supplier{p.winner === "anon" ? " (anonymous)" : ""}</div><div className="row num" style={{ gap: 16, fontSize: 12.5 }}><span className="muted">Posted <b style={{ color: "var(--text)" }}>{p.posted}</b></span><span className="muted">Fulfilled <b style={{ color: "var(--text)" }}>{p.fulfilled}</b></span><span className="muted">Time to fill <b style={{ color: "var(--ok)" }}>{p.days}d</b></span></div></div></div>)}
          <div className="row" style={{ justifyContent: "space-between", marginTop: 16, gap: 10, flexWrap: "wrap" }}>
            <div className="row" style={{ gap: 8 }}>
              {p.status < 4 && role === "clinician" && <button className="btn btn-primary" style={{ padding: "8px 14px" }} onClick={() => applyDirect(p)}><UserCheck size={14} /> Apply directly</button>}{p.status < 4 && role !== "clinician" && isSupplier && <button className="btn btn-primary" style={{ padding: "8px 14px" }} onClick={() => respond(p)}><Send size={14} /> Respond</button>}
              <button className="btn btn-light" style={{ padding: "8px 14px" }} onClick={() => setOpenId(p.id)}><Activity size={14} /> Track workflow</button>
              <button className="btn btn-light" style={{ padding: "8px 12px", background: saved[p.id] ? "var(--cyan-soft)" : "#fff", color: saved[p.id] ? "#06776F" : "var(--navy)" }} onClick={() => setSaved((s) => ({ ...s, [p.id]: !s[p.id] }))}><Star size={14} /> {saved[p.id] ? "Saved" : "Save"}</button>
            </div>
            <span className="row faint" style={{ gap: 14, fontSize: 12.5 }}><span className="row" style={{ gap: 6 }}><Users size={13} /> {p.responders} responded</span>{(p.applicants || 0) > 0 && <span className="row" style={{ gap: 6, color: "var(--teal)", fontWeight: 600 }}><UserCheck size={13} /> {p.applicants} applied directly</span>}</span>
          </div>
        </div>
      ); })}</div>
      {sel && (<><div onClick={() => setOpenId(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,23,51,.4)", zIndex: 60 }} /><div className="fade" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(460px, 94vw)", background: "#fff", zIndex: 61, boxShadow: "var(--sh-lg)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "radial-gradient(120% 90% at 100% 0%, #14294C 0%, var(--navy) 60%)", padding: "20px 22px", color: "#fff" }}>
          <div className="row" style={{ justifyContent: "space-between" }}><span className="chip" style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: FEED_STATUS[sel.status].c }} /> {FEED_STATUS[sel.status].l}</span><button onClick={() => setOpenId(null)} style={{ color: "#fff" }}><X size={20} /></button></div>
          <h2 className="disp" style={{ fontSize: 19, fontWeight: 700, marginTop: 14, lineHeight: 1.2 }}>{sel.org}</h2>
          <div style={{ color: "#9FB0D0", fontSize: 12.5, marginTop: 4 }}>{sel.who} · {sel.title}</div>
        </div>
        <div style={{ padding: 22, flex: 1, overflowY: "auto" }}>
          <SectionHead title="End-to-end workflow" />
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 18 }}>{FEED_STAGES.map(([t, d], i) => { const done = i < STATUS_STAGES[sel.status]; const current = i === STATUS_STAGES[sel.status]; return (<div key={i} className="row" style={{ gap: 12, alignItems: "flex-start" }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}><div style={{ width: 24, height: 24, borderRadius: 999, background: done ? "var(--ok)" : current ? "var(--blue)" : "#EDF1F8", display: "grid", placeItems: "center", flexShrink: 0 }}>{done ? <Check size={13} color="#fff" /> : <span style={{ fontSize: 11, fontWeight: 700, color: current ? "#fff" : "var(--muted)" }}>{i + 1}</span>}</div>{i < FEED_STAGES.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 14, background: done ? "var(--ok)" : "#EDF1F8" }} />}</div><div style={{ paddingBottom: 14 }}><div style={{ fontSize: 13.5, fontWeight: current ? 700 : 600, color: done || current ? "var(--text)" : "var(--muted)" }}>{t}</div><div className="muted" style={{ fontSize: 12, marginTop: 1, lineHeight: 1.45 }}>{d}</div></div></div>); })}</div>
          {sel.status < 3 && <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => advance(sel)}>Advance to {FEED_STATUS[sel.status + 1].l} <ArrowRight size={15} /></button>}
          {sel.status === 3 && (<div><div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 10 }}>Mark fulfilled. Who won this opportunity?</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{matchSuppliers(sel).map((s) => (<button key={s.id} className="btn btn-light" style={{ width: "100%", justifyContent: "space-between" }} onClick={() => fulfill(sel.id, s.id)}><span className="row" style={{ gap: 9 }}><span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{s.init}</span>{s.name}</span><Check size={15} /></button>))}<button className="btn btn-light" style={{ width: "100%", justifyContent: "center" }} onClick={() => fulfill(sel.id, null)}>Anonymous supplier</button></div><div className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>The winner stays anonymous publicly. Attribution feeds the leaderboard only.</div></div>)}
          {sel.status === 4 && (<div className="card" style={{ padding: 16, background: "var(--ok-bg)", border: "none" }}><div className="row" style={{ gap: 8, color: "#0C7A47", fontWeight: 700, fontSize: 14 }}><Check size={16} /> Opportunity fulfilled</div><div className="num" style={{ fontSize: 12.5, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}><span className="muted">Posted: <b style={{ color: "var(--text)" }}>{sel.posted}</b></span><span className="muted">Fulfilled: <b style={{ color: "var(--text)" }}>{sel.fulfilled}</b></span><span className="muted">Time to fill: <b style={{ color: "var(--ok)" }}>{sel.days} days</b></span></div></div>)}
          <div style={{ marginTop: 18 }}><SectionHead title="Matched suppliers" /><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{matchSuppliers(sel).map((s) => (<div key={s.id} className="row" style={{ justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 11, border: "1px solid var(--line)" }}><div className="row" style={{ gap: 10, minWidth: 0 }}><div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--cyan-soft)", color: "#06776F", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{s.init}</div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div><div className="muted" style={{ fontSize: 11.5 }}>{s.type}</div></div></div><div className="row" style={{ gap: 6, flexShrink: 0 }}>{s.mine ? <span className="chip chip-cyan" style={{ fontSize: 10 }}>You</span> : (<>{s.premium && <span className="chip chip-cyan" style={{ fontSize: 10 }}>Premium</span>}<button className="btn btn-light" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => requestDemo(s, sel)}><Calendar size={12} /> Demo</button></>)}</div></div>))}{matchSuppliers(sel).length === 0 && <div className="muted" style={{ fontSize: 12.5 }}>No matched suppliers yet.</div>}</div></div><div className="card" style={{ padding: 14, marginTop: 16, background: "var(--bg)", border: "none" }}><div className="row" style={{ gap: 8, fontWeight: 600, fontSize: 13 }}><ShieldCheck size={14} className="faint" /> Supplier privacy</div><div className="muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.55 }}>The winning supplier stays anonymous by default. They can choose to become visible after contract award, or publish a success story later.</div></div>
        </div>
      </div></>)}
    </div>
  );
}
function SuppliersScreen({ onBook, onToast }) {
  const [openId, setOpenId] = useState(null);
  const [sort, setSort] = useState("default");
  const [feed, setFeed] = useState(FEED_SEED);
  const request = (s) => { onBook?.({ type: "Demo call", with: s.name, org: s.name, when: "To schedule", status: "Pending", isNew: true }); onToast?.("Demo requested from " + s.name + " · logged to meetings"); setOpenId(null); };
  const [cat, setCat] = useState({ name: "My Medical Company", tag: "Your equipment and services, visible across the Qura marketplace.", kit: [{ n: "1.5T Mobile MRI", s: "Relocatable, 6-week install", lead: "4 weeks" }] });
  const [chyd, setChyd] = useState(false);
  const [cShow, setCShow] = useState(false);
  const [cEdit, setCEdit] = useState(null);
  const [cf, setCf] = useState({ n: "", s: "", lead: "" });
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_catalogue"); if (r?.value) setCat(JSON.parse(r.value)); } catch (e) {} try { const so = await window.storage?.get("qura_sup_sort"); if (so?.value) setSort(JSON.parse(so.value)); } catch (e) {} try { const fe = await window.storage?.get("qura_feed"); if (fe?.value) setFeed(JSON.parse(fe.value)); } catch (e) {} setChyd(true); })(); }, []);
  useEffect(() => { if (chyd) try { window.storage?.set("qura_catalogue", JSON.stringify(cat)); } catch (e) {} }, [cat, chyd]);
  useEffect(() => { if (chyd) try { window.storage?.set("qura_sup_sort", JSON.stringify(sort)); } catch (e) {} }, [sort, chyd]);
  const openAdd = () => { setCEdit(null); setCf({ n: "", s: "", lead: "" }); setCShow(true); };
  const openEditKit = (i) => { setCEdit(i); setCf(cat.kit[i]); setCShow(true); };
  const saveKit = () => { if (!cf.n.trim()) { setCShow(false); return; } setCat((c) => { const kit = [...c.kit]; const item = { n: cf.n.trim(), s: cf.s.trim() || "Specification to confirm", lead: cf.lead.trim() || "TBC" }; if (cEdit != null) kit[cEdit] = item; else kit.unshift(item); return { ...c, kit }; }); setCShow(false); onToast?.(cEdit != null ? "Listing updated" : "Listing added to your catalogue"); };
  const delKit = (i) => setCat((c) => ({ ...c, kit: c.kit.filter((_, j) => j !== i) }));
  const dynamicPerf = (id) => perfFrom(id, feed);
  const directory = [catSupplier(cat), ...SUPPLIERS].filter(Boolean);
  const sorted = [...directory].sort((a, b) => { if (sort === "win") return (dynamicPerf(b.id).winRate || -1) - (dynamicPerf(a.id).winRate || -1); if (sort === "fill") return (dynamicPerf(a.id).avgFill != null ? dynamicPerf(a.id).avgFill : 999) - (dynamicPerf(b.id).avgFill != null ? dynamicPerf(b.id).avgFill : 999); if (sort === "rating") return (b.rating || 0) - (a.rating || 0); return 0; });
  const sel = directory.find((s) => s.id === openId);
  const pf = sel ? dynamicPerf(sel.id) : null;
  return (
    <div>
      <PageHead title="Private clinics" sub="Private hospitals, Harley Street clinics and independent consultants" right={<span className="chip chip-cyan">{SUPPLIERS.length} verified clinics</span>} />
      <div className="card" style={{ padding: 20, marginBottom: 18, border: "1.5px solid var(--cyan)", background: "linear-gradient(120deg,var(--cyan-soft),#fff 65%)" }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div><span className="chip chip-cyan" style={{ fontSize: 10 }}>Your company</span><div className="disp" style={{ fontWeight: 700, fontSize: 18, marginTop: 8 }}>{cat.name}</div><div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{cat.tag}</div></div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add listing</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10, marginTop: 16 }}>{cat.kit.map((k, i) => (<div key={i} className="card" style={{ padding: 14, border: "1px solid var(--line)", background: "#fff" }}><div className="row" style={{ justifyContent: "space-between", gap: 8 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{k.n}</div><span className="chip chip-grey" style={{ fontSize: 10.5 }}>Lead {k.lead}</span></div><div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{k.s}</div><div className="row" style={{ gap: 6, marginTop: 10 }}><button className="btn btn-light" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => openEditKit(i)}><Pencil size={12} /> Edit</button><button className="btn btn-light" style={{ padding: "5px 10px", fontSize: 12, color: "var(--red)" }} onClick={() => delKit(i)}><Trash2 size={12} /> Delete</button></div></div>))}{cat.kit.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No listings yet. Add your first piece of equipment or service.</div>}</div>
      </div>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <SectionHead title="Marketplace suppliers" />
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{[["default", "Default"], ["win", "Win rate"], ["fill", "Fastest fill"], ["rating", "Rating"]].map(([k, l]) => (<button key={k} onClick={() => setSort(k)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, borderRadius: 9, cursor: "pointer", border: "1px solid var(--line)", background: sort === k ? "var(--blue)" : "#fff", color: sort === k ? "#fff" : "var(--navy)" }}>{l}{sort === k && k !== "default" && (k === "fill" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button>))}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>{sorted.map((s) => (
        <div key={s.id} className="card lift" style={{ padding: 20, cursor: "pointer" }} onClick={() => setOpenId(s.id)}>
          <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>{s.init}</div>
            <div className="row" style={{ gap: 6 }}>{s.mine ? <span className="chip chip-cyan" style={{ fontSize: 10 }}>Your company</span> : (<>{s.verified && <span className="chip chip-low" style={{ fontSize: 10 }}><BadgeCheck size={12} /> Verified</span>}{s.premium && <span className="chip chip-cyan" style={{ fontSize: 10 }}>Premium</span>}</>)}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, marginTop: 14 }}>{s.name}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{s.type} · {s.loc}</div>
          <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, margin: "10px 0 0" }}>{s.tag}</p>
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 12 }}>{s.cats.slice(0, 3).map((c, i) => (<span key={i} className="chip chip-grey" style={{ fontSize: 11 }}>{c}</span>))}</div>
          {(() => { const pf = dynamicPerf(s.id); return pf.isNew ? null : (<div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 12 }}>{pf.winRate != null && <span className="chip" style={{ background: "var(--ok-bg)", color: "#0C7A47", fontSize: 11 }}>{pf.winRate}% win rate</span>}{pf.avgFill != null && <span className="chip chip-grey" style={{ fontSize: 11 }}>{pf.avgFill}d avg fill</span>}{pf.freshWins > 0 && <span className="chip chip-cyan" style={{ fontSize: 11 }}>+{pf.freshWins} recent</span>}</div>); })()}<div className="row" style={{ justifyContent: "space-between", marginTop: 14, alignItems: "center" }}><span className="row num" style={{ gap: 5, fontSize: 13, fontWeight: 700 }}><Star size={13} color="#F59E0B" fill="#F59E0B" /> {s.rating != null ? s.rating : "New"}</span><span className="row faint" style={{ gap: 4, fontSize: 12.5 }}>{s.kit.length} products <ChevronRight size={14} /></span></div>
        </div>
      ))}</div>
      {sel && (<><div onClick={() => setOpenId(null)} style={{ position: "fixed", inset: 0, background: "rgba(10,23,51,.4)", zIndex: 60 }} /><div className="fade" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(460px, 94vw)", background: "#fff", zIndex: 61, boxShadow: "var(--sh-lg)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "radial-gradient(120% 90% at 100% 0%, #14294C 0%, var(--navy) 60%)", padding: 22, color: "#fff" }}>
          <div className="row" style={{ justifyContent: "space-between" }}><div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,.12)", display: "grid", placeItems: "center", fontWeight: 700 }}>{sel.init}</div><button onClick={() => setOpenId(null)} style={{ color: "#fff" }}><X size={20} /></button></div>
          <h2 className="disp" style={{ fontSize: 20, fontWeight: 700, marginTop: 14 }}>{sel.name}</h2>
          <div style={{ color: "#9FB0D0", fontSize: 12.5, marginTop: 4 }}>{sel.type} · {sel.loc}</div>
        </div>
        <div style={{ padding: 22, flex: 1, overflowY: "auto" }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>{sel.tag}</p>
          {pf && !pf.isNew && (<><SectionHead title="Performance" /><div className="row" style={{ gap: 10 }}>{[["Win rate", pf.winRate != null ? pf.winRate + "%" : "—"], ["Avg time to fill", pf.avgFill != null ? pf.avgFill + "d" : "—"], ["Won", pf.wins]].map(([l, v]) => (<div key={l} className="card" style={{ padding: 12, flex: 1, textAlign: "center", background: "var(--bg)", border: "none" }}><div className="num disp" style={{ fontSize: 18, fontWeight: 700 }}>{v}</div><div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{l}</div></div>))}</div><div style={{ height: 8, borderRadius: 6, background: "#EDF1F8", margin: "12px 0 16px", overflow: "hidden" }}><div style={{ height: "100%", width: (pf.winRate || 0) + "%", background: "linear-gradient(90deg,var(--teal),var(--cyan))", borderRadius: 6 }} /></div></>)}
          {pf && pf.isNew && (<div className="card" style={{ padding: 14, background: "var(--bg)", border: "none", marginBottom: 16 }}><div className="muted" style={{ fontSize: 12.5 }}>No performance history yet. Win rate and time to fill will appear as you close opportunities.</div></div>)}
          <SectionHead title="Equipment & services" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{sel.kit.map((k, i) => (<div key={i} className="card" style={{ padding: 14, border: "1px solid var(--line)" }}><div className="row" style={{ justifyContent: "space-between", gap: 8 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{k.n}</div><span className="chip chip-grey" style={{ fontSize: 10.5 }}>Lead {k.lead}</span></div><div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{k.s}</div></div>))}</div>
        </div>
        <div style={{ padding: 18, borderTop: "1px solid var(--line)" }}>{sel.mine ? <div className="muted" style={{ fontSize: 12.5, textAlign: "center" }}>This is your company. Edit your listings in My catalogue above.</div> : <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => request(sel)}><Calendar size={15} /> Request a demo</button>}</div>
      </div></>)}
      {cShow && (<div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(10,23,51,.55)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 20 }} className="fade" onClick={() => setCShow(false)}><div className="card" style={{ width: "100%", maxWidth: 420, padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <SectionHead title={cEdit != null ? "Edit listing" : "Add a listing"} />
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Product or service</label><input className="in" placeholder="e.g. 1.5T Mobile MRI" value={cf.n} onChange={(e) => setCf({ ...cf, n: e.target.value })} />
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "12px 0 6px" }}>Specification</label><input className="in" placeholder="e.g. Relocatable, full service" value={cf.s} onChange={(e) => setCf({ ...cf, s: e.target.value })} />
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "12px 0 6px" }}>Lead time</label><input className="in" placeholder="e.g. 4 weeks" value={cf.lead} onChange={(e) => setCf({ ...cf, lead: e.target.value })} />
        <div className="row" style={{ gap: 10, marginTop: 18, justifyContent: "flex-end" }}><button className="btn btn-light" onClick={() => setCShow(false)}>Cancel</button><button className="btn btn-primary" onClick={saveKit}><Check size={15} /> {cEdit != null ? "Save changes" : "Add listing"}</button></div>
      </div></div>)}
    </div>
  );
}
function SupplierInbox({ go, onBook, onToast, market = "all" }) {
  const [feed, setFeed] = useState(FEED_SEED);
  const [userCat, setUserCat] = useState(null);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_feed"); if (r?.value) setFeed(JSON.parse(r.value)); } catch (e) {} try { const c = await window.storage?.get("qura_catalogue"); if (c?.value) setUserCat(JSON.parse(c.value)); } catch (e) {} })(); }, []);
  const matches = feed.map((p) => ({ p, sup: matchKit(p, userCat) })).filter((m) => m.sup.length > 0 && m.p.status < 3 && (market === "all" || m.p.market === market));
  const newN = matches.filter((m) => m.p.status === 0).length;
  const respond = (p) => { onBook?.({ type: "Intro call", with: p.who, org: p.org, when: "To schedule", status: "Pending", isNew: true }); onToast?.("Response sent · intro call logged to meetings"); };
  const demo = (p, s) => { onBook?.({ type: "Demo call", with: s.name, org: p.org, when: "To schedule", status: "Pending", isNew: true }); onToast?.("Demo requested via " + s.name + " · logged to meetings"); };
  return (
    <div>
      <PageHead title="Supplier inbox" sub="Live opportunities matched to your equipment and services" right={<span className="chip chip-cyan"><Inbox size={13} /> {matches.length} matches{newN > 0 ? " · " + newN + " new" : ""}</span>} />
      {matches.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center" }}><div className="muted">No matching opportunities right now. New live requirements will appear here automatically.</div></div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{matches.map(({ p, sup }) => (
        <div key={p.id} className="card" style={{ padding: 18, borderLeft: p.status === 0 ? "3px solid var(--cyan)" : "3px solid transparent" }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
            <div className="row" style={{ gap: 12, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 999, background: "var(--cyan-soft)", color: "#06776F", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>{p.init}</div>
              <div style={{ minWidth: 0 }}><div className="row" style={{ gap: 8 }}><span style={{ fontWeight: 700, fontSize: 14.5 }}>{p.org}</span>{p.status === 0 && <span className="chip chip-cyan" style={{ fontSize: 10 }}>New</span>}{p.market && <span className="chip" style={{ background: "var(--bg)", color: "var(--muted)", fontSize: 10 }}>{marketLabel[p.market]}</span>}</div><div className="muted" style={{ fontSize: 12.5 }}>{p.who} · {p.title} · {p.ago}</div></div>
            </div>
            <button className="btn btn-light" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => go && go("feed")}>Open <ChevronRight size={14} /></button>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: "12px 0 0", color: "var(--muted)" }}>{p.body}</p>
          {(p.reqs || []).length > 0 && <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 12 }}>{p.reqs.map((r, i) => (<span key={i} className="chip chip-grey" style={{ fontSize: 11 }}>{r}</span>))}</div>}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12 }}>
            <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Your matching offerings</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{sup.map((s) => (<div key={s.id} className="row" style={{ justifyContent: "space-between", gap: 10 }}><div className="row" style={{ gap: 9, minWidth: 0 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{s.init}</div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div><div className="muted" style={{ fontSize: 11.5 }}>{s.type}</div></div></div>{s.mine ? <span className="chip chip-cyan" style={{ fontSize: 10 }}>You</span> : <button className="btn btn-light" style={{ padding: "6px 11px", fontSize: 12.5 }} onClick={() => demo(p, s)}><Calendar size={13} /> Demo</button>}</div>))}</div>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 14 }}><button className="btn btn-primary" style={{ padding: "8px 14px" }} onClick={() => respond(p)}><Send size={14} /> Respond</button></div>
        </div>
      ))}</div>
    </div>
  );
}
function Leaderboard({ go, market = "all" }) {
  const [feed, setFeed] = useState(FEED_SEED);
  const [cat, setCat] = useState(null);
  const [metric, setMetric] = useState("win");
  const [displayPrev, setDisplayPrev] = useState({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_feed"); if (r?.value) setFeed(JSON.parse(r.value)); } catch (e) {} try { const c = await window.storage?.get("qura_catalogue"); if (c?.value) setCat(JSON.parse(c.value)); } catch (e) {} try { const m = await window.storage?.get("qura_lb_metric"); if (m?.value) setMetric(JSON.parse(m.value)); } catch (e) {} try { const p = await window.storage?.get("qura_lb_prev"); if (p?.value) setDisplayPrev(JSON.parse(p.value)); } catch (e) {} setLoaded(true); })(); }, []);
  useEffect(() => { if (loaded) try { window.storage?.set("qura_lb_metric", JSON.stringify(metric)); } catch (e) {} }, [metric, loaded]);
  const scopedFeed = market === "all" ? feed : feed.filter((p) => p.market === market);
  const list = [catSupplier(cat), ...SUPPLIERS].filter(Boolean).map((s) => ({ s, pf: perfFrom(s.id, scopedFeed) })).filter((x) => !x.pf.isNew);
  list.sort((a, b) => { if (metric === "fill") return (a.pf.avgFill != null ? a.pf.avgFill : 999) - (b.pf.avgFill != null ? b.pf.avgFill : 999); if (metric === "wins") return b.pf.wins - a.pf.wins; return (b.pf.winRate != null ? b.pf.winRate : -1) - (a.pf.winRate != null ? a.pf.winRate : -1); });
  useEffect(() => { if (!loaded) return; const cur = {}; list.forEach((x, i) => { cur[x.s.id] = i; }); (async () => { try { const r = await window.storage?.get("qura_lb_prev"); const obj = r && r.value ? JSON.parse(r.value) : {}; obj[metric] = cur; window.storage?.set("qura_lb_prev", JSON.stringify(obj)); } catch (e) {} })(); }, [metric, feed, loaded]);
  return (
    <div>
      <PageHead title="Marketplace leaderboard" sub="Suppliers ranked by live marketplace performance" right={<div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{[["win", "Win rate"], ["fill", "Fastest fill"], ["wins", "Most wins"]].map(([k, l]) => (<button key={k} onClick={() => setMetric(k)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, borderRadius: 9, cursor: "pointer", border: "1px solid var(--line)", background: metric === k ? "var(--blue)" : "#fff", color: metric === k ? "#fff" : "var(--navy)" }}>{l}{metric === k && (k === "fill" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button>))}</div>} />
      <div className="card" style={{ padding: 8 }}>{list.map(({ s, pf }, i) => { const mv = displayPrev[metric] && displayPrev[metric][s.id] != null ? displayPrev[metric][s.id] - i : null; return (
        <div key={s.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: 14, borderBottom: i < list.length - 1 ? "1px solid var(--line)" : "none", background: s.mine ? "var(--cyan-soft)" : "transparent", borderRadius: 10 }}>
          <div className="row" style={{ gap: 14, minWidth: 0 }}>
            <div style={{ width: 26, textAlign: "center", fontWeight: 800, fontSize: 15, color: i === 0 ? "#B8860B" : i === 1 ? "#8A93A6" : i === 2 ? "#A9743B" : "var(--muted)" }}>{i + 1}</div><div style={{ width: 34, display: "flex", justifyContent: "center" }}>{mv == null ? <span className="chip chip-grey" style={{ fontSize: 9, padding: "2px 6px" }}>New</span> : mv > 0 ? <span className="row" style={{ color: "var(--ok)", fontWeight: 700, fontSize: 11, gap: 1 }}><ArrowUp size={11} />{mv}</span> : mv < 0 ? <span className="row" style={{ color: "var(--red)", fontWeight: 700, fontSize: 11, gap: 1 }}><ArrowDown size={11} />{-mv}</span> : <span className="faint" style={{ fontSize: 13 }}>—</span>}</div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.mine ? "var(--teal)" : "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{s.init}</div>
            <div style={{ minWidth: 0 }}><div className="row" style={{ gap: 8 }}><span style={{ fontWeight: 700, fontSize: 14.5 }}>{s.name}</span>{s.mine && <span className="chip chip-cyan" style={{ fontSize: 10 }}>You</span>}</div><div className="muted" style={{ fontSize: 12 }}>{s.type}</div></div>
          </div>
          <div className="row num" style={{ gap: 18, fontSize: 13 }}>
            <div style={{ textAlign: "right", minWidth: 42 }}><div style={{ fontWeight: 700, color: metric === "win" ? "var(--teal)" : "var(--text)" }}>{pf.winRate != null ? pf.winRate + "%" : "—"}</div><div className="muted" style={{ fontSize: 10.5 }}>win rate</div></div>
            <div style={{ textAlign: "right", minWidth: 42 }}><div style={{ fontWeight: 700, color: metric === "fill" ? "var(--teal)" : "var(--text)" }}>{pf.avgFill != null ? pf.avgFill + "d" : "—"}</div><div className="muted" style={{ fontSize: 10.5 }}>avg fill</div></div>
            <div style={{ textAlign: "right", minWidth: 34 }}><div style={{ fontWeight: 700, color: metric === "wins" ? "var(--teal)" : "var(--text)" }}>{pf.wins}</div><div className="muted" style={{ fontSize: 10.5 }}>wins</div></div>
          </div>
        </div>
      ); })}{list.length === 0 && <div className="muted" style={{ padding: 30, textAlign: "center" }}>No ranked suppliers yet.</div>}</div>
    </div>
  );
}
const Intel = () => (
  <div>
    <PageHead title="Market intelligence" sub="Real-time signals on tenders, frameworks, leadership changes and market moves" />
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{INTEL.map((it, i) => (<div key={i} className="card lift" style={{ padding: 18 }}><div className="row" style={{ gap: 10, marginBottom: 8 }}><span className="chip chip-blue">{it.tag}</span><span className="chip chip-grey">{it.market}</span><span className="faint" style={{ fontSize: 12, marginLeft: "auto" }}>{it.t}</span></div><div style={{ fontSize: 15 }}>{it.text}</div><button className="btn btn-ghost" style={{ marginTop: 12, padding: "8px 14px", fontSize: 13 }}>Create opportunity <ArrowRight size={14} /></button></div>))}</div>
  </div>
);
const Analytics = () => (
  <div>
    <PageHead title="Analytics" sub="Performance across markets, specialties and stages" />
    <IllustrativeBanner />
    <div className="grid-stats" style={{ marginBottom: 18 }}><Stat label="Win rate" value="34%" delta="5pt vs 30d" icon={Award} accent="cyan" /><Stat label="Avg deal size" value="£412K" delta="8% vs 30d" icon={TrendingUp} /><Stat label="Sales cycle" value="38 days" icon={Clock} /><Stat label="Active markets" value="5" icon={Globe} accent="cyan" /></div>
    <div className="grid-2">
      <div className="card" style={{ padding: 20 }}><SectionHead title="Pipeline by region (£M)" action={<DemoTag />} /><Chart kind="region" data={REGION_DATA} height={240} /></div>
      <div className="card" style={{ padding: 20 }}><SectionHead title="Opportunities by specialty" action={<DemoTag />} /><Chart kind="specialty" data={SPEC_DATA} height={240} /><div className="row" style={{ flexWrap: "wrap", gap: 10, justifyContent: "center" }}>{SPEC_DATA.map((s, i) => <span key={i} className="row" style={{ fontSize: 12.5, gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: s.c }} />{s.name} {s.value}%</span>)}</div></div>
    </div>
  </div>
);

const EXECS = [
  { name: "Dr. Margaret Ellison", title: "Chief Medical Officer", sector: "Former NHS acute trust", avail: "Available now", match: 96, note: "Seeking international CMO or board advisory roles." },
  { name: "David Osei", title: "Chief People Officer", sector: "Workforce & HR transformation", avail: "1 month", match: 92, note: "Large-scale workforce redesign and TUPE experience." },
  { name: "Fiona Grant", title: "Chief Operating Officer", sector: "Acute & community", avail: "Available now", match: 90, note: "Turnaround and elective recovery specialist." },
  { name: "Dr. Rahul Mehta", title: "Chief Medical Officer", sector: "Digital health & MedTech", avail: "Available now", match: 94, note: "Ex-clinician now leading clinical safety in health tech." },
  { name: "Susan Okafor", title: "Chief Nursing Officer", sector: "Former NHS trust", avail: "2 weeks", match: 89, note: "Open to UK, Gulf and international provider roles." },
  { name: "James Whitfield", title: "Director of Strategy", sector: "ICS & commissioning", avail: "1 month", match: 87, note: "Post-transition, seeking provider or investor-side strategy roles." },
];

function ExecNetwork({ onToast }) {
  const [saved, setSaved] = useState([]);
  const save = async (c) => {
    const entry = { id: "ex_" + c.name.replace(/[^A-Za-z0-9]+/g, ""), name: c.name, role: c.title, loc: c.sector, band: "Executive", rate: "", status: "Saved", note: c.note || "" };
    try { let list = []; try { const r = await window.storage?.get("qura_shortlist"); if (r?.value) list = JSON.parse(r.value); } catch (e) {} if (!Array.isArray(list)) list = []; if (!list.some((x) => x.name === c.name)) { list = [entry, ...list]; await window.storage?.set("qura_shortlist", JSON.stringify(list)); } } catch (e) {}
    setSaved((v) => v.includes(c.name) ? v : [...v, c.name]);
    if (onToast) onToast(c.name + " saved to shortlist");
  };
  return (
    <div>
      <PageHead title="Executive network" sub="Senior non-clinical leaders and ex-clinicians in corporate roles, many from the NHS transition, open to roles worldwide" right={<span className="chip chip-cyan"><Sparkles size={12} /> C-suite & senior leaders</span>} />
      <div className="card" style={{ padding: 16, marginBottom: 18, background: "var(--cyan-soft)", border: "none" }}><div className="row" style={{ gap: 10, alignItems: "flex-start" }}><Briefcase size={18} color="#06776F" style={{ flexShrink: 0, marginTop: 2 }} /><div style={{ fontSize: 13.5, lineHeight: 1.55 }}>With the NHS moving to direct government running, thousands of senior roles have been affected. Qura surfaces available chief medical, nursing, people, operating and strategy officers, and ex-clinicians who have moved into corporate leadership, for providers and investors hiring worldwide.</div></div></div>
      <div className="grid-3">{EXECS.map((c, i) => { const on = saved.includes(c.name); return (
        <div key={i} className="card lift" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between" }}><div style={{ width: 46, height: 46, borderRadius: 999, background: "#EEF3FF", color: "#1E54E6", display: "grid", placeItems: "center", fontWeight: 700 }} className="disp">{c.name.split(" ").slice(-2).map((x) => x[0]).join("")}</div><span className="chip chip-cyan"><Sparkles size={11} /> {c.match}%</span></div>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 12 }}>{c.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{c.title}</div>
          <div className="faint row" style={{ fontSize: 12, gap: 5, marginTop: 8 }}><BadgeCheck size={12} /> {c.sector}</div>
          {c.note ? <p className="muted" style={{ fontSize: 12.5, margin: "10px 0 0", lineHeight: 1.5 }}>{c.note}</p> : null}
          <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}><span className="chip chip-low">{c.avail}</span></div>
          <button onClick={() => save(c)} disabled={on} className={"btn " + (on ? "btn-light" : "btn-ghost")} style={{ width: "100%", justifyContent: "center", marginTop: 12, padding: "9px" }}>{on ? <><Check size={14} /> Saved to shortlist</> : <><UserCheck size={14} /> Shortlist</>}</button>
        </div>
      ); })}</div>
    </div>
  );
}

function ClinicianNetwork({ onToast, isOwner }) {
  const [saved, setSaved] = useState([]);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("All");
  const [sector, setSector] = useState("All");
  const [minExp, setMinExp] = useState(0);
  const [priority, setPriority] = useState(false);
  const save = async (c) => {
    const entry = { id: "cn_" + c.name.replace(/[^A-Za-z0-9]+/g, ""), name: c.name, role: c.spec, loc: c.loc, band: "", rate: c.rate, status: "Saved", note: "Last placed: " + c.last };
    try {
      let list = [];
      try { const r = await window.storage?.get("qura_shortlist"); if (r?.value) list = JSON.parse(r.value); } catch (e) {}
      if (!Array.isArray(list)) list = [];
      if (!list.some((x) => x.name === c.name)) { list = [entry, ...list]; await window.storage?.set("qura_shortlist", JSON.stringify(list)); }
    } catch (e) {}
    setSaved((v) => v.includes(c.name) ? v : [...v, c.name]);
    if (onToast) onToast(c.name + " saved to shortlist");
  };
  const countries = ["All", ...Array.from(new Set(CLINICIANS.map((c) => c.country)))];
  const list = CLINICIANS.filter((c) => (country === "All" || c.country === country) && (sector === "All" || c.sector === sector || c.sector === "Both") && (c.yrs >= minExp) && ((c.name + c.spec + c.country).toLowerCase().includes(q.toLowerCase())) && (!priority || PRIORITY.includes(c.country)));
  const lab = { fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)", marginBottom: 6 };
  return (
  <div>
    <PageHead title="Clinician network" sub="Registered, hospital-rated clinicians. Registration is checked against the official register before an introduction is made." right={<span className="chip chip-cyan"><ShieldCheck size={12} /> Registered on Qura</span>} />
    <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--cyan-soft)", border: "none" }}><div className="row" style={{ gap: 10, alignItems: "flex-start" }}><Globe size={18} color="#06776F" style={{ flexShrink: 0, marginTop: 2 }} /><div style={{ fontSize: 12.5, lineHeight: 1.55 }}>Qura facilitates international recruitment in line with the WHO and UK Code of Practice protected-countries list. Clinicians from listed countries are welcome to join and apply directly, of their own accord. We do not actively advertise to or target recruitment from those countries, and availability is shown by country of residence in line with each destination's own recruitment policy.</div></div></div>
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <div className="row" style={{ gap: 8, border: "1px solid var(--line)", borderRadius: 999, padding: "0 14px", background: "var(--bg2)", marginBottom: 12 }}><Search size={16} className="faint" /><input className="in" style={{ border: "none", boxShadow: "none", padding: "10px 0" }} placeholder="Search name, specialty or country" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div style={lab}>Country</div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>{countries.map((m) => (<button key={m} onClick={() => setCountry(m)} className="chip" style={{ padding: "7px 13px", cursor: "pointer", background: country === m ? "var(--blue)" : "#EEF1F7", color: country === m ? "#fff" : "#5A6783" }}>{m}</button>))}</div>
      <div className="row" style={{ gap: 22, flexWrap: "wrap" }}>
        <div><div style={lab}>Sector (UK)</div><div className="row" style={{ gap: 8 }}>{["All", "NHS", "Private"].map((m) => (<button key={m} onClick={() => setSector(m)} className="chip" style={{ cursor: "pointer", background: sector === m ? "var(--navy)" : "#EEF1F7", color: sector === m ? "#fff" : "#5A6783" }}>{m}</button>))}</div></div>
        <div><div style={lab}>Min. experience</div><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{[["All", 0], ["1+ yrs", 1], ["2+ yrs", 2], ["5+ yrs", 5], ["10+ yrs", 10]].map(([l, v]) => (<button key={l} onClick={() => setMinExp(v)} className="chip" style={{ cursor: "pointer", background: minExp === v ? "var(--teal)" : "#EEF1F7", color: minExp === v ? "#fff" : "#5A6783" }}>{l}</button>))}</div></div>
      </div>
    </div>
    {isOwner ? <div className="card" style={{ padding: "10px 14px", marginBottom: 12, background: "var(--navy)", color: "#fff", border: "none" }}><label className="row" style={{ gap: 10, cursor: "pointer", fontSize: 12.5, lineHeight: 1.4 }}><input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} style={{ marginTop: 2 }} /><span><b>Internal filter:</b> NHS priority source countries (New Zealand, Australia, Canada, South Africa, Philippines, India). Owner-only and never shown publicly.</span></label></div> : null}
    <div className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>{list.length} clinicians · minimum 1 year experience to join, and 2 years for international candidates applying to the UK</div>
    <div className="grid-3">{list.map((c, i) => { const on = saved.includes(c.name); return (
      <div key={i} className="card lift" style={{ padding: 18 }}>
        <div className="row" style={{ justifyContent: "space-between" }}><div style={{ width: 46, height: 46, borderRadius: 999, background: "#EEF3FF", color: "#1E54E6", display: "grid", placeItems: "center", fontWeight: 700 }} className="disp">{c.name.split(" ").slice(-2).map((x) => x[0]).join("")}</div><span className="chip chip-cyan"><Sparkles size={11} /> {c.match}%</span></div>
        <div style={{ fontWeight: 600, fontSize: 15, marginTop: 12 }}>{c.name}</div>
        <div className="muted" style={{ fontSize: 13 }}>{c.spec}</div>
        <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}><span className="chip chip-grey" style={{ fontSize: 11.5 }}>{c.flag} {c.country}</span><span className="chip chip-grey" style={{ fontSize: 11.5 }}>{c.exp}</span><span className={"chip " + (c.sector === "NHS" ? "chip-blue" : c.sector === "Private" ? "chip-violet" : "chip-low")} style={{ fontSize: 11.5 }}>{c.sector === "Both" ? "NHS & Private" : c.sector}</span></div>
        {c.direct ? <div className="row" style={{ gap: 6, marginTop: 8, fontSize: 11.5, color: "#9A5E00", background: "var(--amber-bg)", padding: "5px 9px", borderRadius: 8, lineHeight: 1.4 }}><ShieldCheck size={12} style={{ flexShrink: 0, marginTop: 1 }} /> Direct application only (protected-countries list)</div> : null}
        <div className="row" style={{ gap: 7, marginTop: 9, alignItems: "center" }}><Stars n={c.rating} /><span style={{ fontWeight: 700, fontSize: 13 }}>{c.rating.toFixed(1)}</span><span className="faint" style={{ fontSize: 11.5 }}>· {c.reviews} reviews</span></div>
        <div className="faint row" style={{ fontSize: 12, gap: 5, marginTop: 9 }}><BadgeCheck size={12} /> Last placed: {c.last}</div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{c.rate}</span><span className="chip chip-low">{c.avail}</span></div>
        <button onClick={() => save(c)} disabled={on} className={"btn " + (on ? "btn-light" : "btn-ghost")} style={{ width: "100%", justifyContent: "center", marginTop: 12, padding: "9px" }}>{on ? <><Check size={14} /> Saved to shortlist</> : <><UserCheck size={14} /> Shortlist</>}</button>
      </div>
    ); })}{!list.length ? <div className="card" style={{ padding: 40, textAlign: "center", gridColumn: "1/-1" }}><div className="muted">No clinicians match these filters.</div></div> : null}</div>
  </div>
  );
}
const FindAgencies = () => {
  const [f, setF] = useState("All");
  const list = AGENCIES.filter((a) => f === "All" || (f === "Framework" && a.framework) || (f === "Non-framework" && !a.framework) || (f === "CQC" && a.cqc) || (f === "Non-CQC" && !a.cqc));
  return (
    <div>
      <PageHead title="Find agencies" sub="Framework and non-framework, CQC and non-CQC, all clearly flagged" right={<button className="btn btn-primary"><Plus size={16} /> Post requirement</button>} />
      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}>{["All", "Framework", "Non-framework", "CQC", "Non-CQC"].map((m) => (<button key={m} onClick={() => setF(m)} className="chip" style={{ padding: "7px 14px", background: f === m ? "var(--blue)" : "#EEF1F7", color: f === m ? "#fff" : "#5A6783" }}>{m}</button>))}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{list.map((a, i) => (
        <div key={i} className="card lift" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div className="row" style={{ gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }} className="disp">{a.name[0]}</div>
              <div>
                <div className="row" style={{ gap: 9, flexWrap: "wrap" }}><span style={{ fontWeight: 600, fontSize: 15.5 }}>{a.name}</span><span className="chip chip-cyan">{a.match}% match</span></div>
                <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{a.spec} · {a.loc}</div>
                <div className="row" style={{ gap: 7, marginTop: 7, flexWrap: "wrap" }}><span className={"chip " + (a.framework ? "chip-low" : "chip-grey")}><BadgeCheck size={12} /> {a.framework ? "Framework" : "Non-framework"}</span><span className={"chip " + (a.cqc ? "chip-blue" : "chip-grey")}><ShieldCheck size={12} /> {a.cqc ? "CQC registered" : "Non-CQC"}</span></div>
              </div>
            </div>
            <div className="row" style={{ gap: 14 }}><span className="row" style={{ fontSize: 14, fontWeight: 600, gap: 4 }}><Star size={15} color="#F2A33C" fill="#F2A33C" />{a.rating}</span><button className="btn btn-primary">Connect</button></div>
          </div>
        </div>
      ))}</div>
    </div>
  );
};
const HospitalDash = ({ go }) => (
  <div>
    <PageHead title="Welcome back" sub="Find the right partner, faster. Spend more time on patient care." right={<button className="btn btn-primary" onClick={() => go("findAgencies")}><Search size={16} /> Find agencies</button>} />
    <div className="grid-stats" style={{ marginBottom: 18 }}><Stat label="Open requirements" value="6" icon={FileText} /><Stat label="Matched agencies" value="23" icon={Briefcase} accent="cyan" /><Stat label="Shortlisted clinicians" value="11" icon={Stethoscope} /><Stat label="Avg time to fill" value="9 days" delta="3d faster" icon={Clock} accent="cyan" /></div>
    <div className="card" style={{ padding: 20 }}><SectionHead title="Top matched agencies" action={<button className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => go("findAgencies")}>View all</button>} />{AGENCIES.slice(0, 3).map((a, i) => (<div key={i} className="row" style={{ justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}><div className="row" style={{ gap: 12 }}><div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }} className="disp">{a.name[0]}</div><div><div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div><div className="muted" style={{ fontSize: 12.5 }}>{a.spec}</div></div></div><span className="chip chip-cyan">{a.match}% match</span></div>))}</div>
  </div>
);
const ClinicianProfile = () => (
  <div>
    <PageHead title="My profile" sub="Showcase your experience, specialties and availability" />
    <div className="grid-2" style={{ alignItems: "start" }}>
      <div className="card" style={{ padding: 24, textAlign: "center" }}><div style={{ width: 84, height: 84, borderRadius: 999, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto", fontSize: 28, fontWeight: 700 }} className="disp">SA</div><h2 style={{ fontSize: 20, fontWeight: 700, margin: "14px 0 2px" }}>Dr. Sarah Ahmed</h2><div className="muted">Consultant Radiologist</div><div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 12 }}><span className="chip chip-low">Available 14 Jul</span><span className="chip chip-blue">12 yrs exp</span></div><div className="card" style={{ padding: 14, marginTop: 18, background: "var(--cyan-soft)", border: "none" }}><div className="disp row" style={{ justifyContent: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#06776F", letterSpacing: ".05em" }}><Sparkles size={13} /> PROFILE STRENGTH 92%</div></div></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><div className="card" style={{ padding: 20 }}><SectionHead title="Specialties" /><div className="row" style={{ flexWrap: "wrap", gap: 8 }}>{["Radiology", "MRI", "CT", "Ultrasound", "Interventional"].map((s) => <span key={s} className="chip chip-grey" style={{ padding: "6px 13px" }}>{s}</span>)}</div></div><div className="card" style={{ padding: 20 }}><SectionHead title="Shortlisted by hospitals" />{["King's College Hospital · Consultant Radiologist", "University College London · MRI Consultant"].map((x, i) => (<div key={i} className="row" style={{ gap: 10, padding: "10px 0", borderBottom: i < 1 ? "1px solid var(--line)" : "none" }}><UserCheck size={16} color="var(--ok)" /><span style={{ fontSize: 14 }}>{x}</span></div>))}</div></div>
    </div>
  </div>
);
const MyOpportunities = () => (
  <div>
    <PageHead title="Opportunities for me" sub="Roles matched to your specialty, location and availability" />
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{OPPS.filter((o) => ["NHS UK", "Private UK"].includes(o.market)).map((o, i) => (<div key={i} className="card row lift" style={{ padding: 18, justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><div className="row" style={{ gap: 9 }}><span style={{ fontWeight: 600, fontSize: 15 }}>{o.role}</span><span className="chip chip-cyan"><Sparkles size={11} /> {o.score}% fit</span></div><div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{o.org} · {o.loc}</div></div><div className="row" style={{ gap: 12 }}><span className="chip chip-low">{o.close} left</span><button className="btn btn-primary">Express interest</button></div></div>))}</div>
  </div>
);
const NetworkScreen = () => (
  <div>
    <PageHead title="Network" sub="Connect, share and grow with healthcare professionals" />
    <div className="grid-3">{CLINICIANS.slice(0, 6).map((c, i) => (<div key={i} className="card lift" style={{ padding: 18, textAlign: "center" }}><div style={{ width: 56, height: 56, borderRadius: 999, background: "#EEF3FF", color: "#1E54E6", display: "grid", placeItems: "center", margin: "0 auto", fontWeight: 700 }} className="disp">{c.name.split(" ").slice(-2).map((x) => x[0]).join("")}</div><div style={{ fontWeight: 600, fontSize: 14.5, marginTop: 10 }}>{c.name}</div><div className="muted" style={{ fontSize: 12.5 }}>{c.spec}</div><button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 12, padding: "8px" }}><Plus size={14} /> Connect</button></div>))}</div>
  </div>
);
const Pricing = ({ plan, onChoose, highlight, role = "agency", market = "all", isOwner }) => {
  const [annual, setAnnual] = useState(true);
  const baseGroup = role === "agency" ? "agency" : role === "clinician" ? "clinician" : "buyer";
  const [preview, setPreview] = useState(null);
  const group = preview || baseGroup;
  const cur = CURRENCY[market] || CURRENCY.all;
  const fmt = (n) => cur.sym + Math.round(n * cur.rate).toLocaleString();
  const roleBlurb = { hospital: { team: "For a single site posting vacancies and searching for candidates.", intel: "For trusts that want live ICB and council intelligence.", net: "For multi-site provider groups and whole systems." }, gp: { team: "For a practice filling sessions and finding available GPs.", intel: "For PCNs and federations that want primary-care intelligence.", net: "For large federations and super-partnerships." }, care: { team: "For a care home or provider posting roles, compliance built in.", intel: "For groups that want council, SEND and CQC intelligence.", net: "For national care and complex-care operators." } };
  const bb = roleBlurb[(!preview && roleBlurb[role]) ? role : "hospital"];
  const SETS = {
    agency: [
      { key: "trial", name: "7-day free trial", free: true, blurb: "Full access for 7 days. No card required. Sign up when you are ready.", cta: "Start free trial", feats: ["Everything in Growth", "All markets & the live feed", "Then choose a plan"] },
      { key: "starter", name: "Starter", mo: 450, yr: 375, blurb: "For small agencies winning their first NHS and private work.", cta: "Choose Starter", feats: ["3 user seats", "UK opportunities, NHS & private", "Pipeline & CRM", "Email support"] },
      { key: "growth", name: "Growth", mo: 1200, yr: 999, tag: "Most popular", blurb: "For growing teams selling across every market.", cta: "Choose Growth", feats: ["10 user seats", "All markets, including international", "Outreach automation", "Priority support"] },
      { key: "enterprise", name: "Enterprise", custom: true, dark: true, blurb: "For multi-team providers and national operators.", cta: "Contact sales", feats: ["Unlimited seats", "SSO, SCIM & audit logs", "API access & integrations", "Dedicated success lead"] },
    ],
    buyer: [
      { key: "trial", name: "7-day pilot", free: true, blurb: "Full access for 7 days. No card required.", cta: "Start pilot", feats: ["Everything in Intelligence", "Post vacancies & browse candidates", "Then choose a plan"] },
      { key: "starter", name: "Team", mo: 350, yr: 290, blurb: bb.team, cta: "Choose Team", feats: ["5 user seats", "Post vacancies & live feed", "Candidate search & shortlists", "Email support"] },
      { key: "growth", name: "Intelligence", mo: 900, yr: 750, tag: "Most popular", blurb: bb.intel, cta: "Choose Intelligence", feats: ["15 user seats", "ICB & council intelligence", "Analytics & insights", "Priority support"] },
      { key: "enterprise", name: "Network", custom: true, dark: true, blurb: bb.net, cta: "Contact sales", feats: ["Unlimited seats & sites", "SSO, SCIM & audit logs", "API & integrations", "Dedicated success lead"] },
    ],
    clinician: [
      { key: "starter", name: "Free", free: true, freeForever: true, blurb: "Always free to join, search and apply for work.", cta: "Join free", feats: ["Unlimited job search & alerts", "Apply and message directly", "Registered profile & documents"] },
      { key: "growth", name: "Career+", mo: 15, yr: 12, tag: "Most popular", blurb: "Premium career tools for ambitious clinicians.", cta: "Go Career+", feats: ["Salary & tariff insights", "Priority visibility to hospitals", "CPD & career planning tools"] },
      { key: null, addon: true, name: "Relocation concierge", blurb: "Pay-as-you-go support to move country: visas, registration, accommodation and more.", cta: "Available as an add-on", feats: ["Visas & registration (GMC, AHPRA)", "Accommodation & travel", "Onboarding & family support"] },
    ],
  };
  const tiers = SETS[group];
  const groupLabel = group === "agency" ? "agencies" : group === "clinician" ? "clinicians" : "hospitals, GP practices and care providers";
  return (
    <div>
      <PageHead title="Pricing" sub="Start free, then choose the plan that fits your growth." right={<div className="row" style={{ gap: 4, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 999, padding: 4 }}>{[["Monthly", false], ["Annual", true]].map(([l, v]) => (<button key={l} onClick={() => setAnnual(v)} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 999, cursor: "pointer", transition: ".15s", background: annual === v ? "var(--blue)" : "#fff", color: annual === v ? "#fff" : "var(--navy)", boxShadow: annual === v ? "0 1px 3px rgba(45,107,255,.35)" : "var(--sh-xs)" }}>{l}</button>))}</div>} />
      {isOwner && <div className="row" style={{ gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}><span className="faint" style={{ fontSize: 12.5 }}>Preview pricing as:</span>{[["agency", "Agency"], ["buyer", "Hospital / GP / Care"], ["clinician", "Clinician"]].map(([k, l]) => (<button key={k} onClick={() => setPreview(k)} style={{ cursor: "pointer", padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: group === k ? "var(--navy)" : "#fff", color: group === k ? "#fff" : "var(--navy)", border: "1px solid var(--line)" }}>{l}</button>))}</div>}
      {!isOwner && <div className="faint" style={{ fontSize: 12.5, marginBottom: 14 }}>Pricing shown for {groupLabel}.</div>}
      {plan === "trial" && <div className="chip chip-cyan" style={{ marginBottom: 16 }}><Sparkles size={12} /> You are on a free trial</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(238px,1fr))", gap: 16, alignItems: "stretch" }}>{tiers.map((t) => { const isCur = plan && t.key && t.key === plan; const acc = PLAN_ACCESS[t.key] || []; return (
        <div key={t.name} className="card" style={{ padding: 26, display: "flex", flexDirection: "column", border: highlight === t.key ? "2px solid var(--cyan)" : t.free ? "2px solid var(--teal)" : t.tag ? "2px solid var(--blue)" : "1px solid var(--line)", position: "relative", background: t.free ? "linear-gradient(160deg,var(--cyan-soft),#fff 70%)" : "#fff", boxShadow: highlight === t.key ? "0 0 0 4px rgba(0,194,184,.16)" : "var(--sh-sm)" }}>
          {highlight === t.key && <span className="chip chip-cyan" style={{ position: "absolute", top: -11, right: 26 }}>For you</span>}
          {t.tag && <span className="chip chip-blue" style={{ position: "absolute", top: -11, left: 26 }}>{t.tag}</span>}
          {t.free && <span className="chip chip-cyan" style={{ position: "absolute", top: -11, left: 26 }}>{t.freeForever ? "Free" : "Recommended"}</span>}
          {t.addon && <span className="chip chip-low" style={{ position: "absolute", top: -11, left: 26 }}>Add-on</span>}
          <div className="disp" style={{ fontWeight: 700, fontSize: 18 }}>{t.name}</div>
          <p className="muted" style={{ fontSize: 13, margin: "6px 0 0", minHeight: 38, lineHeight: 1.45 }}>{t.blurb}</p>
          <div className="row" style={{ gap: 6, margin: "14px 0 2px", alignItems: "baseline" }}>{t.free ? <span className="disp" style={{ fontSize: 34, fontWeight: 700, color: "var(--teal)" }}>Free</span> : t.custom ? <span className="disp" style={{ fontSize: 32, fontWeight: 700 }}>Custom</span> : t.addon ? <span className="disp" style={{ fontSize: 26, fontWeight: 700 }}>Pay as you go</span> : <><span className="disp num" style={{ fontSize: 34, fontWeight: 700 }}>{fmt(annual ? t.yr : t.mo)}</span><span className="muted" style={{ fontSize: 13 }}>/mo</span>{annual && <span className="chip chip-low" style={{ fontSize: 10.5, marginLeft: 4 }}>save {Math.round((1 - t.yr / t.mo) * 100)}%</span>}</>}</div>
          <div className="faint" style={{ fontSize: 12, minHeight: 18 }}>{t.free ? (t.freeForever ? "Free forever, no card needed" : "7 days free, no card needed") : t.custom ? "Tailored to your organisation" : t.addon ? "Only pay for the services you use" : annual ? ("billed annually at " + fmt(t.yr * 12) + " / yr") : ("or " + fmt(t.yr) + " / mo billed annually")}</div>
          <div style={{ height: 1, background: "var(--line)", margin: "18px 0" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>{t.feats.map((f, j) => (<div key={j} className="row" style={{ gap: 9, fontSize: 13.5, alignItems: "flex-start" }}><Check size={15} color={t.tag ? "var(--blue)" : "var(--cyan)"} style={{ flexShrink: 0, marginTop: 2 }} />{f}</div>))}
            {!t.addon && <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12 }}><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Premium features</div>{PREMIUM_FEATURES.map(([pk, pl]) => { const on = acc.includes(pk); return (<div key={pk} className="row" style={{ gap: 9, fontSize: 13, marginBottom: 6, color: on ? "var(--text)" : "var(--muted)" }}>{on ? <Check size={15} color="#0E8C7E" style={{ flexShrink: 0 }} /> : <span style={{ width: 15, height: 15, borderRadius: 999, border: "1.5px solid var(--line)", flexShrink: 0 }} />}{pl}</div>); })}</div>}
          </div>
          <button className={"btn " + (isCur ? "btn-light" : t.addon ? "btn-light" : t.free ? "btn-primary" : t.tag ? "btn-blue" : t.dark ? "btn-dark" : "btn-light")} style={{ justifyContent: "center", marginTop: 20 }} disabled={isCur || t.addon} onClick={() => { if (isCur || !t.key) return; const paid = !t.free && !t.custom && !t.addon; if (paid && billingEnabled) { startCheckout(group + ":" + t.key, annual); } else if (onChoose) { onChoose(t.key, annual); } }}>{isCur ? "Current plan" : t.cta}</button>
        </div>
      ); })}</div>
      <div className="muted" style={{ fontSize: 12.5, marginTop: 16, lineHeight: 1.5 }}>Prices shown in {cur.code} and exclude VAT. The free option needs no card. Annual plans are billed up front and save roughly two months versus paying monthly. Relocation services are charged as pay-as-you-go add-ons.</div>
    </div>
  );
};

// The founder workbench: the introduction queue with the register check, and
// the directory removal log. Lives beside the user list so running Qura stops
// meaning living in an email inbox.
function AdminOps() {
  const [tab, setTab] = useState("intros");
  const [queue, setQueue] = useState(null);
  const [removals, setRemovals] = useState(null);
  const [busy, setBusy] = useState("");
  const [rmName, setRmName] = useState("");
  const [rmReason, setRmReason] = useState("");
  const [msg, setMsg] = useState("");
  const token = async () => { try { const { data } = await supabase.auth.getSession(); return data?.session?.access_token; } catch (e) { return ""; } };

  const load = async () => {
    try {
      const t = await token();
      const h = { authorization: "Bearer " + t };
      const [qi, qr] = await Promise.all([
        fetch("/api/admin?view=intros", { headers: h }).then((r) => r.json()),
        fetch("/api/admin?view=removals", { headers: h }).then((r) => r.json()),
      ]);
      setQueue(qi.queue || []);
      setRemovals(qr.removals || []);
    } catch (e) { setQueue([]); setRemovals([]); }
  };
  useEffect(() => { load(); }, []);

  const act = async (introId, status) => {
    setBusy(introId + status);
    try {
      const t = await token();
      await fetch("/api/admin", { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json" },
        body: JSON.stringify({ action: "intro-update", introId, status }) });
      await load();
    } catch (e) {}
    setBusy("");
  };

  const removeContact = async () => {
    if (!rmName.trim()) return;
    setBusy("rm");
    try {
      const t = await token();
      const r = await fetch("/api/admin", { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json" },
        body: JSON.stringify({ action: "contact-remove", name: rmName.trim(), reason: rmReason.trim() || "founder removal" }) });
      const j = await r.json();
      setMsg(r.ok ? "Removed and logged. They will not return on a future import." : (j.error || "Could not remove."));
      setRmName(""); setRmReason("");
      await load();
    } catch (e) { setMsg("Could not remove."); }
    setBusy("");
  };

  const norm = (v) => String(v || "pending").toLowerCase() === "requested" ? "pending" : String(v || "pending").toLowerCase();
  const STATUS_NEXT = { pending: ["verified", "declined"], verified: ["completed"], completed: [], declined: [] };
  const chipTone = { pending: "#9A5E00", verified: "#06776F", completed: "#1E5EDB", declined: "#B4433A" };

  return (
    <div style={{ marginBottom: 28 }}>
      <div className="row" style={{ gap: 8, marginBottom: 14 }}>
        {[["intros", "Introduction queue"], ["removals", "Directory removals"]].map(([k, l]) => (
          <button key={k} className={"btn " + (tab === k ? "btn-primary" : "btn-light")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "intros" ? (
        <div className="card" style={{ padding: 18 }}>
          <SectionHead title="Introductions" action={<span className="faint" style={{ fontSize: 12 }}>{queue ? queue.length + " total" : "Loading"}</span>} />
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.55 }}>
            Verify means the registration number has been checked against the official public register. Only then complete the introduction.
          </div>
          {!queue ? <div className="faint">Loading...</div> : queue.length === 0 ? (
            <div className="faint" style={{ fontSize: 13 }}>Nothing waiting. New requests appear here the moment a supplier asks.</div>
          ) : queue.map((q) => (
            <div key={q.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{q.clinicianLabel || q.handle || q.clinicianId} <span className="faint">for</span> {q.supplierEmail}</div>
                  <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{q.at ? new Date(q.at).toLocaleString("en-GB") : ""}{q.updatedBy ? " · last action " + q.updatedBy : ""}</div>
                </div>
                <div className="row" style={{ gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: chipTone[norm(q.status)], border: "1px solid " + chipTone[norm(q.status)], borderRadius: 999, padding: "3px 10px" }}>{norm(q.status).toUpperCase()}</span>
                  {(STATUS_NEXT[norm(q.status)] || []).map((next) => (
                    <button key={next} className="btn btn-light" style={{ fontSize: 12 }} disabled={busy === q.id + next} onClick={() => act(q.id, next)}>
                      {busy === q.id + next ? "..." : next === "verified" ? "Mark verified" : next === "completed" ? "Complete" : "Decline"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 18 }}>
          <SectionHead title="Remove someone from the directory" />
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.55 }}>
            Removals are logged and permanent: a removed person does not come back when the register is next updated. Use the name exactly as it appears in the directory.
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <input className="in" style={{ flex: 2, minWidth: 200 }} placeholder="Full name" value={rmName} onChange={(e) => setRmName(e.target.value)} />
            <input className="in" style={{ flex: 3, minWidth: 220 }} placeholder="Reason (asked to be removed, left role, duplicate...)" value={rmReason} onChange={(e) => setRmReason(e.target.value)} />
            <button className="btn btn-primary" disabled={busy === "rm" || !rmName.trim()} onClick={removeContact}>{busy === "rm" ? "Removing..." : "Remove"}</button>
          </div>
          {msg ? <div style={{ fontSize: 12.5, marginTop: 10, color: "#06776F" }}>{msg}</div> : null}
          <div style={{ marginTop: 18 }}>
            <SectionHead title="Removal log" action={<span className="faint" style={{ fontSize: 12 }}>{removals ? removals.length + " removed" : ""}</span>} />
            {!removals ? <div className="faint">Loading...</div> : removals.length === 0 ? (
              <div className="faint" style={{ fontSize: 13 }}>No removals yet.</div>
            ) : removals.map((r, i) => (
              <div key={i} className="faint" style={{ fontSize: 12.5, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
                <strong style={{ color: "var(--text)" }}>{r.name}</strong>{r.org ? " · " + r.org : ""} · {r.reason} · {new Date(r.at).toLocaleDateString("en-GB")} · {r.by}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminScreen({ ownerEmail }) {
  const [users, setUsers] = useState(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState("");
  const ROLES = [["operator", "Operator"], ["agency", "Agency"], ["hospital", "Hospital"], ["clinician", "Clinician"]];
  const token = async () => { try { const { data } = await supabase.auth.getSession(); return data?.session?.access_token; } catch (e) { return null; } };
  const load = async () => {
    setErr(""); setUsers(null);
    try {
      const t = await token();
      const res = await fetch("/api/admin", { headers: { authorization: "Bearer " + t } });
      const j = await res.json();
      if (!res.ok) { setErr(j.error || "Could not load users. Check the admin setup in your deployment settings."); setUsers([]); return; }
      setUsers(j.users || []);
    } catch (e) { setErr(String(e)); setUsers([]); }
  };
  useEffect(() => { load(); }, []);
  const assign = async (userId, role) => {
    setSaving(userId);
    try {
      const t = await token();
      await fetch("/api/admin", { method: "POST", headers: { authorization: "Bearer " + t, "content-type": "application/json" }, body: JSON.stringify({ userId, role }) });
      setUsers((u) => u.map((x) => x.id === userId ? { ...x, role } : x));
    } catch (e) {}
    setSaving("");
  };
  return (
    <div>
      <AdminOps />
      <PageHead title="Admin" sub="Manage users and the role each account sees" right={<button className="btn btn-light" onClick={load}><RefreshCw size={15} /> Refresh</button>} />
      {err && <div className="card" style={{ padding: 16, marginBottom: 14, background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)", fontSize: 13.5, lineHeight: 1.5 }}>{err}</div>}
      {users === null && <div className="muted" style={{ padding: 20 }}>Loading users...</div>}
      {users && users.length === 0 && !err && <div className="muted" style={{ padding: 20 }}>No users yet.</div>}
      {users && users.length > 0 && (<div className="card" style={{ padding: 8 }}>{users.map((u, i) => (
        <div key={u.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: 14, borderBottom: i < users.length - 1 ? "1px solid var(--line)" : "none", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}><div className="row" style={{ gap: 8 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{u.email}</span>{ownerEmail && u.email && u.email.toLowerCase() === ownerEmail.toLowerCase() && <span className="chip chip-cyan" style={{ fontSize: 10 }}>You</span>}</div><div className="muted" style={{ fontSize: 12 }}>{u.role ? ("Role: " + u.role) : "No role yet"}{u.created_at ? " · joined " + new Date(u.created_at).toLocaleDateString() : ""}</div></div>
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{ROLES.map(([k, l]) => (<button key={k} disabled={saving === u.id} onClick={() => assign(u.id, k)} style={{ padding: "6px 11px", fontSize: 12.5, fontWeight: 600, borderRadius: 9, cursor: "pointer", border: "1px solid var(--line)", background: u.role === k ? "var(--blue)" : "#fff", color: u.role === k ? "#fff" : "var(--navy)", opacity: saving === u.id ? 0.6 : 1 }}>{l}</button>))}</div>
        </div>
      ))}</div>)}
    </div>
  );
}
function SettingsScreen({ plan, trialMsg, go, profileName, onName }) {
  const [p, setP] = useState({ name: "", email: "", title: "", region: "" });
  const [n, setN] = useState({ opps: true, replies: true, forums: true, digest: false });
  const [saved, setSaved] = useState(false);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_settings"); if (r?.value) { const s = JSON.parse(r.value); if (s.p) setP(s.p); if (s.n) setN(s.n); } } catch (e) {} })(); }, []);
  const save = () => { try { window.storage?.set("qura_settings", JSON.stringify({ p, n })); } catch (e) {} try { window.storage?.set("qura_profile_name", p.name || ""); } catch (e) {} if (onName) onName(p.name || ""); setSaved(true); setTimeout(() => setSaved(false), 1800); };
  const [showPriv, setShowPriv] = useState(false);
  const [dnote, setDnote] = useState("");
  const [comms, setComms] = useState(true);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_consent_comms"); if (r && r.value != null) setComms(r.value === "true" || r.value === true); } catch (e) {} })(); }, []);
  const setCommsV = (v) => { setComms(v); try { window.storage?.set("qura_consent_comms", String(v)); } catch (e) {} };
  const downloadData = async () => { const data = {}; try { const r = await window.storage?.list?.("qura_"); const keys = (r && r.keys) || []; for (const k of keys) { try { const v = await window.storage?.get(k); data[k] = v ? v.value : null; } catch (e) {} } } catch (e) {} try { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "qura-my-data.json"; a.click(); URL.revokeObjectURL(url); setDnote("Your data has been downloaded."); } catch (e) { setDnote("Download is not available here."); } };
  const eraseData = async () => { if (typeof window !== "undefined" && window.confirm && !window.confirm("Delete all your Qura data on this account? This cannot be undone.")) return; try { const r = await window.storage?.list?.("qura_"); const keys = (r && r.keys) || []; for (const k of keys) { try { await window.storage?.delete(k); } catch (e) {} } } catch (e) {} setDnote("Your data has been deleted."); };
  const field = (label, key, type) => (<div style={{ marginBottom: 16 }}><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>{label}</label><input className="in" type={type || "text"} value={p[key]} onChange={(e) => setP((x) => ({ ...x, [key]: e.target.value }))} /></div>);
  const notif = [["opps", "New high-fit opportunities", "Alert me when a strong-fit opportunity is published"], ["replies", "Proposal opens & replies", "Tell me when a decision-maker engages a proposal"], ["forums", "Round-table invites", "Invitations and confirmations for forums"], ["digest", "Weekly digest", "A Monday summary of pipeline and market moves"]];
  return (
    <div>
      <PageHead title="Settings" sub="Manage your profile and notification preferences" right={<button className="btn btn-primary" onClick={save}>{saved ? <><Check size={15} /> Saved</> : "Save changes"}</button>} />
      <div className="card" style={{ padding: 20, marginBottom: 16, background: "linear-gradient(120deg,var(--cyan-soft),#fff 70%)" }}><div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}><div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>Your plan</div><div className="disp" style={{ fontWeight: 700, fontSize: 20, marginTop: 4 }}>{plan ? (PLAN_LABEL[plan] || plan) : "No plan selected"}</div>{trialMsg && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{trialMsg}</div>}</div><button className="btn btn-primary" onClick={() => go && go("pricing")}>Manage plan</button></div></div>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}><SectionHead title="Your data & privacy" /><p className="muted" style={{ fontSize: 13, margin: "0 0 12px", lineHeight: 1.55 }}>Qura follows UK GDPR. Your data is stored per account, never sold, and you can access, export or erase it at any time.</p><label className="row" style={{ gap: 8, fontSize: 13, cursor: "pointer", marginBottom: 14 }}><input type="checkbox" checked={comms} onChange={(e) => setCommsV(e.target.checked)} /> I consent to receive product updates and marketing from Qura</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}><button className="btn btn-light" onClick={() => setShowPriv((v) => !v)}><ShieldCheck size={15} /> {showPriv ? "Hide" : "View"} privacy notice</button><button className="btn btn-light" onClick={downloadData}><FileText size={15} /> Download my data</button><button className="btn btn-light" style={{ color: "var(--red)" }} onClick={eraseData}><Trash2 size={15} /> Delete my data</button></div>{dnote ? <div className="chip chip-cyan" style={{ marginTop: 12 }}>{dnote}</div> : null}{showPriv ? <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}><PrivacyContent /></div> : null}</div>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}><SectionHead title="Testing" /><div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div className="muted" style={{ fontSize: 13, maxWidth: 360 }}>Reset the trial, plan and onboarding walkthrough to preview the first-run experience again.</div><button className="btn btn-light" style={{ color: "var(--red)" }} onClick={async () => { for (const k of ["qura_trial", "qura_trial_welcomed", "qura_plan", "qura_upgrade", "qura_tour_done", "qura_trial_events"]) { try { await window.storage?.delete(k); } catch (e) {} } try { window.location.reload(); } catch (e) {} }}>Reset trial & onboarding</button></div></div>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card" style={{ padding: 24 }}><SectionHead title="Profile" />{field("Full name", "name")}<div className="muted" style={{ fontSize: 12, margin: "-8px 0 14px" }}>This name shows on your top bar, account menu and the requirements you post.</div>{field("Work email", "email", "email")}{field("Title", "title")}{field("Region", "region")}</div>
        <div className="card" style={{ padding: 24 }}><SectionHead title="Notifications" /><div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{notif.map(([k, t, d], i) => (<div key={k} className="row" style={{ justifyContent: "space-between", gap: 16, padding: "13px 0", borderBottom: i < notif.length - 1 ? "1px solid var(--line)" : "none" }}><div><div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div><div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{d}</div></div><Toggle on={n[k]} onClick={() => setN((x) => ({ ...x, [k]: !x[k] }))} /></div>))}</div></div>
      </div>
    </div>
  );
}
function RelocationHub({ onToast, role, onNav }) {
  const CORRIDORS = [{ k: "in-uk", l: "International to UK", live: true }, { k: "uk-anz", l: "UK to Australia & NZ", live: true }, { k: "uk-me", l: "UK to Middle East", live: false }];
  const [corr, setCorr] = useState("in-uk");
  const CM = {
    "in-uk": { chip: "International to UK", visa: "Health & Care Worker visa, Certificate of Sponsorship and right-to-work checks.", reg: "GMC, NMC and HCPC registration, with OSCE or PLAB support.", regPartner: "Pass the OSCE" },
    "uk-anz": { chip: "UK to Australia & NZ", visa: "Skilled and health-workforce visa sponsorship for Australia and New Zealand.", reg: "AHPRA (Australia) and NZ council registration, with bridging support.", regPartner: "AHPRA Ready" },
    "uk-me": { chip: "UK to Middle East", visa: "Employment visa and licensing sponsorship across the Gulf.", reg: "DHA, DOH and MOH licensing (Dubai, Abu Dhabi and wider Gulf).", regPartner: "Gulf Licensing Co" },
  };
  const SERVICES = [
    { k: "visa", n: "Visas & sponsorship", i: ShieldCheck, c: "#1E54E6", from: 1450, d: "Health & Care Worker visa, Certificate of Sponsorship and right-to-work checks.", partner: "Meridian Immigration" },
    { k: "reg", n: "Registration & licensing", i: Award, c: "#0E8C7E", from: 650, d: "GMC, NMC and HCPC registration (AHPRA and equivalents for other markets).", partner: "Pass the OSCE" },
    { k: "accom", n: "Accommodation", i: Home, c: "#5B3FD6", from: 900, d: "Short-let landing pads and help finding longer-term housing near the site.", partner: "SettleWell Housing" },
    { k: "travel", n: "Flights & travel", i: Globe, c: "#00A79D", from: 480, d: "Flights, airport transfers and initial local travel set-up.", partner: "GlobeMove Travel" },
    { k: "bank", n: "Banking & tax setup", i: CreditCard, c: "#1E54E6", from: 220, d: "UK bank account, National Insurance number and tax registration.", partner: "FirstAccount" },
    { k: "lang", n: "Language (OET / IELTS)", i: MessageSquare, c: "#0E8C7E", from: 390, d: "OET and IELTS preparation and exam booking for clinical English.", partner: "Clarity Language" },
    { k: "onboard", n: "Onboarding & pastoral care", i: Users, c: "#5B3FD6", from: 350, d: "A named coordinator, first-weeks check-ins and community connection.", partner: "Qura Concierge" },
    { k: "family", n: "Family & schooling", i: Heart, c: "#C8102E", from: 540, d: "Partner employment support, school places and family settling-in.", partner: "HomeGround Family" },
  ];
  const [pack, setPack] = useState([]);
  const [who, setWho] = useState("");
  const toggle = (k) => setPack((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k]);
  const chosen = SERVICES.filter((x) => pack.includes(x.k));
  const subtotal = chosen.reduce((a, x) => a + x.from, 0);
  const fee = Math.round(subtotal * 0.1);
  const total = subtotal + fee;
  const fmt = (n) => "£" + n.toLocaleString();
  const request = () => { if (onToast) onToast(pack.length ? ("Relocation pack requested" + (who ? " for " + who : "")) : "Add a service to your pack first"); };
  return (
    <div>
      <PageHead title="Relocation & mobility" sub="Move talent between countries with a Qura-managed concierge on a vetted partner network. Pay-as-you-go, with no long contracts." right={<span className="chip chip-cyan"><Globe size={13} />
      {onNav ? <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--cyan-soft)", border: "none" }}><div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}><div className="row" style={{ gap: 10 }}><Home size={18} color="#06776F" /><span style={{ fontSize: 13.5 }}>Sorted your move? Accommodation is the next big step. Find verified housing partners in your destination.</span></div><button onClick={() => onNav("accommodation")} className="btn btn-primary" style={{ padding: "9px 16px" }}>Go to accommodation</button></div></div> : null} {CM[corr].chip}</span>} />
      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}>{CORRIDORS.map((c) => (<button key={c.k} onClick={() => c.live && setCorr(c.k)} disabled={!c.live} style={{ cursor: c.live ? "pointer" : "not-allowed", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: corr === c.k ? "var(--navy)" : "#fff", color: corr === c.k ? "#fff" : c.live ? "var(--navy)" : "var(--muted)", border: "1px solid var(--line)", opacity: c.live ? 1 : .65 }}>{c.l}{!c.live && <span style={{ fontSize: 10, marginLeft: 6 }}>soon</span>}</button>))}</div>
      <div className="card" style={{ padding: 16, marginBottom: 18, background: "var(--cyan-soft)", border: "none" }}><div className="row" style={{ gap: 10, alignItems: "flex-start" }}><Sparkles size={18} color="#06776F" style={{ flexShrink: 0, marginTop: 2 }} /><div style={{ fontSize: 13.5, lineHeight: 1.55 }}>Build a relocation pack for a candidate below. Qura coordinates every step through vetted partners, so agencies, providers and clinicians get one managed move. You pay only for the services you choose, plus a small marketplace fee.</div></div></div>
      <div className="grid g2" style={{ gap: 20, alignItems: "start" }}>
        <div className="grid g2">{SERVICES.map((x) => { const on = pack.includes(x.k); return (
          <div key={x.k} className="card" style={{ padding: 18, border: on ? "2px solid var(--cyan)" : "1px solid var(--line)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}><div style={{ width: 42, height: 42, borderRadius: 11, background: "#EEF3FF", display: "grid", placeItems: "center" }}><x.i size={20} color={x.c} /></div><span className="faint" style={{ fontSize: 12 }}>from {fmt(x.from)}</span></div>
            <div style={{ fontWeight: 600, fontSize: 15, margin: "12px 0 4px" }}>{x.n}</div>
            <p className="muted" style={{ fontSize: 12.5, margin: 0, lineHeight: 1.5, minHeight: 52 }}>{x.k === "visa" ? CM[corr].visa : x.k === "reg" ? CM[corr].reg : x.d}</p>
            <div className="faint" style={{ fontSize: 11.5, margin: "10px 0 12px" }}>Partner: {x.k === "reg" ? CM[corr].regPartner : x.partner}</div>
            <button onClick={() => toggle(x.k)} className={"btn " + (on ? "btn-primary" : "btn-light")} style={{ width: "100%", justifyContent: "center", fontSize: 13 }}>{on ? "Added to pack" : "Add to pack"}</button>
          </div>
        ); })}</div>
        <div className="card" style={{ padding: 22, position: "sticky", top: 16 }}>
          <div className="disp" style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Relocation pack</div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>For a single candidate moving into the UK.</p>
          <label style={{ fontSize: 12.5, fontWeight: 600 }}>Candidate name</label>
          <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="e.g. Dr. A. Nguyen" style={{ width: "100%", marginTop: 6, marginBottom: 14, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13.5, boxSizing: "border-box" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>{chosen.length ? chosen.map((x) => (<div key={x.k} className="row" style={{ justifyContent: "space-between", fontSize: 13 }}><span className="row" style={{ gap: 8 }}><x.i size={14} color={x.c} />{x.n}</span><span className="num">{fmt(x.from)}</span></div>)) : <div className="faint" style={{ fontSize: 13 }}>No services added yet. Choose from the list to build a pack.</div>}</div>
          {chosen.length > 0 && <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span className="muted">Subtotal</span><span className="num">{fmt(subtotal)}</span></div>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span className="muted">Marketplace fee (10%)</span><span className="num">{fmt(fee)}</span></div>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 15, fontWeight: 700, marginTop: 6 }}><span>Estimated total</span><span className="num">{fmt(total)}</span></div>
          </div>}
          <button onClick={request} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}><Send size={15} /> Request concierge</button>
          <div className="faint" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>Indicative prices in GBP, confirmed on quote. A Qura coordinator manages the move end to end.</div>
        </div>
      </div>
    </div>
  );
}

function PublicSectorIntel() {
  const [tab, setTab] = useState("icb");
  const ICBS = [
    { r: "NHS West & North London ICB", date: "Jun 2026", pts: ["Formed on 1 April 2026 from the North Central and North West London merger", "Diagnostics recovery and new CDC capacity across 13 boroughs", "Workforce and running-cost reductions under way"] },
    { r: "NHS North East London ICB", date: "Jun 2026", pts: ["Community diagnostics expansion under way", "Elective hub procurement moving to next stage", "Sonography vacancy rate cited as a delivery risk"] },
    { r: "NHS South East London ICB", date: "8 Jul 2026", pts: ["CDC throughput ahead of plan; ultrasound remains constrained", "Insourcing spend under review for value", "Digital diagnostics pilot extended"] },
    { r: "NHS South West London ICB", date: "Jun 2026", pts: ["Elective long-waits reduction programme update", "Community services recommissioning timeline set", "Radiography workforce pipeline discussed"] },
    { r: "NHS Greater Manchester ICB", date: "Jun 2026", pts: ["Imaging network business case approved", "Discharge-to-assess funding continued", "Running-cost reductions and redundancies noted"] },
    { r: "NHS West Yorkshire ICB", date: "Jun 2026", pts: ["Diagnostic capacity plan: mobile MRI and CT procurement", "Complex care packages review commissioned", "Primary care access recovery focus"] },
    { r: "NHS Birmingham & Solihull ICB", date: "Jun 2026", pts: ["CDC phase 2 approved with an insourcing partner", "Primary care estates investment", "Sonography and echo shortages noted"] },
  ];
  const BODIES = [
    { n: "Care Quality Commission (CQC)", t: "Regulator", pts: ["New single assessment framework rollout continues", "Focus on diagnostic imaging safety and staffing levels"] },
    { n: "NHS England", t: "National body", pts: ["2026/27 planning guidance: diagnostics and elective recovery priorities", "Agency price card and cap updates"] },
    { n: "Dept. of Health & Social Care", t: "Government", pts: ["Workforce plan refresh consultation open", "Adult social care funding settlement detail"] },
    { n: "London Borough of Camden", t: "Local council", pts: ["SEND transport and placement tender pipeline", "Adult social care complex packages recommissioned"] },
    { n: "London Borough of Croydon", t: "Local council", pts: ["Care home framework refresh announced", "Children's complex care commissioning update"] },
    { n: "Birmingham City Council", t: "Local council", pts: ["Large SEND capital programme progressing", "Domiciliary and complex care market engagement"] },
  ];
  const [icb, setIcb] = useState(ICBS);
  const [bodies, setBodies] = useState(BODIES);
  const [updated, setUpdated] = useState("");
  useEffect(() => { (async () => { try {
    const a = await window.storage?.get("psintel_icb", true); if (a?.value) { const v = JSON.parse(a.value); if (Array.isArray(v) && v.length) setIcb(v); }
    const b = await window.storage?.get("psintel_bodies", true); if (b?.value) { const v = JSON.parse(b.value); if (Array.isArray(v) && v.length) setBodies(v); }
    const u = await window.storage?.get("psintel_updated", true); if (u?.value) { try { setUpdated(JSON.parse(u.value)); } catch (e) { setUpdated(u.value); } }
  } catch (e) {} })(); }, []);
  const list = tab === "icb" ? icb : bodies;
  return (
    <div>
      <PageHead title="Public sector intelligence" sub="ICB board papers and council announcements, read and distilled by Qura, so you act on what matters without the reading." right={<span className="chip chip-cyan"><Sparkles size={13} /> Premium</span>} />
      <div className="card" style={{ padding: 16, marginBottom: 16, background: "var(--cyan-soft)", border: "none" }}>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}><ShieldCheck size={18} color="#06776F" style={{ flexShrink: 0, marginTop: 2 }} /><div style={{ fontSize: 13.5, lineHeight: 1.55 }}><b>Qura has done the reading.</b> We monitor publicly published ICB board papers and council announcements, then pull out only what is relevant to workforce, diagnostics, insourcing and procurement, saving your team hours every week. <span className="faint">{updated ? ("Last refreshed " + new Date(updated).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })) : "Refreshed daily by Qura."}</span></div></div>
      </div>
      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setTab("icb")} className="btn" style={{ background: tab === "icb" ? "var(--navy)" : "#fff", color: tab === "icb" ? "#fff" : "var(--navy)", border: "1px solid var(--line)" }}><Radar size={15} /> ICB board papers</button>
        <button onClick={() => setTab("bodies")} className="btn" style={{ background: tab === "bodies" ? "var(--navy)" : "#fff", color: tab === "bodies" ? "#fff" : "var(--navy)", border: "1px solid var(--line)" }}><Network size={15} /> Councils & governing bodies</button>
      </div>
      <div className="grid-2">{list.map((it) => (
        <div key={it.r || it.n} className="card lift" style={{ padding: 20 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
            <div className="row" style={{ gap: 10, minWidth: 0 }}><div style={{ width: 38, height: 38, borderRadius: 10, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}>{tab === "icb" ? <Radar size={18} color="#1E54E6" /> : <Network size={18} color="#1E54E6" />}</div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 15 }}>{it.r || it.n}</div><div className="faint" style={{ fontSize: 12 }}>{tab === "icb" ? ("Latest meeting: " + it.date) : it.t}</div></div></div>
            <span className="chip chip-cyan" style={{ fontSize: 10, flexShrink: 0 }}>Summarised by Qura</span>
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>{it.pts.map((p, i) => (<div key={i} className="row" style={{ gap: 9, alignItems: "flex-start" }}><span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--cyan)", marginTop: 7, flexShrink: 0 }} /><div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{p}</div></div>))}</div>
          <button className="btn btn-light" style={{ marginTop: 16, fontSize: 13 }}><FileText size={14} /> View source papers</button>
        </div>
      ))}</div>
    </div>
  );
}

function GPHub({ go, name }) {
  const cards = [
    ["Post sessions & vacancies", "Salaried, partner and locum GP roles, live to a verified primary care audience in minutes.", Rss, "feed"],
    ["Find GPs & locums", "Search available, credential-checked GPs and ARRS roles, and build shortlists.", UserCheck, "clinicians"],
    ["Primary care intelligence", "ICB primary care plans and funding, distilled by Qura for your PCN or federation.", Radar, "psintel"],
  ];
  return (
    <div>
      <PageHead title="GP practices & federations" sub="Fill sessions faster and see who is available now, with light-touch sign-up and no procurement sign-off." right={<button className="btn btn-primary" onClick={() => go("feed")}><Rss size={16} /> Post a session</button>} />
      <div className="card" style={{ padding: 16, marginBottom: 18, background: "var(--cyan-soft)", border: "none" }}><div className="row" style={{ gap: 10, alignItems: "flex-start" }}><Stethoscope size={18} color="#06776F" style={{ flexShrink: 0, marginTop: 2 }} /><div style={{ fontSize: 13.5, lineHeight: 1.55 }}>A dedicated home for primary care. Post salaried and locum GP sessions, browse verified GPs and ARRS roles, and tap Qura's market intelligence for your PCN or federation, an area of Qura expertise.</div></div></div>
      <div className="grid-stats" style={{ marginBottom: 18 }}>
        <Stat label="Available GPs" value="640+" delta="live now" icon={Stethoscope} />
        <Stat label="Sessions filled" value="1,900" delta="last 90d" icon={Calendar} accent="cyan" />
        <Stat label="Avg. time to fill" value="2.4 days" delta="vs 9 days" icon={Clock} />
        <Stat label="PCNs on Qura" value="118" delta="and growing" icon={Users} accent="cyan" />
      </div>
      <div className="grid g3">{cards.map(([t, d, I, k]) => (
        <div key={t} className="card lift" style={{ padding: 22, cursor: "pointer" }} onClick={() => go(k)}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center" }}><I size={22} color="#1E54E6" /></div>
          <h3 style={{ fontSize: 17, fontWeight: 600, margin: "14px 0 6px" }}>{t}</h3>
          <p className="muted" style={{ fontSize: 14, margin: 0, lineHeight: 1.55 }}>{d}</p>
          <div className="row" style={{ gap: 6, marginTop: 12, color: "var(--blue)", fontWeight: 600, fontSize: 13.5 }}>Open <ArrowRight size={15} /></div>
        </div>
      ))}</div>
    </div>
  );
}

function CareHub({ go, name }) {
  const areas = [
    { t: "Complex Care", i: Heart, c: "#5B3FD6", bg: "var(--violet-soft)", d: "Packages for paediatric and adult complex needs: specialist nurses, HCAs and clinical leads, matched to care plans and funding.", pts: ["Specialist nurse and HCA supply", "Continuing healthcare (CHC) packages", "Rapid response for hospital discharge"] },
    { t: "Care Homes", i: Home, c: "#06776F", bg: "var(--cyan-soft)", d: "Nursing and residential home staffing, from permanent recruitment to block cover, with compliance built in.", pts: ["Permanent and block staffing", "Nurse and carer availability", "CQC-aligned compliance"] },
    { t: "SEND", i: Award, c: "#1E54E6", bg: "#EEF3FF", d: "Support for SEND schools and local authorities: therapists, learning support and complex clinical roles, with council commissioning insight.", pts: ["Therapy and clinical roles", "Council SEND tenders and updates", "Placement and transport insight"] },
  ];
  const cards = [
    ["Post a requirement", "Live to verified care providers and clinicians in minutes.", Rss, "feed"],
    ["Find carers & nurses", "Search available, compliance-checked candidates and build shortlists.", Stethoscope, "clinicians"],
    ["Council & CQC intelligence", "SEND tenders, complex-care commissioning and CQC updates, distilled by Qura.", Network, "psintel"],
  ];
  return (
    <div>
      <PageHead title="Complex care, care homes & SEND" sub="One hub for the care sector, three areas of deep Qura expertise, with live candidates and public-sector intelligence." right={<button className="btn btn-primary" onClick={() => go("feed")}><Rss size={16} /> Post a requirement</button>} />
      <div className="grid g3" style={{ marginBottom: 18 }}>{areas.map((a) => (
        <div key={a.t} className="card lift" style={{ padding: 22 }}>
          <div className="row" style={{ gap: 10, justifyContent: "space-between" }}><div style={{ width: 46, height: 46, borderRadius: 12, background: a.bg, display: "grid", placeItems: "center" }}><a.i size={22} color={a.c} /></div><span className="chip chip-cyan" style={{ fontSize: 10 }}>Qura expertise</span></div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: "14px 0 6px" }}>{a.t}</h3>
          <p className="muted" style={{ fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>{a.d}</p>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>{a.pts.map((p) => (<div key={p} className="row" style={{ gap: 8, alignItems: "flex-start" }}><span style={{ width: 6, height: 6, borderRadius: 999, background: a.c, marginTop: 6, flexShrink: 0 }} /><div style={{ fontSize: 13, lineHeight: 1.45 }}>{p}</div></div>))}</div>
        </div>
      ))}</div>
      <div className="grid g3">{cards.map(([t, d, I, k]) => (
        <div key={t} className="card lift" style={{ padding: 22, cursor: "pointer" }} onClick={() => go(k)}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center" }}><I size={22} color="#1E54E6" /></div>
          <h3 style={{ fontSize: 16.5, fontWeight: 600, margin: "14px 0 6px" }}>{t}</h3>
          <p className="muted" style={{ fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>{d}</p>
          <div className="row" style={{ gap: 6, marginTop: 12, color: "var(--blue)", fontWeight: 600, fontSize: 13.5 }}>Open <ArrowRight size={15} /></div>
        </div>
      ))}</div>
    </div>
  );
}

function Shortlists({ onToast }) {
  const SEED = [
    { id: "c1", name: "Dr. Amara Nguyen", role: "Consultant Sonographer", loc: "Sydney, AU", band: "Consultant", rate: "£62/hr", status: "Contacted", note: "Open to UK relocation; strong obstetric imaging." },
    { id: "c2", name: "James Okoro", role: "CT Radiographer", loc: "Lagos, NG", band: "Band 7", rate: "£38/hr", status: "Saved", note: "" },
    { id: "c3", name: "Sofia Marchetti", role: "Cardiac Sonographer", loc: "Milan, IT", band: "Band 8a", rate: "£55/hr", status: "Interviewing", note: "Echo specialist; available from September." },
    { id: "c4", name: "Hannah Williams", role: "Complex Care Nurse", loc: "Leeds, UK", band: "Band 6", rate: "£29/hr", status: "Saved", note: "Paediatric complex care." },
  ];
  const STATUSES = ["Saved", "Contacted", "Interviewing", "Offer"];
  const SC = { Saved: "#6B7C9C", Contacted: "#1E54E6", Interviewing: "#0E8C7E", Offer: "#C8102E" };
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [nm, setNm] = useState("");
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_shortlist"); if (r?.value) { const v = JSON.parse(r.value); setItems(Array.isArray(v) ? v : SEED); return; } } catch (e) {} setItems(SEED); })(); }, []);
  const persist = (next) => { setItems(next); try { window.storage?.set("qura_shortlist", JSON.stringify(next)); } catch (e) {} };
  const remove = (id) => persist(items.filter((x) => x.id !== id));
  const cycle = (id) => persist(items.map((x) => x.id === id ? { ...x, status: STATUSES[(STATUSES.indexOf(x.status) + 1) % STATUSES.length] } : x));
  const setNote = (id, v) => persist(items.map((x) => x.id === id ? { ...x, note: v } : x));
  const add = () => { if (!nm.trim()) return; persist([{ id: "n" + Date.now(), name: nm.trim(), role: "New candidate", loc: "", band: "", rate: "", status: "Saved", note: "" }, ...items]); setNm(""); if (onToast) onToast("Added to shortlist"); };
  if (!items) return (<div><PageHead title="Shortlists" sub="Your saved candidates." /><div className="card muted" style={{ padding: 40, textAlign: "center" }}>Loading...</div></div>);
  const shown = items.filter((x) => (x.name + x.role + x.loc).toLowerCase().includes(q.toLowerCase()));
  const by = (st) => items.filter((x) => x.status === st).length;
  return (
    <div>
      <PageHead title="Shortlists" sub="Your saved candidates, tracked from first save to offer." right={<span className="chip chip-cyan"><Heart size={12} /> {items.length} saved</span>} />
      <div className="grid-stats" style={{ marginBottom: 16 }}>{STATUSES.map((st) => (<Stat key={st} label={st} value={String(by(st))} icon={Heart} accent={st === "Interviewing" ? "cyan" : undefined} />))}</div>
      <div className="row" style={{ gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="row" style={{ gap: 8, flex: 1, minWidth: 200, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 12px" }}><Search size={16} className="faint" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saved candidates" style={{ border: "none", outline: "none", flex: 1, fontSize: 13.5, background: "transparent" }} /></div>
        <div className="row" style={{ gap: 8 }}><input value={nm} onChange={(e) => setNm(e.target.value)} placeholder="Add a candidate name" onKeyDown={(e) => e.key === "Enter" && add()} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 13.5 }} /><button className="btn btn-primary" onClick={add}><Plus size={15} /> Add</button></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{shown.map((x) => (
        <div key={x.id} className="card" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div className="row" style={{ gap: 12, minWidth: 0 }}>
              <Avatar initials={x.name.split(" ").slice(-2).map((z) => z[0]).join("")} size={42} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{x.name}</div>
                <div className="faint" style={{ fontSize: 12.5 }}>{[x.role, x.band, x.loc].filter(Boolean).join(" · ")}</div>
                {x.rate && <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{x.rate}</div>}
              </div>
            </div>
            <div className="row" style={{ gap: 8, flexShrink: 0 }}>
              <button onClick={() => cycle(x.id)} className="chip" style={{ cursor: "pointer", background: (SC[x.status] || "#6B7C9C") + "1A", color: SC[x.status] || "#6B7C9C", border: "1px solid " + (SC[x.status] || "#6B7C9C") + "44", fontWeight: 700 }}>{x.status}</button>
              <button onClick={() => remove(x.id)} className="btn btn-light" style={{ padding: "7px 9px" }}><Trash2 size={15} /></button>
            </div>
          </div>
          <input value={x.note} onChange={(e) => setNote(x.id, e.target.value)} placeholder="Add a note..." style={{ width: "100%", marginTop: 12, padding: "9px 11px", border: "1px solid var(--line)", borderRadius: 9, fontSize: 13, boxSizing: "border-box", background: "var(--bg)" }} />
        </div>
      ))}{!shown.length && <div className="card" style={{ padding: 40, textAlign: "center" }}><div className="muted">No candidates match. Add one above to start a shortlist.</div></div>}</div>
    </div>
  );
}

function MessagesScreen() {
  const SEED = [
    { id: "m1", who: "St George's NHS Trust", init: "SG", role: "Imaging procurement", msgs: [{ me: false, t: "Are your sonographers available for a weekend insourcing block in August?", time: "09:12" }, { me: true, t: "Yes, we have 4 available. Shall I send profiles?", time: "09:20" }, { me: false, t: "Please do, with day rates.", time: "09:24" }] },
    { id: "m2", who: "Dr. Amara Nguyen", init: "AN", role: "Consultant Sonographer", msgs: [{ me: false, t: "Thanks for the UK relocation details. What visa route would apply?", time: "Yesterday" }, { me: true, t: "The Health & Care Worker visa. Our concierge can handle it end to end.", time: "Yesterday" }] },
    { id: "m3", who: "Harley Street Clinic", init: "HS", role: "Private fertility clinic", msgs: [{ me: false, t: "Could you share candidates for a fertility sonographer role?", time: "Mon" }] },
  ];
  const [convos, setConvos] = useState(SEED);
  const [active, setActive] = useState(SEED[0].id);
  const [draft, setDraft] = useState("");
  const cur = convos.find((c) => c.id === active);
  const send = () => { if (!draft.trim()) return; setConvos((cs) => cs.map((c) => c.id === active ? { ...c, msgs: [...c.msgs, { me: true, t: draft.trim(), time: "Now" }] } : c)); setDraft(""); };
  return (
    <div>
      <PageHead title="Messages" sub="Your conversations with providers, agencies and candidates." />
      <div className="card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 460 }}>
        <div style={{ borderRight: "1px solid var(--line)", overflowY: "auto" }}>{convos.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)} style={{ width: "100%", textAlign: "left", padding: "14px 16px", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", background: active === c.id ? "var(--bg)" : "#fff", display: "flex", gap: 11, alignItems: "center" }}>
            <Avatar initials={c.init} size={38} />
            <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.who}</div><div className="faint" style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.msgs[c.msgs.length - 1].t}</div></div>
          </button>
        ))}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="row" style={{ gap: 11, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}><Avatar initials={cur.init} size={36} /><div><div style={{ fontWeight: 600, fontSize: 14 }}>{cur.who}</div><div className="faint" style={{ fontSize: 12 }}>{cur.role}</div></div></div>
          <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", background: "var(--bg)" }}>{cur.msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "72%" }}><div style={{ background: m.me ? "var(--blue)" : "#fff", color: m.me ? "#fff" : "var(--text)", padding: "10px 13px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.45, border: m.me ? "none" : "1px solid var(--line)" }}>{m.t}</div><div className="faint" style={{ fontSize: 10.5, marginTop: 3, textAlign: m.me ? "right" : "left" }}>{m.time}</div></div>
          ))}</div>
          <div className="row" style={{ gap: 10, padding: 14, borderTop: "1px solid var(--line)" }}><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Write a message..." style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 10, padding: "11px 14px", fontSize: 13.5 }} /><button className="btn btn-primary" onClick={send}><Send size={15} /> Send</button></div>
        </div>
      </div>
    </div>
  );
}

function SavedOpps({ onPropose, market = "all", onToast }) {
  const [items, setItems] = useState(null);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_saved_opps"); const v = r?.value ? JSON.parse(r.value) : []; setItems(Array.isArray(v) ? v : []); } catch (e) { setItems([]); } })(); }, []);
  const remove = async (id) => { const next = (items || []).filter((x) => x.id !== id); setItems(next); try { await window.storage?.set("qura_saved_opps", JSON.stringify(next)); } catch (e) {} if (onToast) onToast("Removed from saved"); };
  if (!items) return (<div><PageHead title="Saved opportunities" sub="Opportunities you have bookmarked." /><div className="card muted" style={{ padding: 40, textAlign: "center" }}>Loading...</div></div>);
  return (
    <div>
      <PageHead title="Saved opportunities" sub="Opportunities you have bookmarked, ready to action." right={<span className="chip chip-cyan"><Star size={12} /> {items.length} saved</span>} />
      {!items.length ? <div className="card" style={{ padding: 44, textAlign: "center" }}><Star size={26} className="faint" style={{ margin: "0 auto 12px" }} /><div className="muted">No saved opportunities yet. Open Opportunities and tap Save on any that interest you.</div></div> :
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{items.map((o) => (
        <div key={o.id} className="card lift" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div className="row" style={{ gap: 14 }}><div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><Building2 size={20} color="#1E54E6" /></div><div><div className="row" style={{ gap: 9 }}><span style={{ fontWeight: 600, fontSize: 15.5 }}>{o.org}</span>{o.score ? <span className="chip chip-cyan"><Sparkles size={11} /> {o.score}</span> : null}<span className="chip chip-grey" style={{ fontSize: 11 }}>{o.market}</span></div><div className="muted row hsm" style={{ fontSize: 13, gap: 14, marginTop: 4 }}><span>{o.role}</span>{o.loc ? <span className="row" style={{ gap: 4 }}><MapPin size={12} />{o.loc}</span> : null}{o.source ? <span className="row" style={{ gap: 4 }}><Radar size={12} />{o.source}</span> : null}</div></div></div>
            <div className="row" style={{ gap: 16 }}><div style={{ textAlign: "right" }}><div className="disp" style={{ fontWeight: 700, fontSize: 17 }}>{convMoney(o.val, market)}</div>{o.close ? <span className="row faint" style={{ fontSize: 12, gap: 4, justifyContent: "flex-end" }}><Clock size={11} />Closes {o.close}</span> : null}</div><button className="btn btn-light" onClick={() => remove(o.id)}><Trash2 size={14} /></button><button className="btn btn-ai hsm" onClick={() => onPropose && onPropose(o)}><Sparkles size={14} /> Propose</button></div>
          </div>
        </div>
      ))}</div>}
    </div>
  );
}

function WeeklyReport({ sent = [], booked = [], moves = {}, lost = {}, name, email, market = "all", onToast }) {
  const parseMoney = (v) => { if (!v) return 0; let n = parseFloat(String(v).replace(/[^0-9.]/g, "")) || 0; if (/m/i.test(v)) n *= 1e6; else if (/k/i.test(v)) n *= 1e3; return n; };
  const fmtM = (n) => "£" + (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(Math.round(n)));
  const base = [];
  STAGES.forEach((st, si) => st.deals.forEach((d) => base.push({ o: d.o, v: d.v, si })));
  sent.forEach((x) => base.push({ o: x.org, v: x.val, si: 2 }));
  const deals = base.map((d) => { const key = d.o + "|" + d.v; return { ...d, key, si: moves[key] != null ? moves[key] : d.si }; }).filter((d) => !lost[d.key]);
  const wonStage = STAGES.length - 1;
  const won = deals.filter((d) => d.si === wonStage);
  const wonValue = won.reduce((a, d) => a + parseMoney(d.v), 0);
  const pipelineValue = deals.reduce((a, d) => a + parseMoney(d.v), 0);
  const byStage = STAGES.map((st, si) => { const col = deals.filter((d) => d.si === si); return { name: st.name, count: col.length, value: col.reduce((a, d) => a + parseMoney(d.v), 0) }; });
  const maxStage = Math.max(1, ...byStage.map((x) => x.value));
  const now = new Date(); const day = now.getDay(); const toFri = (5 - day + 7) % 7; const fri = new Date(now); fri.setDate(now.getDate() + toFri);
  const weekEnding = fri.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const fallback = "In the week ending " + weekEnding + " I booked " + booked.length + " meetings and sent " + sent.length + " proposals. We closed " + won.length + " deals worth " + fmtM(wonValue) + ", with total pipeline standing at " + fmtM(pipelineValue) + " across " + deals.length + " live opportunities.";
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(true);
  const gen = async () => { setLoading(true); try {
    const res = await fetch("/api/anthropic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 400, messages: [{ role: "user", content: "Write a concise weekly business development report summary in the first person" + (name ? " as " + name : "") + ", addressed to the board, in British English. Figures for the week ending " + weekEnding + ": " + booked.length + " meetings booked; " + sent.length + " proposals sent; " + won.length + " deals closed worth " + fmtM(wonValue) + "; total pipeline " + fmtM(pipelineValue) + " across " + deals.length + " live deals. Three to four sentences, confident and specific, no bullet points, no em dashes, no preamble." }] }) });
    const data = await res.json(); const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim(); setBrief(txt || fallback);
  } catch (e) { setBrief(fallback); } setLoading(false); };
  useEffect(() => { gen(); }, []);
  const plain = "QURA WEEKLY ACTIVITY REPORT\nWeek ending " + weekEnding + "\n\n" + (brief || fallback) + "\n\nMeetings booked: " + booked.length + "\nProposals sent: " + sent.length + "\nDeals closed: " + won.length + " (" + fmtM(wonValue) + ")\nPipeline: " + fmtM(pipelineValue) + " across " + deals.length + " live deals\n\nProposals sent:\n" + (sent.length ? sent.map((x) => "- " + x.org + (x.role ? " · " + x.role : "") + (x.val ? " · " + x.val : "")).join("\n") : "- none logged this week") + "\n\nPipeline by stage:\n" + byStage.map((st) => "- " + st.name + ": " + st.count + " deals · " + fmtM(st.value)).join("\n");
  const copy = () => { try { navigator.clipboard.writeText(plain); if (onToast) onToast("Report copied to clipboard"); } catch (e) { if (onToast) onToast("Copy not available here"); } };
  const emailMe = async () => {
    if (!email) { if (onToast) onToast("Sign in to email yourself the report"); return; }
    if (onToast) onToast("Sending your report...");
    try {
      const res = await fetch("/api/send-mail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: email, subject: "Qura weekly activity report, week ending " + weekEnding, text: plain }) });
      const data = await res.json();
      if (res.ok && data.ok) { if (onToast) onToast("Weekly report emailed to " + email); }
      else if (onToast) onToast(data && data.error ? ("Email not sent: " + data.error) : "Email is not configured yet");
    } catch (e) { if (onToast) onToast("Could not reach the email service"); }
  };
  return (
    <div>
      <PageHead title="Weekly activity report" sub={"Auto-generated for the board. Week ending " + weekEnding + "."} right={<div className="row" style={{ gap: 8 }}><button className="btn btn-light" onClick={copy}><FileText size={14} /> Copy</button><button className="btn btn-primary" onClick={emailMe}><Send size={14} /> Email me</button></div>} />
      <div className="card" style={{ padding: 22, marginBottom: 16, background: "linear-gradient(160deg, var(--cyan-soft), #fff 70%)", border: "1px solid var(--line)" }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}><span className="chip chip-cyan"><Sparkles size={12} /> Generated by Qura</span><button className="btn btn-light hsm" style={{ fontSize: 12, padding: "6px 10px" }} onClick={gen} disabled={loading}>{loading ? "Writing..." : "Regenerate"}</button></div>
        <p className="disp" style={{ fontSize: 17, lineHeight: 1.55, margin: 0, color: "var(--navy)", minHeight: 60 }}>{loading ? "Preparing your board summary..." : (brief || fallback)}</p>
      </div>
      <div className="grid-stats" style={{ marginBottom: 18 }}>
        <Stat label="Meetings booked" value={String(booked.length)} icon={Calendar} />
        <Stat label="Proposals sent" value={String(sent.length)} icon={Send} accent="cyan" />
        <Stat label="Deals closed" value={String(won.length)} icon={Trophy} />
        <Stat label="Closed value" value={fmtM(wonValue)} icon={TrendingUp} accent="cyan" />
        <Stat label="Pipeline value" value={fmtM(pipelineValue)} icon={GitBranch} />
      </div>
      <div className="grid g2" style={{ gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 20 }}>
          <SectionHead title="Pipeline overview" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>{byStage.map((st) => (
            <div key={st.name}>
              <div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span style={{ fontWeight: 600 }}>{st.name} <span className="faint">({st.count})</span></span><span className="num">{fmtM(st.value)}</span></div>
              <div style={{ height: 8, background: "var(--bg)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: Math.max(4, (st.value / maxStage) * 100) + "%", height: "100%", background: "linear-gradient(90deg, var(--teal), var(--cyan))", borderRadius: 999 }} /></div>
            </div>
          ))}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <SectionHead title={"Proposals sent (" + sent.length + ")"} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>{sent.length ? sent.slice(0, 8).map((x, i) => (
            <div key={i} className="row" style={{ justifyContent: "space-between", fontSize: 13.5 }}><span className="row" style={{ gap: 8, minWidth: 0 }}><Building2 size={14} color="#1E54E6" /><span style={{ minWidth: 0 }}>{x.org}{x.role ? <span className="faint"> · {x.role}</span> : null}</span></span><span className="num" style={{ flexShrink: 0 }}>{x.val || ""}</span></div>
          )) : <div className="faint" style={{ fontSize: 13 }}>No proposals logged this week yet. Send one from Opportunities or Proposals and it appears here.</div>}</div>
          <div style={{ height: 1, background: "var(--line)", margin: "16px 0 12px" }} />
          <SectionHead title={"Meetings booked (" + booked.length + ")"} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>{booked.length ? booked.slice(0, 6).map((m, i) => (
            <div key={i} className="row" style={{ gap: 8, fontSize: 13.5 }}><Calendar size={14} color="#0E8C7E" /><span>{m.org || m.who || m.title || "Meeting"}{m.when ? <span className="faint"> · {m.when}</span> : null}</span></div>
          )) : <div className="faint" style={{ fontSize: 13 }}>No meetings booked this week yet.</div>}</div>
        </div>
      </div>
      <div className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>This report is generated automatically each Friday morning and can be produced on demand at any time. It replaces the manual weekly board email. Figures reflect your logged activity and pipeline.</div>
    </div>
  );
}

function OwnerOps({ isOwner }) {
  const GROUPS = [
    { k: "agency", l: "Agencies", n: 642, c: "#2D6BFF" },
    { k: "hospital", l: "Hospitals & providers", n: 1498, c: "#00C2B8" },
    { k: "clinician", l: "Clinicians", n: 8473, c: "#7C5CFF" },
    { k: "gp", l: "GP practices", n: 210, c: "#0E8C7E" },
    { k: "care", l: "Care providers", n: 180, c: "#C8102E" },
    { k: "exec", l: "Executives", n: 140, c: "#F2A33C" },
    { k: "investor", l: "Investors", n: 95, c: "#1E54E6" },
  ];
  const total = GROUPS.reduce((a, g) => a + g.n, 0);
  const maxG = Math.max(...GROUPS.map((g) => g.n));
  const PLANS_MIX = [
    { l: "Starter", price: 450, subs: 180, c: "#2D6BFF" },
    { l: "Growth", price: 1200, subs: 96, c: "#00C2B8" },
    { l: "Enterprise", price: 3200, subs: 14, c: "#0A1730" },
  ];
  const mrr = PLANS_MIX.reduce((a, p) => a + p.price * p.subs, 0);
  const arr = mrr * 12;
  const activeSubs = PLANS_MIX.reduce((a, p) => a + p.subs, 0);
  const arpa = Math.round(mrr / activeSubs);
  const fmt = (n) => "£" + n.toLocaleString();
  const [live, setLive] = useState(null);
  useEffect(() => { (async () => { try { if (supabase) { const { data } = await supabase.auth.getSession(); const tok = data && data.session && data.session.access_token; if (tok) { const r = await fetch("/api/admin", { headers: { Authorization: "Bearer " + tok } }); if (r.ok) { const j = await r.json(); if (Array.isArray(j.users)) { const by = {}; j.users.forEach((u) => { const rk = u.role || "unassigned"; by[rk] = (by[rk] || 0) + 1; }); setLive({ total: j.users.length, by }); } } } } } catch (e) {} })(); }, []);
  if (isOwner === false) return (<div><PageHead title="Sign-ups & financials" sub="Owner only." /><div className="card muted" style={{ padding: 40, textAlign: "center" }}>This page is available to platform owners.</div></div>);
  return (
    <div>
      <PageHead title="Sign-ups & financials" sub="Platform growth and revenue at a glance" right={<span className="chip chip-cyan">Owner view</span>} />
      <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--bg)", border: "1px solid var(--line)" }}><div className="row" style={{ gap: 10, alignItems: "flex-start" }}><ShieldCheck size={16} color="#06776F" style={{ flexShrink: 0, marginTop: 2 }} /><div style={{ fontSize: 12.5, lineHeight: 1.5 }} className="muted">Platform figures are illustrative for now. Live registered-account counts pull from your database below; live revenue connects when Stripe reporting is switched on.</div></div></div>
      <div className="grid-stats" style={{ marginBottom: 18 }}>
        <Stat label="Total sign-ups" value={total.toLocaleString()} delta="illustrative" icon={Users} />
        <Stat label="MRR" value={fmt(mrr)} delta="+12% MoM" icon={TrendingUp} accent="cyan" />
        <Stat label="ARR" value={fmt(arr)} icon={BarChart3} />
        <Stat label="Active subscriptions" value={String(activeSubs)} icon={CreditCard} accent="cyan" />
        <Stat label="ARPA" value={fmt(arpa)} icon={Trophy} />
      </div>
      <div className="grid g2" style={{ gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 20 }}>
          <SectionHead title="Sign-ups by group" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>{GROUPS.map((g) => (
            <div key={g.k}><div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span style={{ fontWeight: 600 }}>{g.l}</span><span className="num">{g.n.toLocaleString()}</span></div><div style={{ height: 8, background: "var(--bg)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: Math.max(3, (g.n / maxG) * 100) + "%", height: "100%", background: g.c, borderRadius: 999 }} /></div></div>
          ))}</div>
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 12 }}><div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}><span className="muted">Live registered accounts (your database)</span><span className="num" style={{ fontWeight: 700 }}>{live ? live.total : "—"}</span></div>{live ? <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>{Object.entries(live.by).map(([k, v]) => k + ": " + v).join(" · ")}</div> : null}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <SectionHead title="Revenue by plan" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>{PLANS_MIX.map((p) => { const rev = p.price * p.subs; return (
            <div key={p.l}><div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span style={{ fontWeight: 600 }}>{p.l} <span className="faint">· {p.subs} subs · {fmt(p.price)}/mo</span></span><span className="num">{fmt(rev)}</span></div><div style={{ height: 8, background: "var(--bg)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: Math.max(3, (rev / mrr) * 100) + "%", height: "100%", background: p.c, borderRadius: 999 }} /></div></div>
          ); })}</div>
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}><span className="muted">Trial to paid conversion</span><span className="num">34%</span></div>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}><span className="muted">Monthly recurring revenue</span><span className="num" style={{ fontWeight: 700 }}>{fmt(mrr)}</span></div>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}><span className="muted">Annual run rate</span><span className="num" style={{ fontWeight: 700 }}>{fmt(arr)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IndustryNews() {
  const REGIONS = [{ k: "uk", l: "United Kingdom" }, { k: "ng", l: "Nigeria" }, { k: "me", l: "Middle East" }, { k: "intl", l: "International" }];
  const SEED = {
    uk: [
      { t: "NHS reorganisation: what the move to direct government running means for providers", s: "Health policy", ago: "2h" },
      { t: "New community diagnostic centres announced to cut waiting lists", s: "Diagnostics", ago: "5h" },
      { t: "Agency spend controls tighten across integrated care boards", s: "Public sector", ago: "1d" },
      { t: "Sonographer shortage flagged as an elective recovery risk", s: "Imaging", ago: "1d" },
    ],
    ng: [
      { t: "Lagos expands private health partnerships to widen access", s: "Business", ago: "3h" },
      { t: "Nigeria's diaspora health workforce: return incentives debated", s: "Health NG", ago: "8h" },
      { t: "Investment flows into Nigerian diagnostics and imaging", s: "Markets", ago: "1d" },
    ],
    me: [
      { t: "Gulf health systems accelerate international clinician recruitment", s: "Gulf Health", ago: "4h" },
      { t: "Dubai expands mandatory health screening programmes", s: "ME Medical", ago: "10h" },
      { t: "Saudi hospitals invest in advanced imaging capacity", s: "Health ME", ago: "1d" },
    ],
    intl: [
      { t: "Australia and New Zealand deepen overseas sonographer pathways", s: "ANZ Health", ago: "6h" },
      { t: "Global health workforce shortage projected to widen", s: "World Health", ago: "12h" },
      { t: "Cross-border clinician mobility: new bilateral agreements signed", s: "Global", ago: "1d" },
    ],
  };
  const [region, setRegion] = useState("uk");
  const [data, setData] = useState(SEED);
  const [updated, setUpdated] = useState("");
  useEffect(() => { (async () => { try {
    const next = { ...SEED };
    for (const rk of ["uk", "ng", "me", "intl"]) { try { const r = await window.storage?.get("qura_news_" + rk, true); if (r?.value) { const v = JSON.parse(r.value); if (Array.isArray(v) && v.length) next[rk] = v; } } catch (e) {} }
    setData(next);
    try { const u = await window.storage?.get("qura_news_updated", true); if (u?.value) { try { setUpdated(JSON.parse(u.value)); } catch (e) { setUpdated(u.value); } } } catch (e) {}
  } catch (e) {} })(); }, []);
  const items = data[region] || [];
  return (
    <div>
      <PageHead title="Industry news" sub="Live healthcare news for your market, with a tap to see any other region" right={<span className="chip chip-cyan"><Rss size={12} /> {updated ? "Updated " + new Date(updated).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Refreshed daily"}</span>} />
      <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: "wrap" }}>{REGIONS.map((r) => (<button key={r.k} onClick={() => setRegion(r.k)} style={{ cursor: "pointer", padding: "8px 15px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: region === r.k ? "var(--navy)" : "#fff", color: region === r.k ? "#fff" : "var(--navy)", border: "1px solid var(--line)" }}>{r.l}</button>))}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{items.map((n, i) => (
        <a key={i} href={n.url || undefined} target="_blank" rel="noreferrer" className="card lift" style={{ padding: 18, display: "block", textDecoration: "none", color: "inherit" }}>
          <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><Rss size={18} color="#1E54E6" /></div>
            <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.4 }}>{n.t}</div><div className="faint" style={{ fontSize: 12, marginTop: 5 }}>{n.s}{n.ago ? " · " + n.ago : ""}</div></div>
            {n.url ? <ArrowRight size={16} className="faint" style={{ flexShrink: 0 }} /> : null}
          </div>
        </a>
      ))}</div>
      <div className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>Headlines refresh daily from public healthcare news for each region. Licensed sources such as HSJ can be added to your feed.</div>
    </div>
  );
}

function AgencyBot({ plan = "starter" }) {
  const premium = ["trial", "growth", "enterprise"].includes(plan);
  const lab = { fontSize: 12.5, fontWeight: 600, display: "block", margin: "12px 0 5px" };
  const inp = { width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13.5, boxSizing: "border-box" };
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fmt = (t) => esc(t).replace(/^\s*&gt;\s?/gm, "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
  const [cfg, setCfg] = useState({ name: "", kb: "", phrases: "", tone: "Professional", guard: true });
  const [saved, setSaved] = useState(false);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_bot_config"); if (r?.value) { const v = JSON.parse(r.value); setCfg((c) => ({ ...c, ...v })); } } catch (e) {} })(); }, []);
  const save = () => { try { window.storage?.set("qura_bot_config", JSON.stringify(cfg)); } catch (e) {} setSaved(true); setTimeout(() => setSaved(false), 1600); };
  const [msgs, setMsgs] = useState([{ me: false, t: "Hi, I'm your 24/7 assistant. Ask me anything a hospital or client might, and I'll respond in your voice." }]);
  const [draft, setDraft] = useState(""); const [busy, setBusy] = useState(false);
  const system = () => "You are the 24/7 AI assistant for " + (cfg.name || "a UK healthcare workforce supplier") + ", speaking to hospitals and clients on their behalf. Services and knowledge: " + (cfg.kb || "specialist healthcare recruitment across fragile professions such as sonography, audiology and radiography.") + " Preferred phrases to weave in where natural: " + (cfg.phrases || "fragile professions, verified candidates, rapid turnaround") + ". Tone: " + cfg.tone + ". " + (cfg.guard ? "Guardrails: never commit to specific rates, availability or start dates without confirming a human will verify; qualify every enquiry by asking role, specialty, location, timeframe and budget; never invent candidate names." : "") + " Be concise, helpful and commercial. Qualify leads, answer FAQs, and help draft responses. Write in British English. Do not use emojis, markdown headings or blockquotes. Short numbered lists are fine when qualifying. Keep formatting light.";
  const send = async () => { if (!draft.trim()) return; const um = { me: true, t: draft.trim() }; const hist = [...msgs, um]; setMsgs(hist); setDraft(""); setBusy(true);
    try {
      let convo = hist.filter((m) => m.t).map((m) => ({ role: m.me ? "user" : "assistant", content: m.t }));
      while (convo.length && convo[0].role !== "user") convo.shift();
      const res = await fetch("/api/anthropic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500, system: system(), messages: convo }) });
      const data = await res.json();
      const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      const err = data && data.error ? (typeof data.error === "string" ? data.error : (data.error.message || JSON.stringify(data.error))) : "";
      setMsgs((x) => [...x, { me: false, t: txt || (err ? ("Assistant error: " + err) : "Sorry, I could not respond just now.") }]);
    } catch (e) { setMsgs((x) => [...x, { me: false, t: "Network error reaching the assistant: " + String(e) }]); }
    setBusy(false);
  };
  return (
    <div>
      <PageHead title="AI assistant" sub="Your 24/7 AI assistant that replies to enquiries, qualifies leads, answers FAQs and drafts responses in your voice" right={<span className="chip chip-cyan"><Sparkles size={12} /> Premium</span>} />
      {!premium ? <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--cyan-soft)", border: "none" }}><div style={{ fontSize: 13.5 }}>The AI assistant is a Growth feature. You can set it up and preview it on your trial, then keep it on Growth or above.</div></div> : null}
      <div className="grid g2" style={{ gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 20 }}>
          <SectionHead title="Fine-tune your AI assistant" />
          <label style={lab}>Agency name</label>
          <input value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} placeholder="e.g. Amare Health" style={inp} />
          <label style={lab}>Knowledge base</label>
          <textarea value={cfg.kb} onChange={(e) => setCfg({ ...cfg, kb: e.target.value })} placeholder="What you do, specialties, frameworks you are on, coverage, USPs..." rows={4} style={{ ...inp, resize: "vertical" }} />
          <label style={lab}>Key phrases to use</label>
          <input value={cfg.phrases} onChange={(e) => setCfg({ ...cfg, phrases: e.target.value })} placeholder="fragile professions, verified candidates, master vendor..." style={inp} />
          <label style={lab}>Tone</label>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 4 }}>{["Professional", "Warm", "Direct"].map((t) => (<button key={t} onClick={() => setCfg({ ...cfg, tone: t })} className="chip" style={{ cursor: "pointer", background: cfg.tone === t ? "var(--navy)" : "#fff", color: cfg.tone === t ? "#fff" : "var(--navy)", border: "1px solid var(--line)" }}>{t}</button>))}</div>
          <label className="row" style={{ gap: 8, fontSize: 13, marginTop: 14, cursor: "pointer" }}><input type="checkbox" checked={cfg.guard} onChange={(e) => setCfg({ ...cfg, guard: e.target.checked })} /> Safety guardrails (no rates or promises without a human)</label>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={save}>{saved ? <><Check size={15} /> Saved</> : "Save assistant"}</button>
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 460 }}>
          <div className="row" style={{ gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}><div style={{ width: 34, height: 34, borderRadius: 999, background: "var(--cyan-soft)", display: "grid", placeItems: "center" }}><Sparkles size={16} color="#06776F" /></div><div><div style={{ fontWeight: 600, fontSize: 14 }}>{cfg.name || "Your agency"} assistant</div><div className="faint" style={{ fontSize: 11.5 }}>Preview · replies in your voice</div></div></div>
          <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", background: "var(--bg)" }}>{msgs.map((m, i) => (<div key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "80%" }}><div style={{ background: m.me ? "var(--blue)" : "#fff", color: m.me ? "#fff" : "var(--text)", padding: "10px 13px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.5, border: m.me ? "none" : "1px solid var(--line)" }}>{m.me ? m.t : <span dangerouslySetInnerHTML={{ __html: fmt(m.t) }} />}</div></div>))}{busy ? <div className="faint" style={{ fontSize: 12 }}>Assistant is typing...</div> : null}</div>
          <div className="row" style={{ gap: 10, padding: 14, borderTop: "1px solid var(--line)" }}><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type an enquiry a hospital might send..." style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 10, padding: "11px 14px", fontSize: 13.5 }} /><button className="btn btn-primary" onClick={send} disabled={busy}><Send size={15} /> Send</button></div>
        </div>
      </div>
      <div className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>Preview uses your live AI. Connecting the AI assistant to reply automatically to real inbound enquiries (email, web form or WhatsApp) is a quick backend step we switch on when you are ready.</div>
    </div>
  );
}


















function ClinicianRegistration({ onToast }) {
  const [f, setF] = useState({ cat: "", prof: "", regNo: "", country: "", years: "", sector: "", cv: "", declare: false });
  const [done, setDone] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const onCv = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    upd("cv", file.name);
    if (supabase && supabase.storage) {
      setCvBusy(true);
      try {
        const path = "uploads/" + Date.now() + "_" + file.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const { error } = await supabase.storage.from("cvs").upload(path, file, { upsert: false });
        if (!error) setF((st) => ({ ...st, cvPath: path }));
      } catch (err) {}
      setCvBusy(false);
    }
  };
  const profs = f.cat === "Nurse / Midwife" ? NURSE_TYPES : f.cat === "Allied Health Professional" ? AHP_TYPES : f.cat === "Doctor" ? DOCTOR_SPECIALTIES : f.cat === "Pharmacy & Healthcare Science" ? SCIENCE_TYPES : [];
  const body = REG_BODY[f.cat] || "professional";
  const isUK = f.country === "United Kingdom";
  const isIntl = f.country && f.country !== "United Kingdom";
  const minYears = isIntl ? 2 : 1;
  const yearsOk = f.years !== "" && Number(f.years) >= minYears;
  const protectedC = PROTECTED_LIST.includes(f.country);
  const checks = [
    { k: "Category", ok: !!f.cat },
    { k: "Profession / specialty", ok: !!f.prof },
    { k: body + " registration number", ok: !!f.regNo.trim() },
    { k: "Country of residence", ok: !!f.country },
    { k: "Minimum " + minYears + " years' experience", ok: yearsOk },
    { k: "NHS or private experience", ok: !isUK || !!f.sector },
    { k: "CV uploaded", ok: !!f.cv },
    { k: "Declaration", ok: f.declare },
  ];
  const complete = checks.every((c) => c.ok);
  const submit = () => { if (!complete) return; setDone(true); if (onToast) onToast("Registration complete. You are now registered on Qura."); };
  const lab = { fontSize: 12.5, fontWeight: 600, display: "block", margin: "14px 0 5px" };
  const inp = { width: "100%", padding: "11px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14, boxSizing: "border-box", background: "#fff" };
  if (done) return (
    <div>
      <PageHead title="Register with Qura" sub="Registration and profile checks" />
      <div className="card" style={{ padding: 40, textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: "var(--cyan-soft)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><ShieldCheck size={30} color="#06776F" /></div>
        <h2 className="disp" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>You are registered on Qura</h2>
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>Your profile is complete and added to the Qura network. Hospital decision-makers and workforce suppliers around the world can now find you. Before any introduction is made we check your registration number directly against the official register, and your profile is then marked verified. We will be in touch as matching roles appear.</p>
        {protectedC ? <div className="chip chip-med" style={{ marginTop: 16 }}>Direct application status applies to your country</div> : null}
      </div>
    </div>
  );
  return (
    <div>
      <PageHead title="Register with Qura" sub="Complete your registration to join the network. Every field is required, so hospitals know each Qura clinician is qualified and employable straight away." right={<span className="chip chip-cyan"><ShieldCheck size={12} /> Complete profiles only</span>} />
      <div className="grid g2" style={{ gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 22 }}>
          <SectionHead title="1. Profession" />
          <label style={lab}>Category</label>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{["Nurse / Midwife", "Allied Health Professional", "Doctor", "Pharmacy & Healthcare Science"].map((c) => (<button key={c} onClick={() => { upd("cat", c); upd("prof", ""); }} className="chip" style={{ cursor: "pointer", padding: "9px 14px", background: f.cat === c ? "var(--navy)" : "#EEF1F7", color: f.cat === c ? "#fff" : "#5A6783" }}>{c}</button>))}</div>
          {f.cat ? <><label style={lab}>{f.cat === "Doctor" ? "Specialty (general or niche)" : "Profession"}</label>
          <select value={f.prof} onChange={(e) => upd("prof", e.target.value)} style={inp}><option value="">Select...</option>{profs.map((p) => <option key={p} value={p}>{p}</option>)}</select>
          <label style={lab}>{body} registration number</label>
          <input value={f.regNo} onChange={(e) => upd("regNo", e.target.value)} placeholder={"Your " + body + " PIN / reference"} style={inp} /></> : <p className="faint" style={{ fontSize: 13, marginTop: 10 }}>Choose a category to see the relevant professions and registration body.</p>}

          <div style={{ height: 1, background: "var(--line)", margin: "22px 0" }} />
          <SectionHead title="2. Experience & location" />
          <label style={lab}>Country of residence</label>
          <select value={f.country} onChange={(e) => upd("country", e.target.value)} style={inp}><option value="">Select...</option>{RESIDENCE_LIST.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          {protectedC ? <div className="row" style={{ gap: 8, marginTop: 10, fontSize: 12.5, color: "#9A5E00", background: "var(--amber-bg)", padding: "9px 11px", borderRadius: 9, lineHeight: 1.5 }}><ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>Your country is on the WHO and UK protected-countries list. You are welcome to register and apply directly, of your own accord. Qura will not actively target recruitment from your country.</span></div> : null}
          <label style={lab}>Years of experience{isIntl ? " (2 years minimum for international candidates)" : " (1 year minimum)"}</label>
          <input type="number" min="0" value={f.years} onChange={(e) => upd("years", e.target.value)} placeholder="e.g. 5" style={{ ...inp, borderColor: f.years !== "" && !yearsOk ? "var(--red)" : "var(--line)" }} />
          {f.years !== "" && !yearsOk ? <div className="faint" style={{ fontSize: 12, color: "var(--red)", marginTop: 5 }}>A minimum of {minYears} year{minYears > 1 ? "s" : ""} is required to join.</div> : null}
          {isUK ? <><label style={lab}>UK experience</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{["NHS", "Private", "Both"].map((sct) => (<button key={sct} onClick={() => upd("sector", sct)} className="chip" style={{ cursor: "pointer", padding: "8px 14px", background: f.sector === sct ? "var(--blue)" : "#EEF1F7", color: f.sector === sct ? "#fff" : "#5A6783" }}>{sct}</button>))}</div></> : null}

          <div style={{ height: 1, background: "var(--line)", margin: "22px 0" }} />
          <SectionHead title="3. Proof of experience" />
          <label style={lab}>Upload your CV (PDF or Word)</label>
          <label className="btn btn-light" style={{ cursor: "pointer", justifyContent: "center", width: "100%" }}><FileText size={15} /> {cvBusy ? "Uploading..." : (f.cv ? "Replace CV" : "Choose file")}<input type="file" accept=".pdf,.doc,.docx" onChange={onCv} style={{ display: "none" }} /></label>
          {f.cv ? <div className="row" style={{ gap: 8, marginTop: 8, fontSize: 13 }}><Check size={15} color="#0E8C7E" /> {f.cv}{f.cvPath ? <span className="faint" style={{ fontSize: 11.5 }}>(stored securely)</span> : null}</div> : null}
          <label className="row" style={{ gap: 9, fontSize: 13, cursor: "pointer", marginTop: 18, alignItems: "flex-start", lineHeight: 1.45 }}><input type="checkbox" checked={f.declare} onChange={(e) => upd("declare", e.target.checked)} style={{ marginTop: 2 }} /> I confirm the information provided is accurate, my registration is current, and I consent to Qura holding this data in line with the privacy notice.</label>
        </div>
        <div className="card" style={{ padding: 22, position: "sticky", top: 16 }}>
          <SectionHead title="Registration status" />
          <p className="muted" style={{ fontSize: 12.5, marginTop: 0, marginBottom: 14 }}>You can only join once every item is complete. This is how we keep the network complete and employable.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{checks.map((c) => (<div key={c.k} className="row" style={{ gap: 9, fontSize: 13.5, color: c.ok ? "var(--text)" : "var(--muted)" }}>{c.ok ? <Check size={16} color="#0E8C7E" style={{ flexShrink: 0 }} /> : <span style={{ width: 16, height: 16, borderRadius: 999, border: "1.6px solid var(--line)", flexShrink: 0 }} />}{c.k}</div>))}</div>
          <button onClick={submit} disabled={!complete} className={"btn " + (complete ? "btn-primary" : "btn-light")} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>{complete ? "Complete registration" : "Complete all items to join"}</button>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>An incomplete profile cannot join the network. CV upload is captured here; secure file storage connects with your backend.</div>
        </div>
      </div>
    </div>
  );
}

function TalentPipeline({ role = "agency", onToast }) {
  const supplierView = role === "agency" || role === "operator";
  const TALENT = CLINICIANS.map((c, i) => ({ id: "t" + i, spec: c.spec, yrs: c.yrs, flag: c.flag, country: c.country, sector: c.sector, avail: c.avail, band: c.rate, direct: c.direct }));
  const [ads, setAds] = useState(TALENT.map((t) => t.id));
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_pipeline_ads"); if (r?.value) { const v = JSON.parse(r.value); if (Array.isArray(v)) setAds(v); } } catch (e) {} })(); }, []);
  const persist = (v) => { setAds(v); try { window.storage?.set("qura_pipeline_ads", JSON.stringify(v)); } catch (e) {} };
  const toggle = (id) => persist(ads.includes(id) ? ads.filter((x) => x !== id) : [...ads, id]);
  const advertised = TALENT.filter((t) => ads.includes(t.id));
  const shown = supplierView ? TALENT : advertised;
  const request = (t) => { if (onToast) onToast("Introduction requested for the " + t.spec + " candidate"); };
  return (
    <div>
      <PageHead title={supplierView ? "Talent pipeline" : "Available talent"} sub={supplierView ? "Advertise your available candidates to hospitals. Profiles are anonymised until a hospital engages and you approve the introduction." : "Anonymised candidates that workforce suppliers have available now. Request an introduction to engage."} right={<span className="chip chip-cyan"><Users size={12} /> {advertised.length} {supplierView ? "advertised" : "available"}</span>} />
      {supplierView ? <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--cyan-soft)", border: "none" }}><div className="row" style={{ gap: 10, alignItems: "flex-start" }}><Sparkles size={18} color="#06776F" style={{ flexShrink: 0, marginTop: 2 }} /><div style={{ fontSize: 12.5, lineHeight: 1.55 }}>Advertise your available pipeline so hospitals engage when they see a match. Toggle candidates on or off. Names stay hidden until you approve an introduction.</div></div></div> : null}
      <div className="grid-3">{shown.map((t) => { const on = ads.includes(t.id); return (
        <div key={t.id} className="card lift" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between" }}><div style={{ width: 42, height: 42, borderRadius: 11, background: "#EEF3FF", display: "grid", placeItems: "center" }}><Stethoscope size={19} color="#1E54E6" /></div><span className="chip chip-grey" style={{ fontSize: 11.5 }}>{t.yrs} yrs</span></div>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 12 }}>{t.spec}</div>
          <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}><span className="chip chip-grey" style={{ fontSize: 11.5 }}>{t.flag} {t.country}</span><span className={"chip " + (t.sector === "NHS" ? "chip-blue" : t.sector === "Private" ? "chip-violet" : "chip-low")} style={{ fontSize: 11.5 }}>{t.sector === "Both" ? "NHS & Private" : t.sector}</span></div>
          {t.direct ? <div className="faint" style={{ fontSize: 11, marginTop: 6, color: "#9A5E00" }}>Direct application only (protected list)</div> : null}
          <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}><span style={{ fontWeight: 600, fontSize: 13.5 }}>{t.band}</span><span className="chip chip-low">{t.avail}</span></div>
          {supplierView ? <button onClick={() => toggle(t.id)} className={"btn " + (on ? "btn-primary" : "btn-light")} style={{ width: "100%", justifyContent: "center", marginTop: 12, padding: "9px" }}>{on ? <><Check size={14} /> Advertised</> : "Advertise to hospitals"}</button> : <button onClick={() => request(t)} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12, padding: "9px" }}><Send size={14} /> Request introduction</button>}
        </div>
      ); })}{!shown.length ? <div className="card" style={{ padding: 40, textAlign: "center", gridColumn: "1/-1" }}><div className="muted">Nothing advertised yet.</div></div> : null}</div>
    </div>
  );
}

function LiveProjects({ onToast }) {
  const [engaged, setEngaged] = useState([]);
  const projects = OPPS.slice(0, 8);
  const engage = (o, i) => { setEngaged((v) => v.includes(i) ? v : [...v, i]); if (onToast) onToast("Interest sent to " + o.org); };
  return (
    <div>
      <PageHead title="Live projects" sub="Roles advertised by workforce suppliers and hospitals. See one that matches your experience? Engage directly, without waiting to be found." right={<span className="chip chip-cyan"><Radar size={12} /> Updated live</span>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{projects.map((o, i) => { const on = engaged.includes(i); return (
        <div key={i} className="card lift" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div className="row" style={{ gap: 14 }}><div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><Building2 size={20} color="#1E54E6" /></div><div><div className="row" style={{ gap: 9, flexWrap: "wrap" }}><span style={{ fontWeight: 600, fontSize: 15.5 }}>{o.role}</span>{o.score ? <span className="chip chip-cyan"><Sparkles size={11} /> {o.score}% fit</span> : null}<span className="chip chip-grey" style={{ fontSize: 11 }}>{o.market}</span></div><div className="muted row hsm" style={{ fontSize: 13, gap: 14, marginTop: 4 }}><span>{o.org}</span>{o.loc ? <span className="row" style={{ gap: 4 }}><MapPin size={12} />{o.loc}</span> : null}</div></div></div>
            <div className="row" style={{ gap: 12 }}>{o.close ? <span className="chip chip-low">{o.close} left</span> : null}<button onClick={() => engage(o, i)} disabled={on} className={"btn " + (on ? "btn-light" : "btn-primary")}>{on ? <><Check size={14} /> Interest sent</> : <><Send size={14} /> Express interest</>}</button></div>
          </div>
        </div>
      ); })}</div>
      <div className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>Expressing interest notifies the workforce supplier or hospital directly, so strong candidates engage the moment a matching project goes live.</div>
    </div>
  );
}





function HowToUseQura({ email, onToast }) {
  const [view, setView] = useState("menu");
  const [bookings, setBookings] = useState([]);
  const [tier, setTier] = useState("founder");
  const [slot, setSlot] = useState("");
  const [wOption, setWOption] = useState("w5");
  const [wDate, setWDate] = useState("");
  const [rewatch, setRewatch] = useState(false);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_bookings"); if (r?.value) { const v = JSON.parse(r.value); if (Array.isArray(v)) setBookings(v); } } catch (e) {} })(); }, []);
  const SESSIONS = { founder: { who: "Founder strategy session", price: "£299", note: "20 minutes, one to one with a Qura co-founder." }, senior: { who: "Senior team strategy session", price: "£149", note: "20 minutes, one to one with a senior Qura strategist." } };
  const WORKSHOPS = { w5: { label: "Team workshop", price: "£99", note: "Up to 5 attendees from your organisation." }, wUnlimited: { label: "Whole-team workshop", price: "£199", note: "Unlimited attendees from your organisation." } };
  const fmt = (dt) => dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const days = (() => { const out = []; const d = new Date(); while (out.length < 6) { d.setDate(d.getDate() + 1); const g = d.getDay(); if (g === 0 || g === 6) continue; out.push(new Date(d)); } return out; })();
  const slotList = []; days.forEach((dt) => ["10:00", "14:00", "16:30"].forEach((t) => slotList.push(fmt(dt) + " · " + t)));
  const fullSet = new Set([slotList[1], slotList[4], slotList[8]]);
  const wDates = days.slice(0, 3).map((dt, i) => ({ label: fmt(dt) + " · 11:00", places: [8, 3, 12][i] }));
  const record = (entry) => { const next = [{ id: "bk_" + Date.now(), at: new Date().toISOString(), status: "Confirmed", ...entry }, ...bookings]; setBookings(next); try { window.storage?.set("qura_bookings", JSON.stringify(next)); } catch (e) {} };
  const pay = async (planKey, label) => { record({ type: label }); if (billingEnabled) { try { await startCheckout(planKey, false); return; } catch (e) {} } if (onToast) onToast(label + " booked. A calendar invite, confirmation email and video link are on their way."); setView("menu"); };
  const bookSession = () => { if (!slot || fullSet.has(slot)) { record({ type: SESSIONS[tier].who + " (waiting list)", status: "Waiting list" }); if (onToast) onToast("Added to the waiting list. We will be in touch when a slot opens."); setView("menu"); return; } pay("session:" + tier, SESSIONS[tier].who + " · " + slot); };
  const bookWorkshop = () => { if (!wDate) { if (onToast) onToast("Pick a workshop date first"); return; } pay("workshop:" + wOption, WORKSHOPS[wOption].label + " · " + wDate); };
  const capLbl = { fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)", marginBottom: 8 };
  return (
    <div>
      <PageHead title="How to use Qura effectively" sub="Watch the demo any time, then get the most from Qura with a private strategy session or a live team workshop." right={<span className="chip chip-cyan"><Sparkles size={12} /> Members only</span>} />
      <div className="grid-3" style={{ marginBottom: 18 }}>
        <div className="card lift" style={{ padding: 22 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center" }}><Play size={20} color="#1E54E6" /></div><div style={{ fontWeight: 700, fontSize: 16, marginTop: 12 }}>Watch the demo again</div><p className="muted" style={{ fontSize: 13, marginTop: 6 }}>The full on-demand walkthrough, free and any time.</p><button className="btn btn-light" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => setRewatch(true)}>Watch demo</button></div>
        <div className="card lift" style={{ padding: 22, borderColor: "var(--cyan)" }}><div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--cyan-soft)", display: "grid", placeItems: "center" }}><UserCheck size={20} color="#06776F" /></div><div style={{ fontWeight: 700, fontSize: 16, marginTop: 12 }}>1:1 strategy session</div><p className="muted" style={{ fontSize: 13, marginTop: 6 }}>20 private minutes with a founder (£299) or senior strategist (£149).</p><button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => setView(view === "session" ? "menu" : "session")}>{view === "session" ? "Close" : "Book a session"}</button></div>
        <div className="card lift" style={{ padding: 22 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: "#F3EEFF", display: "grid", placeItems: "center" }}><Users size={20} color="#7C5CFF" /></div><div style={{ fontWeight: 700, fontSize: 16, marginTop: 12 }}>Team workshop</div><p className="muted" style={{ fontSize: 13, marginTop: 6 }}>Live group training for your staff, from £99 per organisation.</p><button className="btn btn-light" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => setView(view === "workshop" ? "menu" : "workshop")}>{view === "workshop" ? "Close" : "Book a workshop"}</button></div>
      </div>
      {view === "session" ? (
        <div className="card" style={{ padding: 22, marginBottom: 18 }}>
          <SectionHead title="Book a 1:1 strategy session" />
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 14 }}>{Object.keys(SESSIONS).map((k) => (<button key={k} onClick={() => setTier(k)} className="card" style={{ padding: 14, textAlign: "left", cursor: "pointer", flex: "1 1 220px", borderColor: tier === k ? "var(--cyan)" : "var(--line)", background: tier === k ? "var(--cyan-soft)" : "#fff" }}><div className="row" style={{ justifyContent: "space-between" }}><span style={{ fontWeight: 700 }}>{SESSIONS[k].who}</span><span style={{ fontWeight: 700 }}>{SESSIONS[k].price}</span></div><div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{SESSIONS[k].note}</div></button>))}</div>
          <div style={capLbl}>Choose a slot</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{slotList.map((sl) => { const full = fullSet.has(sl); return (<button key={sl} disabled={full} onClick={() => setSlot(sl)} className="chip" style={{ cursor: full ? "not-allowed" : "pointer", opacity: full ? .45 : 1, background: slot === sl ? "var(--teal)" : "#EEF1F7", color: slot === sl ? "#fff" : "#5A6783" }}>{sl}{full ? " · full" : ""}</button>); })}</div>
          <div className="row" style={{ gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}><button className="btn btn-primary" onClick={bookSession}>{slot && !fullSet.has(slot) ? "Confirm & pay " + SESSIONS[tier].price : "Join the waiting list"}</button><span className="faint" style={{ fontSize: 12 }}>Founder availability is limited each week.</span></div>
        </div>
      ) : null}
      {view === "workshop" ? (
        <div className="card" style={{ padding: 22, marginBottom: 18 }}>
          <SectionHead title="Book a live team workshop" />
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginBottom: 14 }}>{Object.keys(WORKSHOPS).map((k) => (<button key={k} onClick={() => setWOption(k)} className="card" style={{ padding: 14, textAlign: "left", cursor: "pointer", flex: "1 1 220px", borderColor: wOption === k ? "var(--violet)" : "var(--line)", background: wOption === k ? "#F3EEFF" : "#fff" }}><div className="row" style={{ justifyContent: "space-between" }}><span style={{ fontWeight: 700 }}>{WORKSHOPS[k].label}</span><span style={{ fontWeight: 700 }}>{WORKSHOPS[k].price}</span></div><div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{WORKSHOPS[k].note}</div></button>))}</div>
          <div style={capLbl}>Upcoming dates</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{wDates.map((wd) => (<button key={wd.label} onClick={() => setWDate(wd.label)} className="chip" style={{ cursor: "pointer", background: wDate === wd.label ? "var(--violet)" : "#EEF1F7", color: wDate === wd.label ? "#fff" : "#5A6783" }}>{wd.label} · {wd.places} places</button>))}</div>
          <div className="row" style={{ gap: 12, marginTop: 16 }}><button className="btn btn-primary" onClick={bookWorkshop}>Confirm & pay {WORKSHOPS[wOption].price}</button></div>
        </div>
      ) : null}
      <div className="card" style={{ padding: 22 }}>
        <SectionHead title="Your demos & bookings" />
        {bookings.length ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{bookings.map((b) => (<div key={b.id} className="row" style={{ justifyContent: "space-between", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10 }}><div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{b.type}</div><div className="faint" style={{ fontSize: 11.5 }}>{new Date(b.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div></div><span className={"chip " + (b.status === "Waiting list" ? "chip-med" : "chip-cyan")}>{b.status}</span></div>))}</div> : <p className="muted" style={{ fontSize: 13 }}>No bookings yet. Watch the demo, then book a session or workshop above.</p>}
        <div className="faint" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.5 }}>On confirmation, a calendar invite, confirmation email, video link and reminders are sent automatically. Paid sessions are processed securely by Stripe.</div>
      </div>
      {rewatch ? <div onClick={() => setRewatch(false)} style={{ position: "fixed", inset: 0, background: "rgba(6,14,30,.6)", zIndex: 95, display: "grid", placeItems: "center", padding: 20 }}><div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 820, width: "100%", padding: 0, overflow: "hidden" }}><div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "linear-gradient(135deg, #0A1730, #102A4F)", display: "grid", placeItems: "center" }}>{DEMO_VIDEO_URL ? <iframe src={DEMO_VIDEO_URL} title="Qura demo" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} /> : <div style={{ textAlign: "center", color: "#fff" }}><div style={{ width: 70, height: 70, borderRadius: 999, background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Play size={28} color="#fff" /></div><div className="disp" style={{ fontWeight: 700 }}>On-demand Qura demo</div></div>}</div><div style={{ padding: 14, textAlign: "right" }}><button className="btn btn-light" onClick={() => setRewatch(false)}>Close</button></div></div></div> : null}
    </div>
  );
}

function Accommodation({ onToast, onNav }) {
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [need, setNeed] = useState("");
  const REGIONS = {
    "Europe": ["United Kingdom", "Ireland", "Germany", "Spain"],
    "Africa": ["Nigeria", "Ghana", "Kenya", "South Africa", "Egypt"],
    "Asia & Middle East": ["India", "Philippines", "United Arab Emirates", "Saudi Arabia", "Singapore"],
    "Oceania": ["Australia", "New Zealand"],
    "Americas": ["Canada", "United States", "Brazil"],
  };
  const NEEDS = ["Short-term let near placement", "Long-term rental", "Family relocation home", "Buy or invest", "Hospital-arranged housing query", "Other query"];
  const PARTNERS = {
    "United Kingdom": [{ name: "Qura Verified Homes UK", tier: "Verified partner", areas: "London, Manchester, Birmingham, Leeds", note: "Short and long lets near NHS trusts and diagnostic centres, contracts turned around in days.", premium: false }],
    "Nigeria": [{ name: "Girard Property", tier: "Premium verified partner", areas: "Lagos, Abuja, Port Harcourt", note: "Premium homes and serviced apartments for relocating doctors, managed end to end by a dedicated team.", premium: true }],
  };
  const partners = PARTNERS[country] || [];
  const contact = (p) => { if (onToast) onToast("Your accommodation enquiry has been sent to " + p.name + "."); };
  const cap = { fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--faint)", margin: "18px 0 8px" };
  const chip = (label, on, click) => (<button key={label} onClick={click} className="chip" style={{ padding: "8px 14px", cursor: "pointer", background: on ? "var(--blue)" : "#EEF1F7", color: on ? "#fff" : "#5A6783" }}>{label}</button>);
  return (
    <div>
      <PageHead title="Accommodation" sub="Find verified accommodation partners for your move, wherever in the world you are heading. For most people, accommodation is one of the biggest deciding factors when relocating for work." right={<span className="chip chip-cyan"><ShieldCheck size={12} /> Verified partners</span>} />
      {onNav ? <button onClick={() => onNav("relocation")} className="btn btn-light" style={{ marginBottom: 14 }}>{"←"} Back to relocation</button> : null}
      <div className="card" style={{ padding: 22, marginBottom: 18 }}>
        <div style={{ ...cap, marginTop: 0 }}>1. Continent</div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{Object.keys(REGIONS).map((c) => chip(c, continent === c, () => { setContinent(c); setCountry(""); }))}</div>
        {continent ? <><div style={cap}>2. Country</div><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{REGIONS[continent].map((c) => chip(c, country === c, () => setCountry(c)))}</div></> : null}
        {country ? <><div style={cap}>3. What do you need?</div><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{NEEDS.map((n) => chip(n, need === n, () => setNeed(n)))}</div></> : null}
      </div>
      {country ? (
        partners.length ? (
          <div className="grid-2" style={{ marginBottom: 18 }}>{partners.map((p) => (
            <div key={p.name} className="card lift" style={{ padding: 22, borderColor: p.premium ? "var(--cyan)" : "var(--line)", position: "relative", overflow: "hidden" }}>
              {p.premium ? <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,var(--teal),var(--cyan))" }} /> : null}
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}><div style={{ width: 46, height: 46, borderRadius: 12, background: p.premium ? "var(--cyan-soft)" : "#EEF3FF", display: "grid", placeItems: "center" }}><Building2 size={21} color={p.premium ? "#06776F" : "#1E54E6"} /></div><span className={"chip " + (p.premium ? "chip-cyan" : "chip-grey")}>{p.premium ? <><Star size={11} /> {p.tier}</> : p.tier}</span></div>
              <div style={{ fontWeight: 700, fontSize: 17, marginTop: 12 }}>{p.name}</div>
              <div className="faint row" style={{ gap: 5, fontSize: 12.5, marginTop: 4 }}><MapPin size={12} /> {p.areas}</div>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.55 }}>{p.note}</p>
              <button onClick={() => contact(p)} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}><Send size={14} /> Contact partner</button>
            </div>
          ))}</div>
        ) : (
          <div className="card" style={{ padding: 28, marginBottom: 18, textAlign: "center" }}>
            <Globe size={26} color="#8A97AE" style={{ margin: "0 auto 10px" }} />
            <div style={{ fontWeight: 700, fontSize: 16 }}>No verified partner in {country} yet</div>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6, maxWidth: 460, margin: "6px auto 14px" }}>We are expanding the verified network fast. Register your interest and we will connect you as soon as a partner is live in {country}.</p>
            <button onClick={() => onToast && onToast("Interest registered for " + country + ". We will be in touch.")} className="btn btn-light">Register my interest</button>
          </div>
        )
      ) : null}
      <div className="card" style={{ padding: 22, background: "var(--navy)", color: "#fff", border: "none" }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
          <div style={{ maxWidth: 560 }}><div style={{ fontWeight: 700, fontSize: 16 }}>Are you a real estate company?</div><p style={{ fontSize: 13.5, opacity: .85, marginTop: 6, lineHeight: 1.55 }}>Healthcare relocation means reliable, long-term, high-quality tenants. Become a verified Qura partner and reach clinicians, hospitals and agencies booking accommodation for healthcare projects worldwide.</p></div>
          <button onClick={() => (onNav ? onNav("pricing") : onToast && onToast("Our partnerships team will be in touch about verified partner subscriptions."))} className="btn" style={{ background: "#00C2B8", color: "#04231F", fontWeight: 800, padding: "12px 20px", whiteSpace: "nowrap" }}>Become a verified partner</button>
        </div>
      </div>
    </div>
  );
}

const Placeholder = ({ title }) => (<div><PageHead title={title} sub="This area is part of the prototype scope." /><div className="card" style={{ padding: 48, textAlign: "center" }}><MessageSquare size={28} className="faint" style={{ margin: "0 auto 12px" }} /><div className="muted">Content for {title.toLowerCase()} lives here in the full build.</div></div></div>);

/* ===================== Pulse command center ===================== */
function AiBrief({ name }) {
  const [state, setState] = useState("idle"); const [text, setText] = useState("");
  const fallback = `Marketplace momentum is strong. Pipeline value reached £24.6M, up 28% on last month, led by a 34% surge in Middle East demand. Supply is the constraint to watch: agency coverage in the Gulf is lagging behind open requirements. Twelve NHS framework deadlines close within the week, so prioritise theatre and AHP bids. Clinician sign-ups hit a weekly high, deepening the talent pool for hospitals.`;
  const run = async () => {
    setState("loading"); setText("");
    try {
      const res = await fetch("/api/anthropic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: `You are the marketplace intelligence engine inside ${APP_NAME}, a healthcare growth platform. Write a sharp 4-sentence executive brief for the founder${name ? ", " + name + "," : ""} summarising marketplace health. Use these live figures: pipeline value £24.6M up 28% month on month; 1,248 live opportunities; 8,473 clinicians; 2,140 organisations; matches this month 412; Middle East demand up 34% with agency supply lagging; 12 NHS framework deadlines closing within 7 days; clinician sign-ups at a weekly high. British English, confident and specific, no bullet points, no em dashes, no preamble.` }] }) });
      const data = await res.json(); const t = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      setText(t || fallback);
    } catch (e) { setText(fallback); } setState("done");
  };
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="row" style={{ background: "var(--navy)", padding: "14px 18px", gap: 10 }}><Sparkles size={17} color="#5FE6DC" /><span style={{ color: "#fff", fontWeight: 600, fontSize: 14.5 }} className="disp">{name ? name + "'s daily brief" : "Daily brief"}</span><span className="chip" style={{ marginLeft: "auto", background: "rgba(0,194,184,.16)", color: "#5FE6DC" }}>AI</span></div>
      <div style={{ padding: 18 }}>
        {state === "idle" && <><p className="muted" style={{ marginTop: 0, fontSize: 14 }}>A live, written read on the whole marketplace, in one tap.</p><button className="btn btn-ai" style={{ width: "100%", justifyContent: "center" }} onClick={run}><Sparkles size={16} /> Generate brief</button></>}
        {state === "loading" && <div className="row muted" style={{ gap: 10, fontSize: 14, padding: "10px 0" }}><Loader2 size={17} className="pulse" color="#2D6BFF" /> Reading the marketplace…</div>}
        {state === "done" && <div className="fade"><p style={{ marginTop: 0, fontSize: 14.5, lineHeight: 1.65 }}>{text}</p><button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }} onClick={run}>Refresh</button></div>}
      </div>
    </div>
  );
}
function LiveFeed() {
  const [items, setItems] = useState(() => FEED_POOL.slice(0, 6).map((x, i) => ({ ...x, id: i, ago: (i + 1) * 3 })));
  const idRef = useRef(100);
  useEffect(() => { const iv = setInterval(() => { const pick = FEED_POOL[Math.floor(Math.random() * FEED_POOL.length)]; setItems((prev) => [{ ...pick, id: idRef.current++, ago: 0 }, ...prev.map((p) => ({ ...p, ago: p.ago + 1 }))].slice(0, 7)); }, 3200); return () => clearInterval(iv); }, []);
  return (
    <div className="card" style={{ padding: 18 }}>
      <SectionHead title="Live activity" action={<span className="row" style={{ gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--ok)" }}><span className="live" /> Live</span>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{items.map((it, i) => (<div key={it.id} className={i === 0 ? "feed-in row" : "row"} style={{ gap: 12, padding: "11px 0", borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none" }}><div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: it.c === "ok" ? "var(--ok-bg)" : it.c === "blue" ? "#EEF3FF" : it.c === "violet" ? "var(--violet-soft)" : "var(--cyan-soft)" }}><it.icon size={15} color={it.c === "ok" ? "#0F7A45" : it.c === "blue" ? "#1E54E6" : it.c === "violet" ? "#5B3FD6" : "#06776F"} /></div><div style={{ flex: 1, fontSize: 13.5 }}><b style={{ fontWeight: 600 }}>{it.who}</b> {it.txt}</div><span className="faint" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{it.ago === 0 ? "just now" : `${it.ago}m`}</span></div>))}</div>
    </div>
  );
}
const Balance = () => {
  const sides = [{ l: "Agencies", n: 642, d: "+38", i: Briefcase, c: "#2D6BFF", bg: "#EEF3FF", role: "Supply of business development" }, { l: "Hospitals", n: 1498, d: "+71", i: Building2, c: "#00C2B8", bg: "var(--cyan-soft)", role: "Demand for talent" }, { l: "Clinicians", n: 8473, d: "+204", i: Stethoscope, c: "#7C5CFF", bg: "var(--violet-soft)", role: "Supply of talent" }];
  return (
    <div className="card" style={{ padding: 18 }}>
      <SectionHead title="Three-sided marketplace" action={<span className="chip chip-grey">2,140 organisations</span>} />
      <div className="grid g3">{sides.map((s) => (<div key={s.l} style={{ borderRadius: 13, padding: 16, background: s.bg }}><div className="row" style={{ justifyContent: "space-between" }}><s.i size={20} color={s.c} /><span className="chip" style={{ background: "#fff", color: s.c }}>{s.d} / wk</span></div><div className="disp" style={{ fontSize: 24, fontWeight: 700, marginTop: 10, color: "var(--navy)" }}>{s.n.toLocaleString()}</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{s.l}</div><div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{s.role}</div></div>))}</div>
      <div className="row" style={{ gap: 18, marginTop: 16, flexWrap: "wrap" }}>{[["Fill rate", "87%", "+4pt"], ["Avg time to match", "2.3 days"], ["Matches this month", "412"], ["Take rate", "6.5%"]].map(([l, v, d]) => (<div key={l}><span className="muted" style={{ fontSize: 12.5 }}>{l}</span><div className="disp row" style={{ fontSize: 18, fontWeight: 700, gap: 6 }}>{v}{d && <span className="up" style={{ fontSize: 12 }}>{d}</span>}</div></div>))}</div>
    </div>
  );
};
const CommandCenter = ({ go, name }) => {
  const [period, setPeriod] = useState("30d");
  return (
    <div>
      <IllustrativeBanner />
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div><div className="ph-accent" /><h1 className="disp" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.025em" }}>Marketplace Command Centre (MCC)</h1><div className="muted row" style={{ fontSize: 14.5, marginTop: 8, gap: 8 }}><span className="live" /> Everything happening across {APP_NAME}, live</div></div>
        <div className="row" style={{ gap: 4, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12, padding: 4 }}>{["7d", "30d", "QTD"].map((p) => (<button key={p} onClick={() => setPeriod(p)} style={{ padding: "7px 15px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 9, cursor: "pointer", transition: ".15s", background: period === p ? "var(--blue)" : "#fff", color: period === p ? "#fff" : "var(--navy)", boxShadow: period === p ? "0 1px 3px rgba(45,107,255,.35)" : "var(--sh-xs)" }}>{p}</button>))}</div>
      </div>
      <div className="grid g4 fade" style={{ marginBottom: 16 }}>
        <Kpi label="Marketplace pipeline" prefix="£" suffix="M" value={24.6} decimals={1} delta="28% MoM" icon={Gauge} accent="cyan" />
        <Kpi label="Live opportunities" value={1248} delta="12% MoM" icon={Target} />
        <Kpi label="Clinicians on platform" value={8473} delta="204 this week" icon={Stethoscope} accent="violet" />
        <Kpi label="Matches this month" value={412} delta="19% MoM" icon={Link2} accent="cyan" />
      </div>
      <div className="grid main" style={{ marginBottom: 16, alignItems: "start" }}>
        <div className="grid" style={{ gap: 16 }}>
          <Balance />
          <div className="card" style={{ padding: 18 }}><SectionHead title="Marketplace pipeline value (£M)" action={<span className="chip chip-cyan"><TrendingUp size={12} /> 28% MoM</span>} /><Chart kind="gmv" data={GMV_TREND} height={220} /></div>
          <div className="grid g2">
            <div className="card" style={{ padding: 18 }}><SectionHead title="Pipeline by region (£M)" action={<DemoTag />} />{REGIONS.map((r) => (<div key={r.r} style={{ marginBottom: 12 }}><div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span>{r.r}</span><span style={{ fontWeight: 600 }}>£{r.v}M</span></div><div style={{ height: 7, borderRadius: 6, background: "#EDF1F8" }}><div style={{ height: "100%", borderRadius: 6, width: `${(r.v / 10.3) * 100}%`, background: r.c }} /></div></div>))}</div>
            <div className="card" style={{ padding: 18 }}><SectionHead title="Conversion funnel" action={<DemoTag />} />{FUNNEL.map((f, i) => (<div key={f.s} style={{ marginBottom: 11 }}><div className="row" style={{ justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span>{f.s}</span><span className="muted">{f.n.toLocaleString()} · {f.pct}%</span></div><div style={{ height: 7, borderRadius: 6, background: "#EDF1F8" }}><div style={{ height: "100%", borderRadius: 6, width: `${f.pct}%`, background: i === 4 ? "var(--ok)" : "var(--blue)" }} /></div></div>))}</div>
          </div>
        </div>
        <div className="grid" style={{ gap: 16 }}>
          <AiBrief name={name} /><LiveFeed />
          <div className="card" style={{ padding: 18 }}><SectionHead title="Needs attention" />{ALERTS.map((a, i) => (<div key={i} className="row" style={{ gap: 10, padding: "9px 0", borderBottom: i < ALERTS.length - 1 ? "1px solid var(--line)" : "none" }}><AlertCircle size={16} color={a.c === "red" ? "var(--red)" : a.c === "amber" ? "var(--amber)" : "var(--ok)"} style={{ flexShrink: 0 }} /><span style={{ fontSize: 13.5 }}>{a.txt}</span></div>))}</div>
        </div>
      </div>
      <div className="grid g2">
        <div className="card" style={{ padding: 18 }}><SectionHead title="Top agencies by won value" action={<Trophy size={16} color="#F2A33C" />} />{TOP_AGENCIES.map((a, i) => (<div key={a.n} className="row" style={{ gap: 12, padding: "10px 0", borderBottom: i < TOP_AGENCIES.length - 1 ? "1px solid var(--line)" : "none" }}><span className="disp faint" style={{ fontSize: 14, fontWeight: 700, width: 18 }}>{i + 1}</span><div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }} className="disp">{a.n[0]}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{a.n}</div><div className="faint" style={{ fontSize: 12 }}>{a.w} deals won</div></div><span className="disp" style={{ fontWeight: 700 }}>{a.v}</span></div>))}</div>
        <div className="card" style={{ padding: 18 }}><SectionHead title="Highest-value opportunities" action={<button className="btn btn-ghost" style={{ fontSize: 13, padding: "7px 12px" }} onClick={() => go("opportunities")}>View all <ChevronRight size={14} /></button>} />{TOP_OPPS.map((o, i) => (<div key={o.o} className="row" style={{ gap: 12, padding: "10px 0", borderBottom: i < TOP_OPPS.length - 1 ? "1px solid var(--line)" : "none" }}><div style={{ width: 34, height: 34, borderRadius: 9, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><Building2 size={16} color="#1E54E6" /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{o.o}</div><div className="faint row" style={{ fontSize: 12, gap: 6 }}>{o.r} · <span className="chip chip-grey" style={{ padding: "1px 8px" }}>{o.m}</span></div></div><span className="disp" style={{ fontWeight: 700 }}>{o.v}</span></div>))}</div>
      </div>
    </div>
  );
};

/* ===================== clients / case studies / playbook ===================== */
const ClientsTargets = () => (
  <div>
    <PageHead title="Clients & targets" sub={`${CLIENTS.length} accounts from your register`} />
    <div className="grid-2">{CLIENTS.map((c, i) => (
      <div key={i} className="card row lift" style={{ padding: 18, gap: 14, justifyContent: "space-between" }}>
        <div className="row" style={{ gap: 14 }}><div style={{ width: 44, height: 44, borderRadius: 11, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><Building2 size={20} color="#1E54E6" /></div><div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{c.org}</div><div className="muted" style={{ fontSize: 12.5 }}>{c.spec}</div></div></div>
        <span className={"chip " + (c.status === "Active client" ? "chip-low" : c.status === "Target" ? "chip-blue" : "chip-med")}>{c.status}</span>
      </div>
    ))}</div>
  </div>
);
const CaseStudies = () => (
  <div>
    <PageHead title="Case studies" sub="Proof points you can put in front of any client" />
    {CASE_STUDIES.map((cs, i) => (
      <div key={i} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}>
        <div style={{ background: "var(--navy)", padding: "22px 26px" }}>
          <span className="chip" style={{ background: "rgba(0,194,184,.16)", color: "#5FE6DC" }}>{cs.sector}</span>
          <h2 className="disp" style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "12px 0 0" }}>{cs.title}</h2>
        </div>
        <div style={{ padding: 26 }}>
          <div className="disp" style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", color: "var(--blue)", marginBottom: 6 }}>THE CHALLENGE</div>
          <p style={{ fontSize: 15, marginTop: 0 }}>{cs.challenge}</p>
          <div className="disp" style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", color: "var(--blue)", margin: "18px 0 12px" }}>OUR APPROACH</div>
          <div className="grid g3">{cs.pillars.map((p) => (<div key={p.t} style={{ background: "var(--bg)", borderRadius: 12, padding: 16 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{p.t}</div><div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{p.b}</div></div>))}</div>
          <div className="disp" style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", color: "var(--blue)", margin: "20px 0 10px" }}>MILESTONES</div>
          {cs.milestones.map((m, j) => (<div key={j} className="row" style={{ gap: 14, padding: "10px 0", borderBottom: j < cs.milestones.length - 1 ? "1px solid var(--line)" : "none" }}><span className="chip chip-cyan" style={{ minWidth: 92, justifyContent: "center" }}>{m.m}</span><span style={{ fontSize: 14 }}>{m.o}</span></div>))}
          <div className="card" style={{ marginTop: 20, padding: 18, background: "var(--cyan-soft)", border: "none" }}><div className="row" style={{ gap: 10 }}><Quote size={22} color="#06776F" /><div><p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{cs.quote.q}</p><div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>{cs.quote.by}</div></div></div></div>
        </div>
      </div>
    ))}
  </div>
);
function IncentivePlaybook() {
  const [setup, setSetup] = useState("A new agency with 6 consultants across perm and locum");
  const [state, setState] = useState("idle"); const [text, setText] = useState("");
  const fallback = "Pay commission on gross profit, not headline revenue. Reward self-generated business at the highest rate, for example 3% of GP on permanent and insourcing work that a consultant sources and closes themselves, with a lower 2% on new locum vacancies they bring in. Pay a smaller facilitation rate, around 0.5% of GP, when a consultant assists on business another team owns, so collaboration is rewarded without double counting. For project revenue, split the payout into tranches: an advance against anticipated gross profit once the first invoice is raised, then the balance as the project bills out. Protect the business with clear guardrails: keep the scheme discretionary, pay one month in arrears, and claw back commission on rebates or bad debt.";
  const run = async () => {
    setState("loading"); setText("");
    try {
      const res = await fetch("/api/anthropic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: `You advise founders of healthcare staffing agencies on how to incentivise a sales floor. Draft a clear, generic commission scheme recommendation for this setup: "${setup}". Cover revenue streams (permanent, insourcing, locum, PSL or cascade), how to reward self-generated versus facilitated business, tranche payouts for project revenue, and sensible guardrails (discretionary, paid in arrears, clawback on bad debt). Keep it generic best practice. Do not name or reference any specific company or agency. British English, around 150 words, prose not bullet points, no em dashes, no preamble.` }] }) });
      const data = await res.json(); const t = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      setText(t || fallback);
    } catch (e) { setText(fallback); } setState("done");
  };
  const principles = [
    { i: TrendingUp, t: "Pay on gross profit", b: "Commission on GP, never headline revenue, so margin discipline is built in." },
    { i: Target, t: "Reward self-generated", b: "Pay the top rate on business a consultant sources and closes themselves." },
    { i: GitBranch, t: "Use tranches for projects", b: "Advance against anticipated GP, then the balance as the project bills out." },
    { i: ShieldCheck, t: "Build in guardrails", b: "Keep it discretionary, pay in arrears, and claw back on rebates or bad debt." },
  ];
  return (
    <div>
      <PageHead title="Incentive playbook" sub="Generic best practice for designing a commission scheme that motivates your sales floor" right={<span className="chip chip-cyan"><Sparkles size={13} /> Adviser</span>} />
      <div className="grid g2" style={{ marginBottom: 18 }}>{principles.map((p) => (<div key={p.t} className="card row lift" style={{ padding: 20, gap: 16, alignItems: "flex-start" }}><div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><p.i size={20} color="#1E54E6" /></div><div><div style={{ fontWeight: 600, fontSize: 16 }}>{p.t}</div><div className="muted" style={{ fontSize: 14, marginTop: 3 }}>{p.b}</div></div></div>))}</div>
      <div className="card" style={{ padding: 22 }}>
        <SectionHead title="A worked example structure" action={<span className="faint" style={{ fontSize: 12 }}>illustrative, not specific to any agency</span>} />
        <div className="scrollx" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 460 }}>
            <thead><tr style={{ textAlign: "left", color: "var(--muted)" }}><th style={{ padding: "8px 10px" }}>Revenue stream</th><th style={{ padding: "8px 10px" }}>Self-generated</th><th style={{ padding: "8px 10px" }}>Facilitated</th></tr></thead>
            <tbody>{[["Permanent projects", "3% GP", "—"], ["Insourcing", "3% GP", "—"], ["New locum vacancy", "2% GP", "—"], ["PSL or cascade add", "2% GP", "0.5% GP"]].map((r, i) => (<tr key={i} style={{ borderTop: "1px solid var(--line)" }}>{r.map((c, j) => (<td key={j} style={{ padding: "11px 10px", fontWeight: j === 0 ? 600 : 400 }}>{c}</td>))}</tr>))}</tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 18 }}>
        <div className="row" style={{ background: "var(--navy)", padding: "14px 18px", gap: 10 }}><Sparkles size={17} color="#5FE6DC" /><span style={{ color: "#fff", fontWeight: 600, fontSize: 14.5 }} className="disp">Draft a scheme for your team</span><span className="chip" style={{ marginLeft: "auto", background: "rgba(0,194,184,.16)", color: "#5FE6DC" }}>AI</span></div>
        <div style={{ padding: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Describe your team and revenue mix</label>
          <textarea className="in" style={{ minHeight: 70, resize: "vertical" }} value={setup} onChange={(e) => setSetup(e.target.value)} />
          <button className="btn btn-ai" style={{ marginTop: 12, justifyContent: "center" }} onClick={run} disabled={state === "loading"}>{state === "loading" ? <><Loader2 size={16} className="pulse" /> Drafting</> : <><Sparkles size={16} /> Draft my scheme</>}</button>
          {state === "done" && <div className="fade card" style={{ marginTop: 16, padding: 16, background: "var(--bg)", border: "none" }}><p style={{ fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{text}</p></div>}
        </div>
      </div>
    </div>
  );
}

/* ===================== events / register / why qura ===================== */
function EventsForums() {
  const [reserved, setReserved] = useState({});
  const act = (i, e) => setReserved((p) => ({ ...p, [i]: e.status === "Application" ? "Applied" : "Reserved" }));
  const calLink = (e) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Qura · " + e.title)}&details=${encodeURIComponent(e.spec + " round-table. " + e.date + " at " + e.time + ". Hosted by Qura with " + e.host + ".")}`;
  return (
    <div>
      <PageHead title="Round-table forums" sub="Live, ticketed forums with the most senior stakeholders in UK healthcare, hosted by Qura" right={<span className="chip chip-cyan"><Ticket size={13} /> Members attend free</span>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{EVENTS.map((e, i) => { const st = reserved[i]; return (
        <div key={i} className="card lift" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div className="row" style={{ gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 13, background: "var(--cyan-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><div style={{ textAlign: "center" }}><div className="disp" style={{ fontWeight: 700, fontSize: 17, color: "#06776F", lineHeight: 1 }}>{e.day}</div><div style={{ fontSize: 10, color: "#06776F", fontWeight: 600, marginTop: 2 }}>{e.mon}</div></div></div>
              <div>
                <div className="row" style={{ gap: 9, flexWrap: "wrap" }}><span style={{ fontWeight: 600, fontSize: 15.5 }}>{e.title}</span><span className="chip chip-grey">{e.spec}</span></div>
                <div className="muted row" style={{ fontSize: 13, gap: 14, marginTop: 6, flexWrap: "wrap" }}><span className="row" style={{ gap: 4 }}><CalendarClock size={12} /> {e.date} · {e.time}</span><span className="row" style={{ gap: 4 }}><Users size={12} /> {e.host}</span></div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}><div className="row" style={{ gap: 14 }}><div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, fontSize: 14 }}>{e.price}</div><div className="faint" style={{ fontSize: 12 }}>{e.seats}</div></div><button onClick={() => act(i, e)} disabled={!!st} className={"btn " + (st ? "btn-light" : e.status === "Application" ? "btn-ghost" : "btn-primary")}>{st ? <><BadgeCheck size={14} /> {st}</> : (e.status === "Application" ? "Apply to attend" : "Reserve seat")}</button></div>{st === "Reserved" && <a target="_blank" rel="noreferrer" href={calLink(e)} style={{ fontSize: 12.5, color: "#076B61", fontWeight: 600, textDecoration: "none" }}>+ Add to calendar</a>}</div>
          </div>
        </div>
      ); })}</div>
      <div className="card" style={{ marginTop: 16, padding: 18, background: "var(--cyan-soft)", border: "none", fontSize: 13.5, color: "#0A3B36" }}>Senior stakeholders are shown by role and organisation. Named speakers are confirmed privately with Agency Pro members ahead of each forum.</div>
    </div>
  );
}
function CompanyRegister() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [d, setD] = useState({ name: "", type: "", framework: "", cqc: "", specs: [], sols: [], region: "" });
  const lbl = { fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 };
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const tog = (k, v) => setD((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const steps = ["Company", "Accreditation", "Focus", "Review"];
  const score = Math.min(100, (d.name ? 15 : 0) + (d.type ? 15 : 0) + (d.framework ? 15 : 0) + (d.cqc ? 15 : 0) + Math.min(20, d.specs.length * 4) + Math.min(20, d.sols.length * 7));
  const Pill = ({ k, v, multi }) => { const on = multi ? d[k].includes(v) : d[k] === v; return (<button onClick={() => (multi ? tog(k, v) : set(k, v))} className="chip" style={{ padding: "9px 15px", background: on ? "var(--blue)" : "#EEF1F7", color: on ? "#fff" : "#5A6783" }}>{v}</button>); };
  if (done) return (
    <div>
      <PageHead title="Register your company" sub="A few smart questions so we can qualify and match you accurately" right={<span className="chip chip-cyan"><ClipboardList size={13} /> Smart qualification</span>} />
      <div className="card" style={{ padding: 32, maxWidth: 640, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: "var(--cyan-soft)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><BadgeCheck size={30} color="#06776F" /></div>
        <h2 className="disp" style={{ fontSize: 23, fontWeight: 700 }}>Application received</h2>
        <p className="muted" style={{ fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>Thank you{d.name ? ", " + d.name : ""}. Your qualification fit score is {score} of 100. Our team will review and be in touch. Your reference is QRA-{String(2600 + score)}.</p>
        <button className="btn btn-light" style={{ marginTop: 18 }} onClick={() => { setDone(false); setStep(0); setD({ name: "", type: "", framework: "", cqc: "", specs: [], sols: [], region: "" }); }}>Register another company</button>
      </div>
    </div>
  );
  return (
    <div>
      <PageHead title="Register your company" sub="A few smart questions so we can qualify and match you accurately" right={<span className="chip chip-cyan"><ClipboardList size={13} /> Smart qualification</span>} />
      <div className="row" style={{ gap: 10, marginBottom: 20, flexWrap: "wrap" }}>{steps.map((s, i) => (<div key={s} className="row" style={{ gap: 8 }}><div className="disp" style={{ width: 26, height: 26, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, background: i <= step ? "var(--blue)" : "#EEF1F7", color: i <= step ? "#fff" : "#8A97AE" }}>{i + 1}</div><span style={{ fontSize: 13.5, fontWeight: i === step ? 600 : 400, color: i === step ? "var(--navy)" : "var(--muted)" }}>{s}</span>{i < steps.length - 1 && <span className="faint">›</span>}</div>))}</div>
      <div className="card" style={{ padding: 26, maxWidth: 720 }}>
        {step === 0 && (<div><label style={lbl}>Company name</label><input className="in" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Apex Allied Health" /><label style={{ ...lbl, marginTop: 18 }}>What type of organisation are you?</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{["Recruitment agency", "Insourcing provider", "Mobile unit provider", "Hospital / provider"].map((v) => <Pill key={v} k="type" v={v} />)}</div></div>)}
        {step === 1 && (<div><label style={lbl}>Are you on an NHS framework?</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{["Framework-accredited", "Non-framework"].map((v) => <Pill key={v} k="framework" v={v} />)}</div><label style={{ ...lbl, marginTop: 18 }}>CQC registration</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{["CQC registered", "Non-CQC", "Not applicable"].map((v) => <Pill key={v} k="cqc" v={v} />)}</div><label style={{ ...lbl, marginTop: 18 }}>Primary region</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{["London", "South", "Midlands", "North", "Wales", "International"].map((v) => <Pill key={v} k="region" v={v} />)}</div></div>)}
        {step === 2 && (<div><label style={lbl}>Which specialties can you supply? (select all)</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{SPECIALTIES.map((v) => <Pill key={v} k="specs" v={v} multi />)}</div><label style={{ ...lbl, marginTop: 18 }}>Which solutions do you offer? (select all)</label><div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{SOLUTIONS.map((s) => <Pill key={s.l} k="sols" v={s.l} multi />)}</div></div>)}
        {step === 3 && (<div><div className="row" style={{ gap: 16, alignItems: "center", marginBottom: 16 }}><div style={{ width: 76, height: 76, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--cyan-soft)", flexShrink: 0 }}><div style={{ textAlign: "center" }}><div className="disp" style={{ fontSize: 24, fontWeight: 700, color: "#06776F", lineHeight: 1 }}>{score}</div><div style={{ fontSize: 9, color: "#06776F", fontWeight: 600 }}>FIT SCORE</div></div></div><div><div style={{ fontWeight: 700, fontSize: 17 }}>{d.name || "Your company"}</div><div className="muted" style={{ fontSize: 14 }}>{d.type || "Type not set"} · {d.framework || "framework n/a"} · {d.cqc || "CQC n/a"}</div></div></div><div className="card" style={{ background: "var(--bg)", border: "none", padding: 16 }}><div style={{ fontSize: 13.5 }}><b>Specialties:</b> {d.specs.length ? d.specs.join(", ") : "none selected"}</div><div style={{ fontSize: 13.5, marginTop: 6 }}><b>Solutions:</b> {d.sols.length ? d.sols.join(", ") : "none selected"}</div><div style={{ fontSize: 13.5, marginTop: 6 }}><b>Region:</b> {d.region || "not set"}</div></div></div>)}
        <div className="row" style={{ justifyContent: "space-between", marginTop: 22 }}><button className="btn btn-light" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>{step < 3 ? <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Continue <ArrowRight size={15} /></button> : <button className="btn btn-dark" onClick={() => { try { window.storage?.set("qura_reg_" + Date.now(), JSON.stringify(d)); } catch (err) {} setDone(true); }}><BadgeCheck size={15} /> Submit application</button>}</div>
      </div>
    </div>
  );
}
const WhyQura = () => (
  <div>
    <PageHead title="Why Qura wins" sub="Specialist, live and decision-ready, where generic platforms leave you guessing" />
    <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}>
      <div className="row" style={{ background: "var(--navy)", padding: "16px 22px" }}><span className="disp" style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>Qura vs generic platforms</span></div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 560 }}><thead><tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12.5 }}><th style={{ padding: "12px 20px" }}>What matters</th><th style={{ padding: "12px 20px" }}>Generic platforms</th><th style={{ padding: "12px 20px", color: "#06776F" }}>Qura</th></tr></thead><tbody>{EDGE_ROWS.map((r, i) => (<tr key={i} style={{ borderTop: "1px solid var(--line)" }}><td style={{ padding: "13px 20px", fontWeight: 600 }}>{r.f}</td><td style={{ padding: "13px 20px", color: "var(--muted)" }}>{r.gen}</td><td style={{ padding: "13px 20px", fontWeight: 500 }}>{r.q}</td></tr>))}</tbody></table></div>
    </div>
    <SectionHead title="The best of modern CRM, rebuilt for healthcare" />
    <div className="grid g3" style={{ marginBottom: 18, marginTop: 12 }}>{CRM_BEST.map((c) => (<div key={c.t} className="card lift" style={{ padding: 22 }}><div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center" }}><c.i size={20} color="#1E54E6" /></div><div style={{ fontWeight: 600, fontSize: 16, marginTop: 12 }}>{c.t}</div><div className="muted" style={{ fontSize: 14, marginTop: 4 }}>{c.b}</div></div>))}</div>
    <div className="card" style={{ padding: 22, background: "var(--cyan-soft)", border: "none" }}><div className="row" style={{ gap: 10, marginBottom: 8 }}><Target size={18} color="#06776F" /><span style={{ fontWeight: 700, fontSize: 16, color: "#0A3B36" }}>Where we differ</span></div><p style={{ fontSize: 14.5, margin: 0, color: "#0A3B36", lineHeight: 1.65 }}>Platforms like BIP Solutions, Locums Nest and Flexzio's GR Hospital serve real needs, but agencies often find the data generic and quickly dated. Qura's position is specialist and current: intelligence by modality and trust, named senior contacts, and a clear focus on saving the NHS time and agency spend. Where it makes sense, we would rather collaborate than compete.</p></div>
  </div>
);

/* ===================== phase 2: tariffs / staffing / mobile units / brand ===================== */
function TariffRates() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(TARIFFS);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);
  const custom = rows !== TARIFFS;
  const onFile = (ev) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const lines = String(r.result).split(/\r?\n/).filter((x) => x.trim());
        const out = [];
        lines.forEach((ln, idx) => {
          const c = ln.split(",").map((x) => x.trim());
          if (idx === 0 && /spec/i.test(c[0])) return;
          if (c[0]) out.push({ spec: c[0], session: c[1] || "—", day: c[2] || "—", wli: c[3] || "—", trend: c[4] || "—" });
        });
        if (out.length) { setRows(out); setMsg(`Loaded ${out.length} rows from ${f.name}`); }
        else setMsg("No rows found. Expected columns: specialty, session, day, wli, trend");
      } catch (err) { setMsg("Could not read that file"); }
    };
    r.readAsText(f);
    ev.target.value = "";
  };
  const downloadTemplate = () => { const csv = "specialty,session,day,wli,trend\nSonography,£780,£1420,£62/hr,+4%\nAudiology,£540,£980,£48/hr,+2%\n"; const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "qura-tariff-template.csv"; a.click(); };
  const list = rows.filter((t) => t.spec.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHead title="Insourcing tariff rates" sub={`Indicative monthly rates across all specialties · ${TARIFF_MONTH}`} right={<button className="btn btn-primary" onClick={() => fileRef.current && fileRef.current.click()}><Upload size={15} /> Upload rates</button>} />
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={onFile} />
      {msg && <div className="card" style={{ padding: "11px 15px", marginBottom: 14, background: "var(--cyan-soft)", border: "none", fontSize: 13, color: "#0A3B36" }}>{msg}</div>}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}><div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}><div className="row" style={{ gap: 8, border: "1px solid var(--line)", borderRadius: 999, padding: "0 14px", background: "var(--bg2)", flex: 1, minWidth: 200 }}><Search size={16} className="faint" /><input className="in" style={{ border: "none", boxShadow: "none", padding: "10px 0" }} placeholder="Search specialty" value={q} onChange={(e) => setQ(e.target.value)} /></div>{custom ? <button className="btn btn-light" onClick={() => { setRows(TARIFFS); setMsg(""); }}>Reset to sample</button> : <span className="chip chip-cyan"><CalendarClock size={13} /> {TARIFF_MONTH}</span>}</div></div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 620 }}><thead><tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12.5, background: "var(--bg)" }}><th style={{ padding: "12px 18px" }}>Specialty</th><th style={{ padding: "12px 18px" }}>Insourcing session</th><th style={{ padding: "12px 18px" }}>Day rate</th><th style={{ padding: "12px 18px" }}>WLI hourly</th><th style={{ padding: "12px 18px" }}>MoM</th></tr></thead><tbody>{list.map((t, i) => (<tr key={i} style={{ borderTop: "1px solid var(--line)" }}><td style={{ padding: "13px 18px", fontWeight: 600 }}>{t.spec}</td><td style={{ padding: "13px 18px" }}>{t.session}</td><td style={{ padding: "13px 18px" }}>{t.day}</td><td style={{ padding: "13px 18px" }}>{t.wli}</td><td style={{ padding: "13px 18px" }}><span className="chip chip-low">{t.trend}</span></td></tr>))}</tbody></table></div></div>
      <div className="card" style={{ marginTop: 16, padding: 18 }}><div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}><div style={{ fontSize: 13, color: "var(--muted)", maxWidth: 520, lineHeight: 1.5 }}>Upload a CSV with columns: specialty, session, day, wli, trend. Rates are indicative and refreshed monthly so members can benchmark against the market.</div><button className="btn btn-light" onClick={downloadTemplate}><FileText size={15} /> Download CSV template</button></div></div>
    </div>
  );
}
const StaffingBoard = () => (
  <div>
    <PageHead title="Neighbourhood & CDC staffing" sub="New sites announce roles and shortlist staff, clinical and non-clinical, in one place" right={<button className="btn btn-primary"><Plus size={15} /> Announce a site</button>} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{SITES.map((s, i) => (
      <div key={i} className="card lift" style={{ padding: 20 }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}><div><div className="row" style={{ gap: 9, flexWrap: "wrap" }}><span style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</span><span className="chip chip-grey">{s.type}</span></div><div className="muted row" style={{ fontSize: 13, gap: 12, marginTop: 5, flexWrap: "wrap" }}><span className="row" style={{ gap: 4 }}><MapPin size={12} /> {s.mgr}</span><span className="row" style={{ gap: 4 }}><CalendarClock size={12} /> {s.open}</span></div></div><span className={"chip " + (s.status === "Hiring" ? "chip-low" : s.status === "Shortlisting" ? "chip-cyan" : "chip-grey")}>{s.status}</span></div>
        <div className="grid g2" style={{ gap: 16, marginTop: 16 }}><div><div className="eyebrow" style={{ marginBottom: 8 }}>Clinical roles</div><div className="row" style={{ gap: 7, flexWrap: "wrap" }}>{s.clinical.map((r) => <span key={r} className="chip" style={{ background: "#EEF3FF", color: "#1E54E6" }}><Stethoscope size={12} /> {r}</span>)}</div></div><div><div className="eyebrow" style={{ marginBottom: 8 }}>Non-clinical roles</div><div className="row" style={{ gap: 7, flexWrap: "wrap" }}>{s.nonclinical.map((r) => <span key={r} className="chip chip-grey">{r}</span>)}</div></div></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}><span className="faint" style={{ fontSize: 13 }}>{s.shortlisted} candidates shortlisted</span><button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }}><UserCheck size={14} /> Shortlist staff</button></div>
      </div>
    ))}</div>
  </div>
);
const MobileUnits = () => (
  <div>
    <PageHead title="Mobile unit providers" sub="Private mobile diagnostic providers supplying capacity to the NHS" right={<span className="chip chip-cyan"><Truck size={13} /> Verified providers</span>} />
    <div className="grid-2">{MOBILE_UNITS.map((m, i) => (
      <div key={i} className="card lift" style={{ padding: 18 }}>
        <div className="row" style={{ justifyContent: "space-between" }}><div className="row" style={{ gap: 14 }}><div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><Truck size={20} color="#1E54E6" /></div><div><div style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</div><div className="muted" style={{ fontSize: 13 }}>{m.spec}</div></div></div><span className={"chip " + (m.status === "Verified" ? "chip-low" : "chip-grey")}><BadgeCheck size={12} /> {m.status}</span></div>
        <div className="row" style={{ gap: 12, marginTop: 12, flexWrap: "wrap" }}><span className="faint row" style={{ fontSize: 12.5, gap: 4 }}><MapPin size={12} /> {m.coverage}</span><span className="faint row" style={{ fontSize: 12.5, gap: 4 }}><Building2 size={12} /> {m.clients}</span></div>
        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 14, padding: "9px" }}><Link2 size={14} /> Connect</button>
      </div>
    ))}</div>
  </div>
);
const BrandShowcase = () => (
  <div>
    <PageHead title="Qura everywhere" sub="One identity across every channel: Connect. Engage. Win." />
    <div className="grid g3">{CHANNELS.map((ch, i) => (
      <div key={i} className="card lift" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "var(--navy)", padding: "22px 20px", minHeight: 124, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div className="row" style={{ justifyContent: "space-between" }}><Wordmark light /><ch.i size={20} color="#fff" /></div><div className="disp" style={{ color: "#5FE6DC", fontSize: 13, fontWeight: 600, marginTop: 18 }}>Connect. Engage. Win.</div></div>
        <div className="row" style={{ justifyContent: "space-between", padding: "14px 18px" }}><div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{ch.k}</div><div className="faint" style={{ fontSize: 12.5 }}>{ch.h}</div></div><span className="chip chip-grey">Brand kit</span></div>
      </div>
    ))}</div>
    <div className="card" style={{ marginTop: 18, padding: 22 }}><SectionHead title="Brand essentials" /><div className="row" style={{ gap: 24, flexWrap: "wrap", marginTop: 10 }}><div><div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>LOGO</div><div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}><Wordmark /></div></div><div><div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>PALETTE</div><div className="row" style={{ gap: 8 }}>{["var(--navy)", "#2BB6A8", "#1FA0A6", "#178FB0", "var(--blue)"].map((c) => <div key={c} style={{ width: 40, height: 40, borderRadius: 9, background: c, border: "1px solid var(--line)" }} />)}</div></div><div><div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>TAGLINE</div><div className="disp" style={{ fontSize: 19, fontWeight: 700, paddingTop: 4 }}>Connect. Engage. Win.</div></div></div></div>
  </div>
);

/* ===================== landing ===================== */


function CountUp({ v, dur = 1200 }) {
  const ref = useRef(null);
  const [disp, setDisp] = useState(String(v));
  useEffect(() => {
    const str = String(v);
    const m = str.match(/^([^0-9]*)([0-9][0-9,\.]*)(.*)$/);
    if (!m) { setDisp(str); return; }
    const pre = m[1], suf = m[3];
    const target = parseFloat(m[2].replace(/,/g, ""));
    if (!isFinite(target)) { setDisp(str); return; }
    let started = false;
    const run = () => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisp(pre + Math.round(target * eased).toLocaleString() + suf);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { run(); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !started) { started = true; run(); io.disconnect(); } }), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [v]);
  return <span ref={ref}>{disp}</span>;
}

const CONFERENCE = {
  tag: "NHS Confederation · NHS Providers · London · Feb 2026",
  title: "Care Closer to Home Conference 2026",
  body: "Ola recently joined system leaders at the NHS Confederation and NHS Providers Care Closer to Home Conference 2026 in London, exploring how neighbourhood health models move from ambition to real delivery.",
  takeaway: "The ambition to move care closer to communities is widely supported. The hard part is implementation: the workforce, the data and the delivery. That is the gap Qura is built to close.",
};


 // set your launch date and time; countdown hides automatically after it passes



function ScreenGallery({ onBack }) {
  const SCREENS = [
    { s: "dashboard", l: "Dashboard", d: "Your pipeline, matches and momentum at a glance the moment you sign in." },
    { s: "livefeed", l: "Live feed", d: "Roles, insourcing projects and tenders across every market, updating around the clock." },
    { s: "marketmap", l: "Market map", d: "The market mapped for you automatically, instead of hours of manual research." },
    { s: "publicintel", l: "Public sector intel", d: "ICB and trust board papers read and summarised for you, every day." },
    { s: "aiassistant", l: "AI assistant", d: "Outreach and answers drafted in your own tone of voice, in seconds." },
    { s: "cliniciannetwork", l: "Clinician network", d: "Registered clinicians, filtered by country, sector and experience." },
    { s: "talentpipeline", l: "Talent pipeline", d: "Advertise available candidates anonymously, and let hospitals come to you." },
    { s: "weeklyreport", l: "Weekly report", d: "A board-ready activity report, written for you and emailed each week." },
    { s: "analytics", l: "Analytics", d: "What is working, what is not, and where the next win is coming from." },
    { s: "accommodation", l: "Accommodation", d: "Verified relocation and housing partners, country by country, worldwide." },
  ];
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all(SCREENS.map((sc) => new Promise((res) => { const im = new Image(); im.onload = res; im.onerror = res; im.src = "/screens/" + sc.s + ".jpg"; })))
      .then(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SCREENS.length), 4000);
    return () => clearInterval(t);
  }, []);
  const cur = SCREENS[i];
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div className="row" style={{ gap: 12, alignItems: "baseline", flexWrap: "wrap" }}><span className="eyebrow" style={{ color: "#06776F" }}>Inside the platform</span><h2 className="disp" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Every page, built to save you hours</h2></div>
        <span className="faint" style={{ fontSize: 12 }}>Real screens from {APP_NAME}, playing automatically</span>
      </div>
      <div className="shot-tabs" style={{ marginBottom: 12 }}>{SCREENS.map((sc, n) => (<button key={sc.s} onClick={() => setI(n)} className={"shot-thumb" + (n === i ? " on" : "")}>{sc.l}</button>))}</div>
      <Reveal>
        <div className="shot-wrap">
          {SCREENS.map((sc, n) => (<img key={sc.s} className={n === i ? "on" : ""} src={"/screens/" + sc.s + ".jpg"} alt={sc.l + " screen in " + APP_NAME} decoding="async" fetchPriority={n === 0 ? "high" : "low"} />))}
          {!ready ? <div className="shot-loading"><Loader2 size={18} className="spin" /> Loading screens...</div> : null}
        </div>
        <div className="row" style={{ gap: 6, marginTop: 12 }}>{SCREENS.map((sc, n) => (<span key={sc.s} onClick={() => setI(n)} style={{ cursor: "pointer", height: 4, flex: 1, borderRadius: 99, background: n === i ? "var(--teal)" : "var(--line)", transition: "background .25s" }} />))}</div>
        <div className="row" style={{ justifyContent: "space-between", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
          <div><div style={{ fontWeight: 700, fontSize: 16 }}>{cur.l}</div><div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>{cur.d}</div></div>
          {onBack ? <button className="btn btn-light" onClick={onBack}>{"←"} Back to how it works</button> : null}
        </div>
      </Reveal>
    </div>
  );
}

function SnapFrame({ title, children }) {
  return (
    <div className="snap">
      <div className="snap-bar"><span className="snap-dot" style={{ background: "#FF5F57" }} /><span className="snap-dot" style={{ background: "#FEBC2E" }} /><span className="snap-dot" style={{ background: "#28C840" }} /><span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,.5)" }}>{title}</span></div>
      <div className="snap-body">{children}</div>
    </div>
  );
}

function HowItWorks({ section = "walk", go }) {
  const [lens, setLens] = useState("supplier");
  const [step, setStep] = useState(0);
  const row = (icon, main, sub, pill) => (
    <div className="snap-row"><div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(45,107,255,.22)", display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</div><div style={{ minWidth: 0, flex: 1 }}><div style={{ color: "#fff", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{main}</div><div style={{ color: "rgba(255,255,255,.52)", fontSize: 11 }}>{sub}</div></div>{pill ? <span className="snap-pill">{pill}</span> : null}</div>
  );
  const LENSES = {
    supplier: {
      label: "Workforce suppliers", icon: Briefcase,
      steps: [
        { t: "See live demand, the moment it appears", d: "Roles, insourcing projects and tenders across the NHS, private and international markets, updating around the clock.", snap: "Live opportunities", body: (<><div className="snap-input"><Search size={13} /> Sonographer, insourcing, South East</div>{row(<Radar size={15} color="#7FA9FF" />, "Community Diagnostic Centre, insourcing", "NHS trust · closes in 6 days", "94% fit")}{row(<Stethoscope size={15} color="#7FA9FF" />, "Sonographer, 12-month contract", "Private provider · London", "New")}{row(<FileText size={15} color="#7FA9FF" />, "Imaging tender, regional", "ICB · 3 trusts", "Tender")}<div className="snap-note">Mapped for you automatically. No manual searching.</div></>) },
        { t: "Reach the decision-maker, not the switchboard", d: "Named decision-makers across the organisations that matter, researched from public business sources, with details masked until you reveal them.", snap: "Decision-makers", body: (<>{row(<Users size={15} color="#7FA9FF" />, "Director of Operations", "NHS trust · public source", "Researched")}{row(<Users size={15} color="#7FA9FF" />, "Head of Imaging", "Diagnostic centre · public source", "Researched")}{row(<Users size={15} color="#7FA9FF" />, "Workforce Lead", "ICB · public source", "Researched")}<div className="snap-note">Compliant reach, credit-controlled so every message is considered.</div></>) },
        { t: "Let AI do the drafting", d: "Outreach written in your voice, informed by the opportunity and the organisation, ready to send in seconds.", snap: "AI outreach", body: (<><div style={{ padding: 13, borderRadius: 11, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}><div style={{ color: "rgba(255,255,255,.5)", fontSize: 11, marginBottom: 7 }}>Drafting...</div><div style={{ color: "#DCE6F7", fontSize: 12, lineHeight: 1.65 }}>Following the CDC expansion announced this month, we have sonographers available from 14 July who have delivered insourcing across three trusts in your region.</div></div><div className="row" style={{ gap: 7, marginTop: 11 }}><span className="snap-pill">Your tone of voice</span><span className="snap-pill">Ready to send</span></div><div className="snap-note">Hours of writing, done in seconds.</div></>) },
        { t: "Win the work", d: "Meetings booked, pipeline tracked, and a board-ready report generated for you every week.", snap: "Pipeline", body: (<>{row(<CalendarClock size={15} color="#7FA9FF" />, "Intro call confirmed", "Director of Operations · Thu 10:00", "Booked")}{row(<TrendingUp size={15} color="#7FA9FF" />, "Pipeline value", "£24.6M · up 28% this month", "Live")}{row(<BarChart3 size={15} color="#7FA9FF" />, "Weekly board report", "Generated automatically", "Sent")}<div className="snap-note">Win work in the time others spend searching.</div></>) },
      ],
    },
    hospital: {
      label: "Hospitals & providers", icon: Building2,
      steps: [
        { t: "Search pre-vetted clinicians", d: "Every clinician on Qura is qualified, checked and employable straight away, filtered by country, sector and experience.", snap: "Candidate search", body: (<><div className="snap-input"><Search size={13} /> Radiographer, MRI, 5+ years</div>{row(<Stethoscope size={15} color="#7FA9FF" />, "Radiographer (MRI) · 10 yrs", "NHS & private · available now", "Vetted")}{row(<Stethoscope size={15} color="#7FA9FF" />, "Sonographer (MSK) · 6 yrs", "Both · from 1 Sep", "Vetted")}{row(<Stethoscope size={15} color="#7FA9FF" />, "Echocardiographer · 11 yrs", "Both · immediate", "Vetted")}<div className="snap-note">Qura has done the vetting, so you do not have to.</div></>) },
        { t: "Browse available talent", d: "Anonymised pipelines advertised by workforce suppliers, so you can engage the moment you see a match.", snap: "Available talent", body: (<>{row(<Users size={15} color="#7FA9FF" />, "ICU Nurse · 7 yrs", "Available from 1 Oct", "Introduce")}{row(<Users size={15} color="#7FA9FF" />, "Biomedical Scientist · 9 yrs", "Available from 21 Jul", "Introduce")}<div className="snap-note">Names stay private until the supplier approves the introduction.</div></>) },
        { t: "Find trusted partners", d: "Verified workforce suppliers with ratings and track record, so you can request an introduction in a click.", snap: "Suppliers", body: (<>{row(<Award size={15} color="#7FA9FF" />, "Insourcing partner", "4.9 · 18 reviews · imaging", "Verified")}{row(<Award size={15} color="#7FA9FF" />, "International recruitment", "4.8 · compliant pipelines", "Verified")}<div className="snap-note">Find trusted partners in minutes.</div></>) },
      ],
    },
    medsupplier: {
      label: "Medical suppliers", icon: Package,
      steps: [
        { t: "Know the moment a service opens", d: "New diagnostic centres, service expansions and capital projects, surfaced from public sector intelligence the day they appear.", snap: "Live signals", body: (<><div className="snap-input"><Radar size={13} /> Imaging capacity, England, last 30 days</div>{row(<Building2 size={15} color="#7FA9FF" />, "New Community Diagnostic Centre", "ICB · board paper approved", "New")}{row(<Truck size={15} color="#7FA9FF" />, "Mobile MRI capacity expansion", "NHS trust · procurement opening", "Signal")}{row(<TrendingUp size={15} color="#7FA9FF" />, "Endoscopy backlog programme", "Regional · 3 trusts", "Live")}<div className="snap-note">Board papers and procurement records, read for you daily.</div></>) },
        { t: "Reach the buyer behind the budget", d: "The named, verified decision-makers responsible for the service, not a general enquiries inbox.", snap: "Buyers", body: (<>{row(<Users size={15} color="#7FA9FF" />, "Director of Strategy", "ICB · public source", "Researched")}{row(<Users size={15} color="#7FA9FF" />, "Head of Procurement", "NHS trust · public source", "Researched")}{row(<Users size={15} color="#7FA9FF" />, "Clinical Director, Imaging", "Diagnostic centre", "Researched")}<div className="snap-note">Reach the right buyer at exactly the right moment.</div></>) },
        { t: "Respond while it still matters", d: "Draft, send and book, before the tender is written and the decision is already made.", snap: "Response", body: (<>{row(<Send size={15} color="#7FA9FF" />, "Capability summary sent", "Head of Procurement · today", "Sent")}{row(<CalendarClock size={15} color="#7FA9FF" />, "Discovery call booked", "Tue 11:00 · video", "Booked")}{row(<FileText size={15} color="#7FA9FF" />, "Tender opens in 21 days", "You are already in the room", "Ahead")}<div className="snap-note">Most suppliers find out when the tender publishes. You already knew.</div></>) },
      ],
    },
    gpcare: {
      label: "GP & care", icon: Heart,
      steps: [
        { t: "Fill sessions and shifts faster", d: "Available GPs, nurses and carers near you, with compliance and availability visible up front.", snap: "Find cover", body: (<><div className="snap-input"><Search size={13} /> Salaried GP, 4 sessions, this month</div>{row(<Stethoscope size={15} color="#7FA9FF" />, "Salaried GP · 8 yrs", "Available Mon, Tue, Thu", "Vetted")}{row(<Heart size={15} color="#7FA9FF" />, "Senior carer · 6 yrs", "Immediate · complex care", "Vetted")}{row(<Users size={15} color="#7FA9FF" />, "Practice nurse · 11 yrs", "From 1 Aug", "Vetted")}<div className="snap-note">Every profile pre-vetted, so you can book with confidence.</div></>) },
        { t: "Stay ahead of your ICB", d: "Local commissioning intelligence, funding and service changes that affect your practice or service, summarised daily.", snap: "ICB intelligence", body: (<>{row(<Network size={15} color="#7FA9FF" />, "Enhanced services update", "Your ICB · published today", "New")}{row(<FileText size={15} color="#7FA9FF" />, "Funding allocation change", "Primary care network", "Summary")}<div className="snap-note">The papers, read and summarised for you.</div></>) },
        { t: "Grow beyond your list", d: "Insourcing, community projects and partnership opportunities open to primary and social care providers.", snap: "Opportunities", body: (<>{row(<Radar size={15} color="#7FA9FF" />, "Community diagnostics partner", "ICB · expressions of interest", "Open")}{row(<Award size={15} color="#7FA9FF" />, "Complex care package", "Local authority · tender", "Open")}<div className="snap-note">The work that never reaches a job board.</div></>) },
      ],
    },
    clinician: {
      label: "Clinicians", icon: Stethoscope,
      steps: [
        { t: "Get verified once", d: "Complete your profile with registration, experience and CV. Incomplete profiles cannot join, which is what makes the network trusted.", snap: "Get verified", body: (<>{row(<ShieldCheck size={15} color="#7FA9FF" />, "Registration verified", "GMC / NMC / HCPC", "Checked")}{row(<FileText size={15} color="#7FA9FF" />, "CV uploaded", "Stored securely", "Done")}{row(<BadgeCheck size={15} color="#7FA9FF" />, "Profile complete", "You are now verified on Qura", "Verified")}<div className="snap-note">One vetted profile, trusted everywhere.</div></>) },
        { t: "Be seen everywhere", d: "Hospital decision-makers and workforce suppliers around the world check Qura daily. Your profile is in front of them.", snap: "Your visibility", body: (<>{row(<Globe size={15} color="#7FA9FF" />, "Profile views this week", "Hospitals in 4 countries", "+38%")}{row(<Target size={15} color="#7FA9FF" />, "Matched roles", "12 new matches for you", "Live")}<div className="snap-note">Get verified once. Be seen everywhere.</div></>) },
        { t: "Engage live projects", d: "See a project that matches your experience? Express interest directly, rather than waiting to be found.", snap: "Live projects", body: (<>{row(<Radar size={15} color="#7FA9FF" />, "Insourcing project, imaging", "Interest sent", "Applied")}{row(<CalendarClock size={15} color="#7FA9FF" />, "Interview booked", "Thu 14:00 · video", "Confirmed")}<div className="snap-note">Discover opportunities around the world.</div></>) },
      ],
    },
  };
  const L = LENSES[lens];
  const S = L.steps[Math.min(step, L.steps.length - 1)];
  return (
    <div className="sec how" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div className="wrap" style={{ padding: section === "gallery" ? "22px 24px 40px" : "68px 24px" }}>
        {section === "walk" ? (<>
        <Reveal><div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 30px" }}><div className="eyebrow">How it works</div><h2 className="disp" style={{ fontSize: 36, fontWeight: 700, margin: "8px 0 10px" }}>See {APP_NAME} through your lens</h2><p className="muted" style={{ fontSize: 16, lineHeight: 1.6, marginTop: 0 }}>Pick who you are, then step through what would take hours by hand and takes seconds here.</p></div></Reveal>
        <div className="row" style={{ gap: 9, justifyContent: "center", flexWrap: "wrap", marginBottom: 26 }}>{Object.keys(LENSES).map((k) => { const I = LENSES[k].icon; return (<button key={k} onClick={() => { setLens(k); setStep(0); }} className="btn lift" style={{ padding: "10px 18px", background: lens === k ? "var(--navy)" : "#fff", color: lens === k ? "#fff" : "var(--navy)", border: "1px solid " + (lens === k ? "var(--navy)" : "var(--line)"), fontWeight: 600 }}><I size={15} /> {LENSES[k].label}</button>); })}</div>
        <div className="grid g2" style={{ gap: 26, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {L.steps.map((st, i) => (
              <button key={st.t} onClick={() => setStep(i)} className={"step-btn" + (i === step ? " on" : "")}>
                <span className="step-num">{i + 1}</span>
                <span style={{ minWidth: 0 }}><span style={{ display: "block", fontWeight: 700, fontSize: 15 }}>{st.t}</span><span className="muted" style={{ display: "block", fontSize: 13, marginTop: 3, lineHeight: 1.55 }}>{st.d}</span></span>
              </button>
            ))}
            <div className="row" style={{ gap: 8, marginTop: 4 }}>{L.steps.map((_, i) => (<span key={i} onClick={() => setStep(i)} style={{ cursor: "pointer", height: 4, flex: 1, borderRadius: 99, background: i === step ? "var(--teal)" : "var(--line)", transition: "background .2s" }} />))}</div>
          </div>
          <SnapFrame key={lens + step} title={"qurahealth.org · " + S.snap}>{S.body}</SnapFrame>
        </div>
        <div className="row" style={{ justifyContent: "center", marginTop: 34 }}><button onClick={() => { if (go) go("gallery"); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }} className="btn btn-light">See inside the platform <ArrowRight size={15} /></button></div>
        </>) : <ScreenGallery onBack={() => { if (go) go("walk"); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }} />}
      </div>
    </div>
  );
}


/* ===== Clinician-facing section: tag lines + country eligibility (drives clinician sign-ups) ===== */









/* ===== Supplier-facing app-download section (drives mobile app installs) ===== */
const SUPPLIER_TAGLINES = [
  { h: "Your whole pipeline in your pocket", b: "Track candidates and BD opportunities worldwide, in real time, from your phone. No desk required." },
  { h: "Never out of touch", b: "Being out of office doesn't mean being out of reach. Stay connected to clients and clinicians 24/7." },
  { h: "Connect the moment it counts", b: "Reach clinicians instantly, during clinic hours or after. BD isn't limited to 9 to 5." },
  { h: "Nothing slips through", b: "Emails vanish in clinician inboxes daily. Your AI assistant on Qura replies at any hour, so no opportunity is lost." },
];

// Store badge links — replace with the real store URLs once the app is published.
// Store links. Leave these as empty strings until each listing is actually live.
// While empty, the badges render as "coming soon" and are not clickable, so the
// site never points anyone at a dead link.
// Google Play, paste in once the listing is published:
//   https://play.google.com/store/apps/details?id=org.qurahealth.app
// App Store, paste in once the app exists in App Store Connect (the numeric id
// is issued then):
//   https://apps.apple.com/gb/app/qura/id0000000000








function SupplierAppSection() {
  return (
    <div id="suppliers-app" className="sec suppliers-app" style={{ background: "linear-gradient(160deg,#0A1A30,#13243F)", color: "#fff", padding: "84px 24px" }}>
      <div className="wrap">
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 26px" }}>
          <span className="chip chip-cyan" style={{ background: "rgba(0,194,184,.15)", color: "var(--cyan)" }}>For workforce suppliers</span>
          <h2 className="disp" style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, margin: "16px 0 10px", lineHeight: 1.1 }}>Your pipeline, in your pocket.</h2>
          <p style={{ color: "#AEBED6", fontSize: 16, lineHeight: 1.6 }}>Being out of office doesn't mean being out of touch. Run your business development from your phone, wherever you are.</p>
        </div>
        <div style={{ display: "grid", gap: 12, maxWidth: 860, margin: "0 auto 30px", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
          {SUPPLIER_TAGLINES.map((t, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, padding: "18px 20px", textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 6 }}>{t.h}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "#C4D0E2" }}>{t.b}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <StoreBadges />
          <div style={{ fontSize: 12, color: "#8697B0", marginTop: 14 }}>Coming to iOS and Android.</div>
        </div>
      </div>
    </div>
  );
}

// Top navigation. Five groups instead of nine flat links, so the row stops
// crowding. A value of "how:walk" means view "how" with section "walk".
const NAV = [
  { k: "home", l: "Home" },
  // Platform first: it is the larger thing, and the app sits inside it.
  { k: "platform", l: "Platform", items: [
    ["How it works", "how:walk", "Step through Qura by lens"],
    ["Inside the platform", "how:gallery", "Real screens, page by page"],
    ["Marketplace", "market", "The live marketplace, every market"],
    ["Solutions", "solutions", "What Qura solves, by organisation"],
  ] },
  // Named for the app specifically. "Who it's for" read as though it described
  // the whole platform, when what sits under it is the two app audiences.
  { k: "who", l: "Qura App", items: [
    ["For clinicians", "clinicians", "The app, your career, your applications"],
    ["For suppliers", "suppliers-app", "Live demand, talent and introductions"],
  ] },
  { k: "fragile", l: "Fragile professions" },
  { k: "pricing", l: "Pricing" },
  { k: "story", l: "Our story" },
];

// Footer links, mirroring the top navigation so the two never drift apart.
// One centred row, wrapping on narrow screens.
const FOOTER_LINKS = [
  ["How it works", "how:walk"],
  ["Inside the platform", "how:gallery"],
  ["Marketplace", "market"],
  ["Solutions", "solutions"],
  ["For clinicians", "clinicians"],
  ["For suppliers", "suppliers-app"],
  ["Fragile professions", "fragile"],
  ["Pricing", "pricing"],
  ["Our story", "story"],
];


// ---- URL routing for the public site -------------------------------------
// Each marketing view gets a real address, so pages can be linked, shared and
// bookmarked, and the browser back button behaves. The rendering itself is
// unchanged: the sections are still shown and hidden the same way. This only
// keeps the address bar and the view in step with each other.
const ROUTES = [
  ["/", "home"],
  ["/for-clinicians", "clinicians"],
  ["/for-suppliers", "suppliers-app"],
  ["/marketplace", "market"],
  ["/how-it-works", "how", "walk"],
  ["/inside-the-platform", "how", "gallery"],
  ["/solutions", "solutions"],
  ["/fragile-professions", "fragile"],
  ["/pricing", "pricing"],
  ["/our-story", "story"],
];
const PAGE_TITLES = {
  home: "Qura, the 24/7 live healthcare marketplace and growth CRM",
  clinicians: "For clinicians, Qura",
  "suppliers-app": "For workforce suppliers, Qura",
  market: "Marketplace, Qura",
  how: "How Qura works",
  solutions: "Solutions, Qura",
  fragile: "Fragile professions, Qura",
  pricing: "Pricing, Qura",
  story: "Our story, Qura",
};
function pathFor(view, howSec) {
  const hit = ROUTES.find((r) => r[1] === view && (!r[2] || r[2] === howSec));
  return hit ? hit[0] : "/";
}
function routeFromPath(path) {
  const hit = ROUTES.find((r) => r[0] === path.replace(/\/+$/, "") || (path === "/" && r[0] === "/"));
  return hit ? { view: hit[1], howSec: hit[2] || null } : null;
}

function Landing({ onEnter, onDemo }) {
  const initial = (typeof window !== "undefined" && routeFromPath(window.location.pathname)) || null;
  const [view, setView] = useState(initial ? initial.view : "home");
  const [howSec, setHowSec] = useState(initial && initial.howSec ? initial.howSec : "walk");
  const [navMenu, setNavMenu] = useState(null);
  const navRef = useRef(null);
  // One handler for every internal link, top nav and footer alike.
  // "how:walk" means view "how", section "walk".
  const goTo = (mv) => {
    const tv = mv.split(":")[0], ts = mv.split(":")[1];
    setView(tv);
    if (ts) setHowSec(ts);
    setNavMenu(null);
    if (typeof window !== "undefined") {
      const next = pathFor(tv, ts || howSec);
      if (window.location.pathname !== next) window.history.pushState({}, "", next);
      window.scrollTo({ top: 0 });
    }
  };

  // Back and forward buttons.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => {
      const r = routeFromPath(window.location.pathname);
      if (r) { setView(r.view); if (r.howSec) setHowSec(r.howSec); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Page title follows the view, so tabs, bookmarks and shared links read properly.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = PAGE_TITLES[view] || PAGE_TITLES.home;
  }, [view]);

  // Analytics starts only if this visitor has already agreed. Page views are
  // counted from here so the recorded address matches the tidy one.
  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => {
    trackPage(pathFor(view, howSec), PAGE_TITLES[view] || PAGE_TITLES.home);
  }, [view, howSec]);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        document.querySelectorAll(".lb .rv").forEach((el) => {
          if (el.offsetParent !== null) el.classList.add("in");
        });
      } catch (e) {}
    }, 60);
    return () => clearTimeout(t);
  }, [view, howSec]);
  useEffect(() => {
    if (!navMenu) return;
    const onDoc = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setNavMenu(null); };
    const onKey = (e) => { if (e.key === "Escape") setNavMenu(null); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [navMenu]);
  const [policy, setPolicy] = useState(null);
  const [lens, setLens] = useState("global");
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 2600); return () => clearInterval(id); }, []);
  const LENSES = [{ k: "global", l: "Global" }, { k: "uk", l: "UK & Ireland" }, { k: "anz", l: "Australia & NZ" }, { k: "me", l: "Middle East" }, { k: "intl", l: "International" }];
  const SVC_C = { Vacancy: "#1E54E6", Insourcing: "#0E8C7E", Intelligence: "#00A79D", Candidate: "#5B3FD6" };
  const TEASER = [
    { region: "uk", role: "Consultant Sonographer", org: "Central Manchester NHS Trust", loc: "Manchester", ago: "4m", svc: "Vacancy" },
    { region: "uk", role: "Fertility Sonographer", org: "Boutique clinic, Harley Street", loc: "London W1", ago: "11m", svc: "Vacancy" },
    { region: "uk", role: "Salaried GP (4 sessions)", org: "GP Federation", loc: "Birmingham", ago: "17m", svc: "Vacancy" },
    { region: "uk", role: "Complex Care Nurse (paediatric)", org: "Complex care provider", loc: "Leeds", ago: "22m", svc: "Vacancy" },
    { region: "uk", role: "Weekend endoscopy insourcing", org: "Community Diagnostic Centre", loc: "London", ago: "3m", svc: "Insourcing" },
    { region: "uk", role: "Board papers summarised for you", org: "North Central London ICB", loc: "London", ago: "just now", svc: "Intelligence" },
    { region: "anz", role: "Sonographer (obstetric)", org: "Imaging group", loc: "Sydney, South West", ago: "6m", svc: "Vacancy" },
    { region: "anz", role: "Radiographer (CT)", org: "Regional health service", loc: "Auckland, NZ", ago: "14m", svc: "Vacancy" },
    { region: "anz", role: "Cardiac Sonographer", org: "Private imaging network", loc: "Melbourne", ago: "19m", svc: "Vacancy" },
    { region: "me", role: "Radiographer (MRI)", org: "Hospital group", loc: "Doha", ago: "9m", svc: "Vacancy" },
    { region: "me", role: "Theatre Nurse", org: "Private hospital", loc: "Dubai", ago: "27m", svc: "Vacancy" },
    { region: "intl", role: "Sonographer", org: "Diagnostics provider", loc: "Lagos", ago: "21m", svc: "Vacancy" },
    { region: "intl", role: "Available now: Band 7 Sonographer", org: "Verified candidate", loc: "relocating, EU", ago: "8m", svc: "Candidate" },
  ];
  const feed = lens === "global" ? TEASER : TEASER.filter((x) => x.region === lens);
  const shown = feed.length ? Array.from({ length: Math.min(4, feed.length) }, (_, i) => feed[(tick + i) % feed.length]) : [];
  const stats = [{ n: "32+", l: "Combined years in healthcare" }, { n: "13,000+", l: "Combined LinkedIn following" }, { n: "208", l: "Decision-maker contacts" }, { n: "50+", l: "Countries reached" }];
  const edge = [
    { i: Brain, t: "A decade of real deals, encoded", b: "Qura's analytics are shaped by 10 years of contracts our experts have actually closed, so every score reflects how the market really behaves.", c: "#5B3FD6", bg: "var(--violet-soft)" },
    { i: Zap, t: "AI that works the way experts work", b: "The platform scans thousands of opportunities, scores fit and drafts proposals in seconds, following the playbook that built a multi-million-pound pipeline.", c: "#06776F", bg: "var(--cyan-soft)" },
    { i: Target, t: "Insight you can act on today", b: "Every recommendation comes with a next step: the decision-maker to call, the proposal to send, the deadline to beat.", c: "#1E54E6", bg: "#EEF3FF" },
  ];
  const why = [
    { i: Network, t: "The strongest network in the sector", b: "Direct access to verified decision-makers across NHS Trusts, ICBs, Community Diagnostic Centres and private hospital groups." },
    { i: Sparkles, t: "AI proposals in seconds", b: "Turn any opportunity into a branded, send-ready proposal that reads like it took a day to write." },
    { i: TrendingUp, t: "Live market intelligence", b: "Real-time signals on tenders, frameworks and leadership moves before your competitors see them." },
    { i: Globe, t: "Built for every market", b: "One live platform across the NHS, private healthcare and international markets, from London to Sydney to Lagos to Doha, 24/7." },
  ];
  const trusted = ["NHS trusts", "Integrated Care Boards", "Community Diagnostic Centres", "Private hospitals & clinics", "GP practices", "Care providers", "Workforce suppliers"];
  return (
    <div style={{ background: "#fff", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(255,255,255,.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--line)" }}>
        <div className="row" style={{ justifyContent: "space-between", height: 72, padding: "0 20px" }}>
          <span onClick={() => goTo("home")} style={{ cursor: "pointer" }}><Wordmark /></span>
          <div className="row hsm" ref={navRef} style={{ gap: 20 }}>{NAV.map((n) => {
            const groupActive = n.items ? n.items.some(([, mv]) => view === mv.split(":")[0]) : view === n.k;
            if (!n.items) return (
              <button key={n.k} onClick={() => goTo(n.k)} className="navlink" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14.5, fontWeight: groupActive ? 700 : 500, color: groupActive ? "var(--blue)" : "var(--text)", whiteSpace: "nowrap" }}>{n.l}</button>
            );
            const open = navMenu === n.k;
            return (
              <div key={n.k} style={{ position: "relative" }}>
                <button onClick={() => setNavMenu(open ? null : n.k)} className="navlink row" style={{ gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 14.5, fontWeight: groupActive ? 700 : 500, color: groupActive ? "var(--blue)" : "var(--text)", whiteSpace: "nowrap" }}>{n.l} <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} /></button>
                {open ? (
                  <div className="card" style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, padding: 6, width: 258, zIndex: 40, boxShadow: "0 16px 40px rgba(10,23,48,.18)" }}>
                    {n.items.map(([ml, mv, md]) => {
                      const tv = mv.split(":")[0], ts = mv.split(":")[1];
                      const on = view === tv && (!ts || howSec === ts);
                      return (
                        <button key={mv} onClick={() => goTo(mv)} style={{ width: "100%", textAlign: "left", padding: "9px 11px", borderRadius: 9, border: "none", cursor: "pointer", background: on ? "var(--cyan-soft)" : "transparent" }}>
                          <span style={{ display: "block", fontWeight: 600, fontSize: 13.5, color: "var(--text)" }}>{ml}</span>
                          <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>{md}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}</div>
          <div className="row" style={{ gap: 12 }}><button className="btn btn-light hsm" style={{ background: "var(--bg)" }} onClick={onDemo}>Book a demo</button><button className="btn btn-primary" onClick={onEnter}>Get started / Sign in</button></div>
        </div>
      </div>

      <div className="lb" data-view={view}>
      <div className="sec home" style={{ background: "radial-gradient(115% 85% at 50% -8%, #E6F4F2 0%, #F3F9FD 44%, #fff 100%)", borderBottom: "1px solid var(--line)", position: "relative", overflow: "hidden" }}>
        <div className="wrap" style={{ padding: "56px 24px 36px", textAlign: "center" }}>
          <CountdownBanner />
          <div className="reveal"><span className="chip chip-cyan" style={{ padding: "7px 15px" }}><Sparkles size={14} /> Healthcare Growth CRM · 24/7 live, every market worldwide</span></div>
          <h1 className="disp heroh reveal" style={{ fontWeight: 700, margin: "26px auto 0", maxWidth: 880 }}>Stop rushing to the cheapest bidder. <span style={{ background: "linear-gradient(96deg,var(--teal),var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Start choosing the best.</span></h1>
          <div className="reveal" style={{ display: "flex", justifyContent: "center", margin: "14px 0 4px" }}><PulseLine /></div>
          <p className="muted reveal" style={{ fontSize: 19, maxWidth: 620, margin: "14px auto 0", lineHeight: 1.6 }}>{APP_NAME} is the 24/7 live healthcare marketplace and growth CRM across the NHS, private and international markets. It turns the hours teams lose to manual client-mapping, decision-maker research and stale CRM data into one live platform, so you win work in the time others spend searching.</p>
          
          <div className="row faint reveal" style={{ gap: 8, justifyContent: "center", marginTop: 18, fontSize: 13.5 }}><ShieldCheck size={15} /> For private clinics, GP practices, care providers, NHS trusts, workforce suppliers and international health systems</div>
        </div>
      </div>

      <div className="sec market" style={{ background: "var(--navy)", borderBottom: "1px solid var(--line)" }}>
        <style>{`@keyframes quraPulse{0%{transform:scale(.9);opacity:1}70%{transform:scale(2.4);opacity:0}100%{opacity:0}}`}</style>
        <div className="wrap" style={{ padding: "44px 24px 48px" }}>
          <div className="grid g2" style={{ gap: 30, alignItems: "center" }}>
            <div>
              <div className="eyebrow" style={{ color: "#5FE6DC" }}>Live worldwide, 24/7</div>
              <h2 className="disp" style={{ color: "#fff", fontSize: 30, fontWeight: 700, margin: "12px 0 10px", lineHeight: 1.15 }}>See the market moving in real time</h2>
              <p style={{ color: "#9FB0D0", fontSize: 15.5, lineHeight: 1.6, margin: "0 0 18px", maxWidth: 460 }}>Roles, insourcing, candidates and intelligence, updating around the clock across every market, so you work from live data instead of last quarter's spreadsheet. Choose your lens. Names are hidden until you sign in, so this is only a glimpse of what members act on first.</p>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{LENSES.map((x) => (<button key={x.k} onClick={() => setLens(x.k)} style={{ cursor: "pointer", padding: "8px 15px", borderRadius: 999, fontSize: 13, fontWeight: 600, transition: "all .15s ease", background: lens === x.k ? "#00C2B8" : "rgba(255,255,255,.06)", color: lens === x.k ? "#04211F" : "#C4D0E6", border: "1px solid " + (lens === x.k ? "#00C2B8" : "rgba(255,255,255,.14)") }}>{x.l}</button>))}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: 16, backdropFilter: "blur(10px)" }}>
              <div className="row" style={{ justifyContent: "space-between", padding: "2px 6px 12px" }}>
                <span className="row" style={{ gap: 9, color: "#fff", fontWeight: 600, fontSize: 13.5 }}><span style={{ position: "relative", width: 9, height: 9 }}><span style={{ position: "absolute", inset: 0, borderRadius: 999, background: "#22E0A1" }} /><span style={{ position: "absolute", inset: 0, borderRadius: 999, background: "#22E0A1", animation: "quraPulse 1.8s infinite" }} /></span>Live marketplace</span>
                <span className="chip" style={{ background: "rgba(0,194,184,.16)", color: "#5FE6DC", fontSize: 10.5 }}>{feed.length} live now</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{shown.map((it, i) => (
                <div key={i} className="row" style={{ gap: 12, padding: "12px 13px", borderRadius: 12, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.07)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: SVC_C[it.svc] || "#5FE6DC", flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.role}</div>
                    <div style={{ color: "#8295B6", fontSize: 12, marginTop: 2 }}><span style={{ filter: "blur(4.5px)", userSelect: "none" }}>{it.org}</span> · {it.loc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}><span style={{ fontSize: 10, fontWeight: 700, color: SVC_C[it.svc] || "#5FE6DC" }}>{it.svc}</span><div style={{ color: "#6B7C9C", fontSize: 11, marginTop: 3 }}>{it.ago}</div></div>
                </div>
              ))}{!shown.length && <div style={{ color: "#8295B6", fontSize: 13, padding: "18px 6px" }}>New listings opening in this market shortly.</div>}</div>
              <button onClick={onEnter} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 14, background: "#00C2B8", color: "#04211F", fontWeight: 700 }}>Sign in to see who is hiring <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
        <div className="wrap" style={{ padding: "0 24px 64px" }}>
          <div className="grid g4" style={{ gap: 14, marginBottom: 26 }}>
            {[
              ["24/7", "The feed never sleeps, across every market"],
              ["Seconds", "From a role appearing to a matched clinician"],
              ["Every lens", "Suppliers, hospitals, clinicians and care"],
              ["No fees", "Clinicians apply directly, with no agency fee"],
            ].map((st) => (
              <div key={st[0]} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 14, padding: "18px 18px" }}>
                <div className="disp" style={{ fontSize: 24, fontWeight: 800, color: "#00C2B8" }}>{st[0]}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.68)", marginTop: 6, lineHeight: 1.5 }}>{st[1]}</div>
              </div>
            ))}
          </div>
          <div className="grid g3" style={{ gap: 16 }}>
            {[
              { i: Radar, t: "Demand appears", d: "A hospital, diagnostic centre or care provider posts a live requirement, or it is surfaced automatically from public sector intelligence." },
              { i: Sparkles, t: "Qura matches it", d: "The role is categorised by profession, specialty, country and employer, then matched to verified clinicians and the suppliers who can deliver." },
              { i: Send, t: "Both sides engage", d: "Suppliers are alerted the moment it goes live. Clinicians can apply directly. Introductions happen on the platform, not in a mailbox." },
            ].map((c, n) => (
              <div key={c.t} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, padding: 22 }}>
                <div className="row" style={{ gap: 12, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(0,194,184,.16)", display: "grid", placeItems: "center" }}><c.i size={19} color="#7EEDE4" /></div>
                  <div style={{ fontWeight: 700, fontSize: 15.5, color: "#fff" }}>{c.t}</div>
                </div>
                <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)", lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>{c.d}</p>
              </div>
            ))}
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: 26 }}>
            <button onClick={onEnter} className="btn lift" style={{ background: "#00C2B8", color: "#04231F", fontWeight: 800, padding: "13px 26px" }}>Sign in to see the full marketplace <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="wrap sec home" style={{ padding: "22px 24px" }}>
        <Reveal><div className="grid g4">{stats.map((s) => (<div key={s.l} style={{ textAlign: "center" }}><div className="num" style={{ fontSize: 40, fontWeight: 600, color: "var(--navy)" }}><CountUp v={s.n} /></div><div className="muted" style={{ fontSize: 14, marginTop: 2 }}>{s.l}</div></div>))}</div></Reveal>
      </div>

      <div className="wrap sec fragile" style={{ padding: "8px 24px 8px" }}>
        <Reveal>
          <div className="card" style={{ padding: "40px 40px", background: "linear-gradient(160deg, var(--cyan-soft), #fff 75%)", border: "1px solid var(--line)" }}>
            <div className="grid g2" style={{ gap: 30, alignItems: "center" }}>
              <div>
                <div className="eyebrow" style={{ color: "#06776F" }}>Built for fragile professions</div>
                <h2 className="disp" style={{ fontSize: 30, fontWeight: 700, margin: "12px 0 12px", lineHeight: 1.15 }}>The roles the NHS struggles most to fill</h2>
                <p className="muted" style={{ fontSize: 15.5, lineHeight: 1.6, margin: "0 0 16px", maxWidth: 460 }}>Fragile professions are the scarce, hard-to-sustain clinical roles that keep services running: sonography, audiology, echocardiography, radiography and allied diagnostics. Qura specialises in them, summarising niche vacancies the moment they appear and mapping the market for you in real time. No more mapping regions by hand for hours.</p>
                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>{["Sonography", "Audiology", "Echocardiography", "Radiography", "Respiratory", "Pathology"].map((x) => (<span key={x} className="chip" style={{ background: "#fff", border: "1px solid var(--line)", fontWeight: 600 }}>{x}</span>))}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["Niche vacancies, summarised", "Fragile-profession roles surfaced the moment they go live.", Radar], ["Mapping done for you", "The market is mapped continuously, so your team stops mapping regions manually.", Globe], ["Live 24/7", "The feed never sleeps, across every market.", Rss], ["Merit over deadline", "The right specialist, chosen on fit rather than urgency.", Award]].map(([t, d, I]) => (
                  <div key={t} className="card" style={{ padding: 16 }}><div style={{ width: 38, height: 38, borderRadius: 10, background: "#EEF3FF", display: "grid", placeItems: "center" }}><I size={18} color="#1E54E6" /></div><div style={{ fontWeight: 600, fontSize: 14, marginTop: 10 }}>{t}</div><div className="muted" style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.45 }}>{d}</div></div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal><div style={{ textAlign: "center", maxWidth: 640, margin: "54px auto 30px" }}><div className="eyebrow" style={{ color: "#06776F" }}>The full picture</div><h2 className="disp" style={{ fontSize: 32, fontWeight: 700, margin: "8px 0 10px" }}>Every fragile profession, covered</h2><p className="muted" style={{ fontSize: 15.5, lineHeight: 1.6, marginTop: 0 }}>The roles under the greatest workforce pressure across the NHS and beyond, from severe shortages and burnout to heavy reliance on international recruitment. {APP_NAME} is built around all of them.</p></div></Reveal>
        <div className="grid g3" style={{ gap: 16, marginBottom: 20 }}>
          {[
            { i: Heart, t: "Nursing & midwifery", c: "#E11D48", r: ["Adult nurses (RGN)", "Mental health nurses (RMN)", "Learning disability nurses", "ICU & critical care", "Community & district", "Specialist nurses", "Midwives"] },
            { i: Stethoscope, t: "Doctors", c: "#1E54E6", r: ["General practitioners", "Oncologists", "Ophthalmologists", "Dermatologists", "Gastroenterologists", "Radiologists", "Specialist consultants"] },
            { i: Activity, t: "Allied health professionals", c: "#0E8C7E", r: ["Sonographers", "Diagnostic & therapeutic radiographers", "Echocardiographers", "Audiologists", "Paramedics", "Physiotherapists & OTs", "Speech & language therapists", "Podiatrists & dietitians", "Operating department practitioners", "Orthoptists, prosthetists & orthotists", "Arts, music & drama therapists"] },
            { i: Brain, t: "Healthcare science", c: "#7C5CFF", r: ["Biomedical scientists", "Clinical scientists", "Genomics & audiology science", "Pathology services"] },
            { i: ShieldCheck, t: "Pharmacy & psychology", c: "#B45309", r: ["Pharmacists (hospital & community)", "Pharmacy technicians", "Clinical psychologists"] },
            { i: Globe, t: "Why they are fragile", c: "#0A1A30", r: ["Severe, sustained shortages", "High burnout and attrition", "Long training pipelines", "Heavy reliance on international recruitment", "Services stop without them"] },
          ].map((g, i) => (
            <Reveal key={g.t} delay={i * 50}>
              <div className="card lift" style={{ padding: 22, height: "100%" }}>
                <div className="row" style={{ gap: 12, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: g.c + "14", display: "grid", placeItems: "center", flexShrink: 0 }}><g.i size={20} color={g.c} /></div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{g.t}</div>
                </div>
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
                  {g.r.map((x) => (<div key={x} className="row" style={{ gap: 8, fontSize: 13.5, alignItems: "flex-start" }}><Check size={14} color={g.c} style={{ flexShrink: 0, marginTop: 3 }} /><span className="muted">{x}</span></div>))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal><div className="card" style={{ padding: "26px 30px", background: "var(--navy)", color: "#fff", border: "none", marginBottom: 8 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ maxWidth: 620 }}><div className="disp" style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>A CRM built specifically for fragile professions</div><p style={{ fontSize: 14, opacity: .85, lineHeight: 1.6, margin: 0 }}>General recruitment tools treat these roles like any other vacancy. {APP_NAME} is designed around their scarcity, their compliance requirements and the international pathways that supply them.</p></div>
            <button onClick={onEnter} className="btn" style={{ background: "#00C2B8", color: "#04231F", fontWeight: 800, padding: "13px 22px", whiteSpace: "nowrap" }}>Get started <ArrowRight size={16} /></button>
          </div>
        </div></Reveal>

      </div>

      <div className="sec solutions" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap" style={{ padding: "72px 24px" }}>
          <Reveal><div style={{ textAlign: "center", maxWidth: 660, margin: "0 auto 38px" }}><div className="eyebrow">Specialist new business, every solution</div><h2 className="disp" style={{ fontSize: 34, fontWeight: 700, marginTop: 12 }}>10 ways to win new business, <span style={{ background: "linear-gradient(96deg,var(--teal),var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>perm first</span></h2><p className="muted" style={{ fontSize: 16.5, marginTop: 10, lineHeight: 1.6 }}>Live opportunities across permanent, insourcing, contract, international, tenders, regional projects, PSLs, MSPs and RPOs, with locum cover when it is genuinely needed.</p></div></Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>{[{ t: "Placement types", s: "Ways to place talent", accent: "#0E8C7E", items: SOLUTIONS.slice(0, 5) }, { t: "Routes to market", s: "Ways to win and hold contracts", accent: "#2D6BFF", items: SOLUTIONS.slice(5) }].map((grp) => (
            <div key={grp.t}>
              <div className="row" style={{ alignItems: "baseline", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: grp.accent }}>{grp.t}</span>
                <span className="faint" style={{ fontSize: 12.5 }}>{grp.s}</span>
                <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, alignItems: "stretch" }}>{grp.items.map((sol, i) => (
                <Reveal key={sol.l} delay={i * 45}>
                  <div className="card lift" style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column", borderColor: sol.lead ? "var(--cyan)" : "var(--line)" }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: sol.lead ? "var(--cyan-soft)" : "#EEF3FF", display: "grid", placeItems: "center" }}><sol.i size={20} color={sol.lead ? "#06776F" : "#1E54E6"} /></div>
                      {sol.lead ? <span className="chip chip-cyan" style={{ fontSize: 10 }}>Perm-first</span> : null}
                      {sol.subtle ? <span className="chip chip-grey" style={{ fontSize: 10 }}>On demand</span> : null}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 5 }}>{sol.l}</div>
                    <div className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{sol.d}</div>
                  </div>
                </Reveal>
              ))}</div>
            </div>
          ))}</div>
        </div>
      </div>

      <ClinicianSection onEnter={onEnter} />
      <SupplierAppSection />
      <div id="platform" className="sec solutions" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap" style={{ padding: "78px 24px" }}>
          <Reveal><div style={{ textAlign: "center", maxWidth: 660, margin: "0 auto 48px" }}><div className="eyebrow">The personal touch behind the intelligence</div><h2 className="disp" style={{ fontSize: 36, fontWeight: 700, marginTop: 14 }}>Analytics with <span style={{ background: "linear-gradient(96deg,var(--teal),var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>experts</span> behind them</h2><p className="muted" style={{ fontSize: 17, marginTop: 12, lineHeight: 1.6 }}>Most platforms hand you a dashboard and wish you luck. {APP_NAME} hands you the judgment of experts who have spent over a decade winning healthcare contracts.</p></div></Reveal>
          <div className="grid g3">{edge.map((e, idx) => (<Reveal key={e.t} delay={idx * 90}><div className="card lift" style={{ padding: 28, height: "100%" }}><div style={{ width: 54, height: 54, borderRadius: 15, background: e.bg, display: "grid", placeItems: "center" }}><e.i size={24} color={e.c} /></div><h3 style={{ fontSize: 19, fontWeight: 600, margin: "18px 0 8px" }}>{e.t}</h3><p className="muted" style={{ fontSize: 15, margin: 0, lineHeight: 1.6 }}>{e.b}</p></div></Reveal>))}</div>
        </div>
      </div>

      <div className="sec solutions" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap" style={{ padding: "78px 24px" }}>
          <Reveal><div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}><div className="eyebrow">Voices from the field</div><h2 className="disp" style={{ fontSize: 36, fontWeight: 700, marginTop: 14 }}>Clinicians we have relocated</h2><p className="muted" style={{ fontSize: 17, marginTop: 12 }}>Real words from clinicians placed across NHS and private roles.</p></div></Reveal>
          <div className="grid g3">{TESTIMONIALS.map((t, idx) => (<Reveal key={t.name} delay={idx * 90}><div className="card lift" style={{ padding: 26, height: "100%" }}><Quote size={26} color="var(--cyan)" /><p style={{ fontSize: 15, margin: "14px 0 18px", lineHeight: 1.6 }}>{t.quote}</p><div className="row" style={{ gap: 11 }}><div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--cyan-soft)", color: "#06776F", display: "grid", placeItems: "center", fontWeight: 700 }} className="disp">{t.name[0]}</div><div><div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div><div className="faint" style={{ fontSize: 12.5 }}>{t.role}</div></div></div></div></Reveal>))}</div>
        </div>
      </div>

      <div className="wrap sec solutions" style={{ padding: "56px 24px" }}>
        <Reveal><div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 34px" }}><h2 className="disp" style={{ fontSize: 36, fontWeight: 700 }}>Why teams choose {APP_NAME}</h2><p className="muted" style={{ fontSize: 17, marginTop: 12 }}>Everything you would spend hours pulling from Google, LinkedIn and board papers, mapped for you on one live platform. The teams that adopt {APP_NAME} stop searching and start winning; the ones that do not risk falling behind.</p></div></Reveal>
        <div className="grid g2">{why.map((w, idx) => (<Reveal key={w.t} delay={idx * 70}><div className="card lift row" style={{ padding: 24, gap: 18, alignItems: "flex-start", height: "100%" }}><div style={{ width: 48, height: 48, borderRadius: 13, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><w.i size={22} color="#1E54E6" /></div><div><h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{w.t}</h3><p className="muted" style={{ fontSize: 15, margin: 0, lineHeight: 1.6 }}>{w.b}</p></div></div></Reveal>))}</div>
      </div>

      <div className="wrap sec home" style={{ padding: "4px 24px 34px", textAlign: "center" }}>
        <div className="faint" style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".08em", marginBottom: 12 }}>BUILT FOR HEALTHCARE, ACROSS EVERY SETTING</div>
        <div className="muted" style={{ fontSize: 15, maxWidth: 640, margin: "0 auto" }}>One live platform spanning the NHS, private and international healthcare markets.</div>
      </div>

      <HowItWorks section={howSec} go={setHowSec} />

      <div className="sec story" style={{ background: "var(--bg)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap" style={{ padding: "72px 24px" }}>
          <Reveal><div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 44px" }}><div className="eyebrow">Behind the brand</div><h2 className="disp" style={{ fontSize: 36, fontWeight: 700, margin: "8px 0 10px" }}>Our story</h2><p className="muted" style={{ fontSize: 16, lineHeight: 1.65, marginTop: 0 }}>{APP_NAME} was not created in a boardroom. It was created after decades of working inside healthcare.</p></div></Reveal>
          <div className="grid g2" style={{ gap: 22, alignItems: "start" }}>
            <Reveal>
              <div className="card" style={{ padding: 30 }}>
                <div className="ph-accent" />
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.7, marginTop: 0 }}>Between us we have spent more than 32 years across healthcare business development, workforce strategy, healthcare economics and large-scale health system transformation. We have seen first-hand how much time is wasted because the right people simply cannot find each other.</p>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.7 }}>One of us had just stepped away from a senior leadership role after more than a decade helping healthcare organisations and agencies win high-value partnerships across the UK. Despite the success, one question kept coming back: what if that knowledge could improve the entire sector instead of just one organisation?</p>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.7 }}>The other was leading major healthcare transformation projects across Africa, working alongside governments and health systems to improve access to care while helping deliver one of the continent's most ambitious cancer programmes.</p>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.7 }}>Although we came from different parts of the world, we discovered something surprising. The challenges were almost identical. Hospitals struggled to identify the right partners. Workforce suppliers found it difficult to reach the right decision-makers. Clinicians faced fragmented career pathways. Valuable opportunities were missed because the healthcare ecosystem remained disconnected.</p>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.7 }}>Late one evening, during an informal conversation, one idea became impossible to ignore. Healthcare did not need another recruitment platform. It needed an ecosystem.</p>
                <p style={{ fontSize: 15.5, lineHeight: 1.7, fontWeight: 600 }}>That conversation became {APP_NAME}.</p>
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.7 }}>Today, {APP_NAME} is being built to connect healthcare organisations, suppliers, workforce partners and clinicians through one intelligent platform that removes friction, improves transparency and helps the right people find each other faster.</p>
                <div style={{ marginTop: 22, padding: "18px 20px", borderRadius: 14, background: "var(--cyan-soft)" }}><div className="faint" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Our belief</div><div className="disp gradient-text" style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.35 }}>Healthcare moves faster when the right people connect.</div></div>
              </div>
            </Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[{ i: Award, t: "Built by experience", d: "Every feature is designed around real healthcare challenges, not assumptions." },
                { i: ShieldCheck, t: "Trust before transactions", d: "Long-term partnerships are built on transparency, credibility and reputation." },
                { i: Sparkles, t: "Technology with purpose", d: "Artificial intelligence should remove administration, not replace relationships." },
                { i: Globe, t: "Global thinking", d: "Healthcare challenges do not stop at borders, and neither should the solutions." },
                { i: Star, t: "Quality over quantity", d: "Better connections create better outcomes for organisations, clinicians and ultimately patients." },
                { i: TrendingUp, t: "Always improving", d: "Healthcare never stands still. Neither will " + APP_NAME + "." }].map((v, i) => (
                <Reveal key={v.t} delay={i * 50}>
                  <div className="card lift" style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><v.i size={19} color="#1E54E6" /></div>
                    <div><div style={{ fontWeight: 700, fontSize: 15 }}>{v.t}</div><div className="muted" style={{ fontSize: 13, marginTop: 3, lineHeight: 1.55 }}>{v.d}</div></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="pricing" className="sec pricing" style={{ background: "var(--navy)" }}>
        <div className="wrap" style={{ padding: "70px 24px 10px" }}>
          <div style={{ textAlign: "center", maxWidth: 660, margin: "0 auto 34px" }}><div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#7EEDE4", marginBottom: 10 }}>Pricing</div><h2 className="disp" style={{ fontSize: 34, fontWeight: 700, margin: "0 0 12px", color: "#FFFFFF" }}>Priced for who you are</h2><p style={{ fontSize: 15.5, lineHeight: 1.6, margin: 0, color: "#B8C7DD" }}>Clinicians join free. Everyone else pays for the time {APP_NAME} gives back. Prices shown per month, with a saving when billed annually.</p></div>
          <div className="grid g3" style={{ gap: 18 }}>
            {[
              { who: "Workforce suppliers", accent: "#00C2B8", plans: [["Starter", "£450", "£375 billed annually"], ["Growth", "£1,200", "£999 billed annually"]], pts: ["Live opportunities across every market", "Verified decision-makers", "AI outreach and proposals", "Pipeline, CRM and weekly reports"] },
              { who: "Hospitals & providers", accent: "#7FA9FF", plans: [["Team", "£350", "£290 billed annually"], ["Intelligence", "£900", "£750 billed annually"]], pts: ["Post vacancies and search candidates", "Registered clinician access", "ICB and council intelligence", "Analytics and insights"] },
              { who: "Clinicians", accent: "#C4B5FD", plans: [["Free", "£0", "Always free to join and apply"], ["Career+", "£15", "£12 billed annually"]], pts: ["Verified profile, seen worldwide", "Unlimited search and alerts", "Salary and tariff insights", "Relocation support"] },
            ].map((col, i) => (
              <Reveal key={col.who} delay={i * 60}>
                <div style={{ padding: 26, height: "100%", background: "#12233F", border: "1px solid #24405F", borderRadius: 18, color: "#fff", boxShadow: "0 14px 34px rgba(3,10,22,.34)" }}>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, color: col.accent }}>{col.who}</div>
                  {col.plans.map((pl) => (
                    <div key={pl[0]} style={{ padding: "12px 0", borderTop: "1px solid #24405F" }}>
                      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 600, fontSize: 14.5, color: "#FFFFFF" }}>{pl[0]}</span>
                        <span className="disp" style={{ fontWeight: 800, fontSize: 22, color: "#FFFFFF" }}>{pl[1]}<span style={{ fontSize: 12, fontWeight: 500, color: "#93A6C2" }}>{pl[1] === "£0" ? "" : " /mo"}</span></span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "#93A6C2", marginTop: 2 }}>{pl[2]}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {col.pts.map((x) => (<div key={x} className="row" style={{ gap: 8, fontSize: 13, alignItems: "flex-start" }}><Check size={14} color={col.accent} style={{ flexShrink: 0, marginTop: 2 }} /><span style={{ color: "#C7D5E8" }}>{x}</span></div>))}
                  </div>
                  <button onClick={onEnter} className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 20, background: "#00C2B8", color: "#04231F", border: "none", fontWeight: 700 }}>Get started</button>
                </div>
              </Reveal>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 12.5, color: "#8A9CB8" }}>Enterprise and multi-site pricing available on request. All prices exclude VAT where applicable.</div>
        </div>
        <div className="wrap" style={{ padding: "80px 24px", textAlign: "center" }}>
          <Reveal>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><PulseLine w={260} color="#5FE6DC" /></div>
            <h2 className="disp" style={{ color: "#fff", fontSize: 40, fontWeight: 700, maxWidth: 700, margin: "0 auto", lineHeight: 1.08 }}>Win your next contract with experts on your side</h2>
            <p style={{ color: "#9FB0D0", fontSize: 18, maxWidth: 540, margin: "18px auto 0" }}>See how {APP_NAME} turns a decade of healthcare deal-making into your unfair advantage.</p>
            <div className="row" style={{ gap: 14, justifyContent: "center", marginTop: 34, flexWrap: "wrap" }}><button className="btn btn-blue lift" style={{ padding: "15px 28px", fontSize: 16 }} onClick={onEnter}>Get started / Sign in <ArrowRight size={18} /></button><button onClick={onDemo} className="btn btn-dghost" style={{ padding: "15px 28px", fontSize: 16 }}><Mail size={17} /> Talk to us</button></div>
          </Reveal>
        </div>
      </div>

      </div>
      <div style={{ borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
        <div className="wrap" style={{ padding: "34px 24px 28px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Wordmark /></div>

          <div className="row" style={{ justifyContent: "center", flexWrap: "wrap", gap: "10px 22px", marginTop: 20 }}>
            {FOOTER_LINKS.map(([l, mv]) => (
              <button key={mv} onClick={() => goTo(mv)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13.5, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap" }}>{l}</button>
            ))}
          </div>

          <div className="row" style={{ justifyContent: "center", flexWrap: "wrap", gap: "8px 18px", marginTop: 12 }}>
            {[["Privacy", "privacy"], ["Cookies", "cookies"], ["Refunds", "refunds"]].map(([l, k]) => (
              <button key={k} onClick={() => setPolicy(k)} className="faint" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12.5, whiteSpace: "nowrap" }}>{l}</button>
            ))}
            <a href="/terms.html" className="faint" style={{ fontSize: 12.5, textDecoration: "none", whiteSpace: "nowrap" }}>Terms</a>
            <a href="/delete-account.html" className="faint" style={{ fontSize: 12.5, textDecoration: "none", whiteSpace: "nowrap" }}>Delete your account</a>
            <button onClick={() => window.dispatchEvent(new Event("qura:cookie-preferences"))} className="faint" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12.5, whiteSpace: "nowrap" }}>Cookie preferences</button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}><StoreBadges /></div>

          <div className="faint" style={{ fontSize: 12.5, marginTop: 22, lineHeight: 1.6 }}>
            © {new Date().getFullYear()} {APP_NAME}, Healthcare Growth CRM<br />
            Qura Ltd, company no. 17310951 · 167-169 Great Portland Street, 5th Floor, London W1W 5PF
          </div>
        </div>
      </div>
      {policy ? <div onClick={() => setPolicy(null)} style={{ position: "fixed", inset: 0, background: "rgba(6,14,30,.55)", zIndex: 95, display: "grid", placeItems: "center", padding: 20 }}><div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 620, width: "100%", padding: 28, maxHeight: "84vh", overflowY: "auto" }}><div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}><h3 className="disp" style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{policy === "privacy" ? "Privacy & data protection" : policy === "refunds" ? "Refund & cancellation policy" : "Cookie notice"}</h3><button className="btn btn-light" style={{ padding: "6px 10px" }} onClick={() => setPolicy(null)}>Close</button></div>{policy === "privacy" ? <PrivacyContent /> : policy === "refunds" ? <RefundContent /> : <CookieContent />}</div></div> : null}
    </div>
  );
}

/* ===================== auth ===================== */


function PricingContent({ onEnter }) {
  const fam = [
    { t: "Workforce suppliers", d: "Subscription tiers from a 7-day free trial to Enterprise, across every market.", pts: ["Live opportunities & CRM", "Outreach & AI assistant", "All markets"] },
    { t: "Hospitals, GP & Care", d: "A buyer family with pilot, Team, Intelligence and Network tiers.", pts: ["Post vacancies & search", "ICB & council intelligence", "Analytics"] },
    { t: "Clinicians", d: "Free to join and apply, with optional premium career tools.", pts: ["Unlimited search & alerts", "Verified profile", "Career+ upgrade"] },
  ];
  return (<><h1 className="disp" style={{ fontSize: 36, fontWeight: 700, margin: "0 0 6px" }}>Pricing</h1><p className="muted" style={{ fontSize: 16, maxWidth: 620, marginTop: 0 }}>Pricing adapts to who you are. Sign in to see the full plans in your market currency.</p><div className="grid g3" style={{ marginTop: 28 }}>{fam.map((x) => (<div key={x.t} className="card" style={{ padding: 24 }}><div style={{ fontWeight: 700, fontSize: 17 }}>{x.t}</div><p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55, minHeight: 60 }}>{x.d}</p><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{x.pts.map((p) => <div key={p} className="row" style={{ gap: 8, fontSize: 13.5 }}><Check size={15} color="#0E8C7E" />{p}</div>)}</div><button onClick={onEnter} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>See full pricing</button></div>))}</div></>);
}

function LandingSubPage({ view, go, onEnter, onDemo }) {
  return (
    <div className="wrap" style={{ padding: "48px 24px 90px", minHeight: "62vh" }}>
      <button onClick={() => go("home")} className="btn btn-light" style={{ marginBottom: 26 }}>{"←"} Back to home</button>
      {view === "platform" ? <PlatformContent /> : null}
      {view === "pricing" ? <PricingContent onEnter={onEnter} /> : null}
      <div className="row" style={{ gap: 12, marginTop: 44, flexWrap: "wrap" }}><button className="btn btn-primary" onClick={onEnter}>Get started / Sign in <ArrowRight size={16} /></button><button className="btn btn-light" onClick={onDemo}>Book a demo</button></div>
    </div>
  );
}

function Login({ onNext, onHome, onSignup }) {
  const [role, setRole] = useState("operator");
  const ROLES = [["operator", "Operator (Founders)"], ["agency", "Workforce supplier"], ["hospital", "Hospital / Provider"], ["clinician", "Clinician"]];
  return (
  <div style={{ minHeight: "100vh", position: "relative", display: "grid", placeItems: "center", padding: 24, overflow: "hidden", background: "radial-gradient(135% 120% at 0% 0%, #102A4F 0%, #0A1730 46%, #070E20 100%)" }}>
    <div className="login-orb orb-float" style={{ top: -130, right: -90, width: 440, height: 440, background: "radial-gradient(circle, rgba(0,194,184,.30), transparent 70%)" }} />
    <div className="login-orb orb-float" style={{ bottom: -150, left: -110, width: 480, height: 480, background: "radial-gradient(circle, rgba(45,107,255,.22), transparent 70%)" }} />
    <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 30, left: 34, zIndex: 4 }}><Wordmark light /></button>
      <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 32, right: 34, zIndex: 4, padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.28)", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>{"←"} Back to home</button>
    <div className="row login-card reveal" style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 940, gap: 0, borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 110px rgba(0,0,0,.5)", alignItems: "stretch", border: "1px solid rgba(255,255,255,.1)" }}>
      <div className="login-brand hsm" style={{ flex: "1 1 0", padding: "46px 44px", background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02))", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <div>
          <span className="chip" style={{ background: "rgba(0,194,184,.16)", color: "#5FE6DC", border: "1px solid rgba(0,194,184,.32)" }}><Sparkles size={13} /> Healthcare growth engine</span>
          <h1 className="disp" style={{ fontSize: 33, fontWeight: 700, margin: "24px 0 14px", lineHeight: 1.12 }}>Win the right work, faster.</h1>
          <p style={{ color: "#9FB0D0", fontSize: 15, lineHeight: 1.6, maxWidth: 380 }}>One intelligent platform linking workforce suppliers, hospitals and clinicians across NHS, private and international markets.</p>
        </div>
        <div>
          <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "0 0 22px" }} />
          <div className="row" style={{ gap: 28 }}>{[["13,000+", "LinkedIn community"], ["100K+", "Decision-makers reached"], ["50+", "Countries"]].map(([n, l]) => (<div key={l}><div className="disp num" style={{ fontSize: 22, fontWeight: 700 }}>{n}</div><div style={{ color: "#8295B6", fontSize: 12 }}>{l}</div></div>))}</div>
        </div>
      </div>
      <div className="login-auth" style={{ flex: "1 1 0", background: "#fff", padding: "46px 42px", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <button className="show-sm" onClick={onHome} style={{ marginBottom: 20, alignSelf: "flex-start" }}><Wordmark /></button>
        <div className="ph-accent" />
        <h2 className="disp" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Sign in to {APP_NAME}</h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Welcome back. Let us find your next opportunity.</p>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "20px 0 0" }}>Sign in as</label>
        <div className="login-field" style={{ padding: "0 10px 0 13px" }}><Users size={16} className="faint" /><select value={role} onChange={(e) => setRole(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", width: "100%", padding: "12px 4px", fontSize: 14, color: "var(--text)", fontFamily: "inherit", cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}>{ROLES.map(([k, l]) => (<option key={k} value={k}>{l}</option>))}</select><ChevronDown size={16} className="faint" /></div>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "20px 0 0" }}>Work email</label>
        <div className="login-field"><Mail size={16} className="faint" /><input defaultValue="ola@qurahealth.org" /></div>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "16px 0 0" }}>Password</label>
        <div className="login-field"><ShieldCheck size={16} className="faint" /><input type="password" defaultValue="demodemo" /></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 14, fontSize: 12.5 }}><label className="row" style={{ gap: 7, color: "var(--muted)", cursor: "pointer" }}><input type="checkbox" defaultChecked style={{ accentColor: "var(--teal)", width: 15, height: 15 }} /> Remember me</label><span style={{ color: "var(--teal)", fontWeight: 600, cursor: "pointer" }}>Forgot password?</span></div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 20, padding: 13 }} onClick={() => onNext(role)}>Continue <ArrowRight size={16} /></button>
        <div className="row" style={{ gap: 12, margin: "18px 0", color: "var(--faint)", fontSize: 12 }}><div style={{ flex: 1, height: 1, background: "var(--line)" }} /> or continue with <div style={{ flex: 1, height: 1, background: "var(--line)" }} /></div>
        <div className="row" style={{ gap: 10 }}><button className="btn btn-light" style={{ flex: 1, justifyContent: "center", background: "var(--bg)" }} onClick={() => onNext(role)}><ShieldCheck size={15} /> SSO</button><button className="btn btn-light" style={{ flex: 1, justifyContent: "center", background: "var(--bg)" }} onClick={() => onNext(role)}><Mail size={15} /> NHS Mail</button></div>
        <div className="row" style={{ justifyContent: "center", gap: 6, marginTop: 18, fontSize: 13 }}><span className="muted">New member?</span><button onClick={onSignup} style={{ color: "var(--teal)", fontWeight: 700, background: "none", cursor: "pointer" }}>Sign up</button></div>
        <div className="faint" style={{ fontSize: 12, textAlign: "center", marginTop: 16 }}>Prototype for internal alignment · no real credentials needed</div>
      </div>
    </div>
  </div>
  );
}
const DEMO_VIDEO_URL = ""; // paste your on-demand demo embed URL (YouTube/Vimeo) to go live

function DemoBooking({ onHome, onSignIn }) {
  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "grid", placeItems: "center", padding: 24, overflow: "hidden", background: "radial-gradient(135% 120% at 0% 0%, #102A4F 0%, #0A1730 46%, #070E20 100%)" }}>
      <div className="login-orb orb-float" style={{ top: -130, right: -90, width: 440, height: 440, background: "radial-gradient(circle, rgba(0,194,184,.30), transparent 70%)" }} />
      <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 30, left: 34, zIndex: 4 }}><Wordmark light /></button>
      <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 32, right: 34, zIndex: 4, padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.28)", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>{"←"} Back to home</button>
      <div className="card reveal" style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 780, padding: 0, overflow: "hidden" }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "linear-gradient(135deg, #0A1730, #102A4F)", display: "grid", placeItems: "center" }}>
          {DEMO_VIDEO_URL ? (
            <iframe src={DEMO_VIDEO_URL} title="Qura demo" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
          ) : (
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div style={{ width: 74, height: 74, borderRadius: 999, background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center", margin: "0 auto 14px", border: "1px solid rgba(255,255,255,.3)" }}><Play size={30} color="#fff" /></div>
              <div className="disp" style={{ fontWeight: 700, fontSize: 18 }}>On-demand Qura demo</div>
              <div style={{ fontSize: 12.5, opacity: .7, marginTop: 4 }}>Watch any time. No booking needed.</div>
            </div>
          )}
        </div>
        <div style={{ padding: 32 }}>
          <div className="ph-accent" />
          <h2 className="disp" style={{ fontSize: 25, fontWeight: 700, margin: "0 0 6px" }}>See {APP_NAME} in a few minutes</h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 14.5, lineHeight: 1.6 }}>Watch the on-demand demo, then create your free account to get started. Once you are a member, you can book a private strategy session with a founder or join a live team workshop.</p>
          <div className="row" style={{ gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <button className="btn btn-primary" style={{ padding: "13px 22px" }} onClick={onSignIn}>Create account / Sign in <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Signup({ onHome, onSignIn, onChoose }) {
  const [annual, setAnnual] = useState(true);
  const tiers = [
    { key: "trial", name: "7-day free trial", price: "Free", blurb: "Explore the full platform for 7 days. No card required.", cta: "Start free trial", highlight: true, feats: ["Full access for 7 days", "All markets and the live feed", "AI proposals and CRM", "Upgrade any time"] },
    { key: "starter", name: "Starter", mo: 450, yr: 375, blurb: "For small agencies winning their first NHS and private work.", cta: "Choose Starter", feats: ["3 user seats", "UK opportunities", "Live feed access"] },
    { key: "growth", name: "Growth", mo: 1200, yr: 999, blurb: "For growing teams selling across every market.", cta: "Choose Growth", tag: "Most popular", feats: ["10 user seats", "All markets", "AI proposals and analytics"] },
    { key: "enterprise", name: "Enterprise", custom: true, blurb: "For multi-team providers and national operators.", cta: "Contact sales", feats: ["Unlimited seats", "SSO and workspaces", "Priority support"] },
  ];
  const fmt = (n) => "£" + n.toLocaleString();
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#F3F9FD,#fff)" }}>
      <div className="wrap row" style={{ padding: "26px 24px", justifyContent: "space-between", alignItems: "center" }}><button onClick={onHome}><Wordmark /></button><div className="row" style={{ gap: 12 }}><span className="muted hsm" style={{ fontSize: 13.5 }}>Already a member?</span><button className="btn btn-light" style={{ background: "var(--bg)" }} onClick={onSignIn}>Sign in</button></div></div>
      <div className="wrap" style={{ padding: "10px 24px 60px", textAlign: "center" }}>
        <h1 className="disp" style={{ fontSize: 34, fontWeight: 700 }}>Choose how you start</h1>
        <p className="muted" style={{ fontSize: 16, maxWidth: 560, margin: "10px auto 0" }}>Start free for 7 days, or pick the plan that fits. Change or upgrade at any time.</p>
        <div className="row" style={{ justifyContent: "center", gap: 4, margin: "24px auto 26px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 999, padding: 4, width: "fit-content" }}>{[["Monthly", false], ["Annual", true]].map(([l, v]) => (<button key={l} onClick={() => setAnnual(v)} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 999, cursor: "pointer", background: annual === v ? "var(--blue)" : "#fff", color: annual === v ? "#fff" : "var(--navy)", boxShadow: annual === v ? "0 1px 3px rgba(45,107,255,.35)" : "var(--sh-xs)" }}>{l}</button>))}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(238px,1fr))", gap: 16, textAlign: "left", maxWidth: "none", margin: "0 auto" }}>{tiers.map((t) => (
          <div key={t.key} className="card" style={{ padding: 26, display: "flex", flexDirection: "column", border: t.highlight ? "2px solid var(--teal)" : t.tag ? "2px solid var(--blue)" : "1px solid var(--line)", position: "relative", background: t.highlight ? "linear-gradient(160deg,var(--cyan-soft),#fff 70%)" : "#fff" }}>
            {t.tag && <span className="chip chip-blue" style={{ position: "absolute", top: -11, left: 26 }}>{t.tag}</span>}
            {t.highlight && <span className="chip chip-cyan" style={{ position: "absolute", top: -11, left: 26 }}>Recommended</span>}
            <div className="disp" style={{ fontWeight: 700, fontSize: 18 }}>{t.name}</div>
            <div style={{ margin: "10px 0 4px" }}>{t.custom ? <span className="disp" style={{ fontSize: 26, fontWeight: 700 }}>Custom</span> : t.price ? <span className="disp" style={{ fontSize: 30, fontWeight: 700, color: "var(--teal)" }}>{t.price}</span> : <><span className="disp num" style={{ fontSize: 30, fontWeight: 700 }}>{fmt(annual ? t.yr : t.mo)}</span><span className="muted" style={{ fontSize: 13 }}> /mo</span>{annual && <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>billed annually at {fmt(t.yr * 12)} / yr · save {Math.round((1 - t.yr / t.mo) * 100)}%</div>}{!annual && <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>billed monthly</div>}</>}</div>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.5, minHeight: 40 }}>{t.blurb}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0 18px", flex: 1 }}>{t.feats.map((ft, j) => (<div key={j} className="row" style={{ gap: 8, fontSize: 13 }}><Check size={15} color="#0E8C7E" /> {ft}</div>))}</div>
            <button className={"btn " + (t.highlight ? "btn-primary" : t.tag ? "btn-blue" : "btn-light")} style={{ width: "100%", justifyContent: "center" }} onClick={() => onChoose(t.key, annual)}>{t.cta}</button>
          </div>
        ))}</div>
        <div className="faint" style={{ fontSize: 12.5, marginTop: 24 }}>Prices exclude VAT. The free trial needs no card. Prototype for internal alignment.</div>
      </div>
    </div>
  );
}
const RoleSelect = ({ onPick }) => {
  const roles = [
    { k: "operator", l: "Operator (Founders)", d: "See the whole market at a glance in the Marketplace Command Centre (MCC).", i: Activity, c: "#06776F", bg: "var(--cyan-soft)" },
    { k: "agency", l: "Healthcare agency", d: "Identify opportunities, reach decision makers and win new business.", i: Briefcase, c: "#2D6BFF", bg: "#EEF3FF" },
    { k: "hospital", l: "Hospital / provider", d: "Find, compare and connect with the right workforce partner.", i: Building2, c: "#1E54E6", bg: "#EEF3FF" },
    { k: "clinician", l: "Clinician", d: "Showcase your experience and get matched to the right roles.", i: Stethoscope, c: "#7C5CFF", bg: "var(--violet-soft)" },
  ];
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 28, background: "linear-gradient(180deg,var(--bg2),var(--bg))" }}>
      <div style={{ width: "100%", maxWidth: 960 }}>
        <div className="row" style={{ justifyContent: "center", marginBottom: 8 }}><Wordmark /></div>
        <div className="ph-accent" style={{ margin: "0 auto 13px" }} /><h1 className="disp" style={{ textAlign: "center", fontSize: 27, fontWeight: 700, margin: "0 0 4px" }}>How will you use {APP_NAME}?</h1>
        <p className="muted" style={{ textAlign: "center", marginTop: 0 }}>Choose your view. You can switch any time.</p>
        <div className="grid g4" style={{ marginTop: 28 }}>{roles.map((r) => (<button key={r.k} onClick={() => onPick(r.k)} className="card lift" style={{ padding: 22, textAlign: "left", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = r.c)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}><div style={{ width: 48, height: 48, borderRadius: 13, background: r.bg, display: "grid", placeItems: "center" }}><r.i size={22} color={r.c} /></div><h3 style={{ fontSize: 16, fontWeight: 600, margin: "14px 0 6px" }}>{r.l}</h3><p className="muted" style={{ fontSize: 13, margin: 0 }}>{r.d}</p><div className="row" style={{ gap: 6, marginTop: 14, color: r.c, fontWeight: 600, fontSize: 13.5 }}>Enter <ChevronRight size={15} /></div></button>))}</div>
      </div>
    </div>
  );
};

/* ===================== shell ===================== */
const NAVS = {
  operator: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "command", l: "MCC", i: Activity }, { k: "ops", l: "Sign-ups & financials", i: BarChart3 }, { k: "feed", l: "Live feed", i: Rss }, { k: "suppliers", l: "Private clinics", i: Package }, { k: "leaderboard", l: "Leaderboard", i: Trophy }, { k: "inbox", l: "Enquiry inbox", i: Inbox }, { k: "opportunities", l: "Clinical Demand", i: Target }, { k: "savedOpps", l: "Saved", i: Star }, { k: "talentpool", l: "Talent pipeline", i: Users },
    { k: "decisionMakers", l: "Decision makers", i: Users }, { k: "execs", l: "Executive network", i: Briefcase }, { k: "aibot", l: "AI assistant", i: Sparkles }, { k: "whyswitch", l: "Why switch", i: Award }, { k: "marketmap", l: "Market map", i: Radar }, { k: "proposals", l: "Proposals", i: FileText },
    { k: "pipeline", l: "Pipeline & CRM", i: GitBranch }, { k: "weekly", l: "Weekly report", i: FileText }, { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss },
    { k: "analytics", l: "Analytics", i: BarChart3 }, { k: "clinicians", l: "Clinician network", i: Stethoscope },
    { k: "clients", l: "Clients & targets", i: Building2 }, { k: "casestudies", l: "Case studies", i: Award },
    { k: "playbook", l: "Incentive playbook", i: Zap }, { k: "events", l: "Round-tables", i: Ticket },
    { k: "register", l: "Register a company", i: ClipboardList }, { k: "whyqura", l: "Why Qura wins", i: Trophy }, { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "staffing", l: "Site staffing", i: Building2 }, { k: "mobileunits", l: "Mobile units", i: Truck }, { k: "brand", l: "Brand channels", i: Sparkles }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
  agency: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "dashboard", l: "Dashboard", i: LayoutDashboard }, { k: "feed", l: "Live feed", i: Rss }, { k: "suppliers", l: "Private clinics", i: Package }, { k: "leaderboard", l: "Leaderboard", i: Trophy }, { k: "inbox", l: "Enquiry inbox", i: Inbox }, { k: "opportunities", l: "Opportunities", i: Target }, { k: "savedOpps", l: "Saved", i: Star }, { k: "talentpool", l: "Talent pipeline", i: Users },
    { k: "decisionMakers", l: "Decision makers", i: Users }, { k: "execs", l: "Executive network", i: Briefcase }, { k: "aibot", l: "AI assistant", i: Sparkles }, { k: "whyswitch", l: "Why switch", i: Award }, { k: "marketmap", l: "Market map", i: Radar }, { k: "outreach", l: "Outreach", i: Send },
    { k: "proposals", l: "Proposals", i: FileText }, { k: "meetings", l: "Meetings", i: Calendar },
    { k: "pipeline", l: "Pipeline & CRM", i: GitBranch }, { k: "weekly", l: "Weekly report", i: FileText }, { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss },
    { k: "analytics", l: "Analytics", i: BarChart3 }, { k: "clinicians", l: "Clinician network", i: Stethoscope },
    { k: "clients", l: "Clients & targets", i: Building2 }, { k: "casestudies", l: "Case studies", i: Award },
    { k: "playbook", l: "Incentive playbook", i: Zap }, { k: "events", l: "Round-tables", i: Ticket },
    { k: "register", l: "Register a company", i: ClipboardList }, { k: "whyqura", l: "Why Qura wins", i: Trophy }, { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "staffing", l: "Site staffing", i: Building2 }, { k: "mobileunits", l: "Mobile units", i: Truck }, { k: "brand", l: "Brand channels", i: Sparkles }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
  hospital: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "feed", l: "Post & live feed", i: Rss }, { k: "clinicians", l: "Candidate search", i: Stethoscope }, { k: "execs", l: "Executive network", i: Briefcase }, { k: "talentpool", l: "Available talent", i: Users }, { k: "shortlists", l: "My shortlists", i: Heart },
    { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss },
    { k: "hdash", l: "Dashboard", i: LayoutDashboard }, { k: "weekly", l: "Weekly report", i: FileText }, { k: "findAgencies", l: "Find workforce suppliers", i: Briefcase }, { k: "meetings", l: "Meetings", i: Calendar },
    { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "staffing", l: "Site staffing", i: Building2 }, { k: "mobileunits", l: "Mobile units", i: Truck },
    { k: "casestudies", l: "Case studies", i: Award }, { k: "events", l: "Round-tables", i: Ticket }, { k: "whyqura", l: "Why Qura", i: Trophy }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
  clinician: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "profile", l: "My profile", i: UserCheck }, { k: "feed", l: "Live feed", i: Rss }, { k: "myopps", l: "Opportunities for me", i: Target },
    { k: "clinicianReg", l: "Get verified", i: ShieldCheck }, { k: "liveProjects", l: "Live projects", i: Radar }, { k: "network", l: "Network", i: Users }, { k: "messages", l: "Messages", i: MessageSquare }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss },
  ],
  gp: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "feed", l: "Post & live feed", i: Rss }, { k: "gpHub", l: "GP hub", i: Stethoscope }, { k: "clinicians", l: "Find GPs & locums", i: UserCheck }, { k: "shortlists", l: "My shortlists", i: Heart },
    { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss }, { k: "meetings", l: "Meetings", i: Calendar },
    { k: "findAgencies", l: "Find workforce suppliers", i: Briefcase }, { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "casestudies", l: "Case studies", i: Award }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
  care: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "feed", l: "Post & live feed", i: Rss }, { k: "careHub", l: "Care hub", i: Heart }, { k: "clinicians", l: "Find carers & nurses", i: Stethoscope }, { k: "shortlists", l: "My shortlists", i: Heart },
    { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss }, { k: "meetings", l: "Meetings", i: Calendar },
    { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "casestudies", l: "Case studies", i: Award }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
};
const ROLE_META = {
  operator: { label: "Co-Founder · Operator", who: "Operator", img: undefined },
  agency: { label: "Workforce supplier", who: "Apex Growth Partners" },
  hospital: { label: "Hospital / provider", who: "King's College Hospital" },
  clinician: { label: "Clinician", who: "Dr. Sarah Ahmed" },
  gp: { label: "GP practice", who: "The Practice" },
  care: { label: "Care provider", who: "Care Group" },
};

const FOUNDER_IDENTITY = {
  "olamideokulaja@gmail.com": { who: "Dr. Olamide Okulaja", label: "Co-Founder & CGO" },
  "folawiyoconsultancy@gmail.com": { who: "Ola Folawiyo", label: "Co-Founder & CEO" },
  "olamideokulaja@qurahealth.org": { who: "Dr. Olamide Okulaja", label: "Co-Founder & CGO" },
  "olafolawiyo@qurahealth.org": { who: "Ola Folawiyo", label: "Co-Founder & CEO" },
};

const TOUR = [
  { i: Activity, t: "Welcome to Qura", b: "Your healthcare growth CRM. Connect, engage and win, on merit. Here is a 20-second tour." },
  { i: Target, t: "See the whole market, live", b: "The Marketplace Command Centre (MCC) and dashboard track pipeline, opportunities and matches across every market in real time." },
  { i: Users, t: "Reach the right people", b: "Browse live opportunities and a verified register of decision makers across NHS trusts, ICBs and diagnostic centres." },
  { i: Sparkles, t: "Win work in seconds", b: "Turn any opportunity into a branded, send-ready proposal with AI, built on a decade of real deals." },
];
function Walkthrough({ onClose }) {
  const [i, setI] = useState(0);
  const s = TOUR[i]; const last = i === TOUR.length - 1; const Ico = s.i;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(10,23,51,.55)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 20 }} className="fade">
      <div className="card" style={{ maxWidth: 440, width: "100%", padding: 0, overflow: "hidden" }}>
        <div style={{ background: "radial-gradient(120% 90% at 100% 0%, #14294C 0%, var(--navy) 60%)", padding: "28px 28px 24px", color: "#fff" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(0,194,184,.16)", display: "grid", placeItems: "center", marginBottom: 14 }}><Ico size={24} color="#5FE6DC" /></div>
          <h2 className="disp" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{s.t}</h2>
          <p style={{ color: "#9FB0D0", fontSize: 14.5, marginTop: 8, lineHeight: 1.55 }}>{s.b}</p>
        </div>
        <div style={{ padding: "18px 26px 22px" }}>
          <div className="row" style={{ gap: 6, justifyContent: "center", marginBottom: 18 }}>{TOUR.map((_, j) => <span key={j} style={{ width: j === i ? 22 : 7, height: 7, borderRadius: 99, background: j === i ? "var(--teal)" : "var(--line)", transition: ".2s" }} />)}</div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn btn-light" onClick={onClose}>Skip</button>
            <div className="row" style={{ gap: 8 }}>{i > 0 && <button className="btn btn-light" onClick={() => setI(i - 1)}>Back</button>}<button className="btn btn-primary" onClick={() => last ? onClose() : setI(i + 1)}>{last ? "Get started" : "Next"} <ArrowRight size={15} /></button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
const NOTIFS = [
  { t: "New high-fit opportunity", b: "Imperial College Healthcare · Sonography", time: "2m", i: Target, dot: true },
  { t: "Decision maker replied", b: "Your proposal was opened", time: "1h", i: Mail, dot: true },
  { t: "Round-table seat confirmed", b: "Community Diagnostics forum", time: "3h", i: Ticket, dot: false },
  { t: "Clinician shortlisted", b: "Matched to 2 new roles", time: "1d", i: Stethoscope, dot: false },
];
function Shell({ role, onLogout, onHome, onSwitch, trial, onSignup, plan, onPlan, onExtend, isOwner, ownerEmail, profileName, onProfileName, founder }) {
  const nav = NAVS[role];
  const [active, setActive] = useState(nav[0].k);
  const [market, setMarket] = useState(role === "hospital" ? "nhs" : "all");
  const [upgradeTo, setUpgradeTo] = useState(null);
  const [lockedFrom, setLockedFrom] = useState(null);
  const marketOpts = role === "hospital" ? [["all", "All markets"], ["nhs", "NHS"], ["private", "Private"]] : [["all", "All markets"], ["nhs", "NHS"], ["private", "Private"], ["international", "International"]];
  const trialLeft = trial && trial.start ? Math.max(0, 7 + (trial.extra || 0) - Math.floor((Date.now() - trial.start) / 86400000)) : null;
  const trialMsg = trialLeft == null ? null : trialLeft > 0 ? (trialLeft + " " + (trialLeft === 1 ? "day" : "days") + " left in your free trial") : "Your free trial has ended";
  const trialTone = trialLeft == null ? null : trialLeft === 0 ? "ended" : trialLeft <= 1 ? "urgent" : "ok";
  const readOnly = !!trial && trialLeft === 0 && !["starter", "growth", "enterprise"].includes(plan);
  const trialPct = trial && trial.start ? Math.min(100, Math.max(0, ((Date.now() - trial.start) / ((7 + (trial.extra || 0)) * 86400000)) * 100)) : 0;
  useEffect(() => { if (trialLeft === 1) { setToast("Your free trial ends tomorrow. Choose a plan to keep access."); const tm = setTimeout(() => setToast(null), 3500); return () => clearTimeout(tm); } }, [trialLeft]);
  useEffect(() => { (async () => { if (trial && trialLeft > 0) { try { const w = await window.storage?.get("qura_trial_welcomed"); if (!w || !w.value) { setToast("Welcome to your 7-day free trial. You have full access to Qura."); setTimeout(() => setToast(null), 3800); try { window.storage?.set("qura_trial_welcomed", JSON.stringify(true)); } catch (e) {} } } catch (e) {} } })(); }, [trial]);
  const premiumScreens = PREMIUM_FEATURES.map((ft) => ft[0]);
  const premiumLocked = premiumScreens.includes(active) && !((PLAN_ACCESS[plan] || []).includes(active));
  const planOrder = ["starter", "growth", "enterprise"];
  const neededPlan = planOrder.find((pk) => (PLAN_ACCESS[pk] || []).includes(active)) || "growth";
  const unlockList = PREMIUM_FEATURES.filter(([k]) => (PLAN_ACCESS[neededPlan] || []).includes(k) && !((PLAN_ACCESS[plan] || []).includes(k))).map((ft) => ft[1]).join(", ");
  const activeLabel = (nav.find((n) => n.k === active) || {}).l || "this";
  const [feedPosts, setFeedPosts] = useState(FEED_SEED);
  const [userCat, setUserCat] = useState(null);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_feed"); if (r?.value) setFeedPosts(JSON.parse(r.value)); } catch (e) {} try { const c = await window.storage?.get("qura_catalogue"); if (c?.value) setUserCat(JSON.parse(c.value)); } catch (e) {} })(); }, [active]);
  const inboxNew = feedPosts.filter((p) => p.status === 0 && matchKit(p, userCat).length > 0).length;
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const meta = ROLE_META[role];
  const displayName = (profileName && profileName.trim()) || (founder && founder.who) || meta.who;
  const displayLabel = (founder && founder.label) || meta.label;
  const displayImg = (profileName && profileName.trim()) ? undefined : (founder ? founder.img : meta.img);
  const displayInit = displayName.split(" ").filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase();
  const firstName = displayName.replace(/^Dr\.?\s+/i, "").split(" ")[0];
  const [tour, setTour] = useState(false);
  const [q, setQ] = useState("");
  const [sOpen, setSOpen] = useState(false);
  const [bOpen, setBOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFS);
  const [aOpen, setAOpen] = useState(false);
  const closeTour = () => { setTour(false); try { window.storage?.set("qura_tour_done", "1"); } catch (e) {} };
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_tour_done"); if (!r?.value) setTour(true); } catch (e) {} })(); }, []);
  const { contacts: searchContacts } = useContacts();
  const ql = q.trim().toLowerCase();
  const sResults = [];
  if (ql) {
    const has = (k) => nav.some((n) => n.k === k);
    if (has("opportunities")) OPPS.forEach((o) => { if (o.org.toLowerCase().includes(ql) || o.role.toLowerCase().includes(ql)) sResults.push({ type: "Opportunity", label: o.org, sub: o.role, k: "opportunities", I: Target }); });
    if (has("decisionMakers")) searchContacts.forEach((d) => { if (d.name.toLowerCase().includes(ql) || d.org.toLowerCase().includes(ql)) sResults.push({ type: "Decision maker", label: d.name, sub: d.org, k: "decisionMakers", I: Users }); });
    if (has("clinicians")) CLINICIANS.forEach((c) => { if (c.name.toLowerCase().includes(ql) || c.spec.toLowerCase().includes(ql)) sResults.push({ type: "Clinician", label: c.name, sub: c.spec, k: "clinicians", I: Stethoscope }); });
  }
  const results = sResults.slice(0, 7);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("cura_active_" + role); if (r?.value) setActive(JSON.parse(r.value)); } catch (e) {} })(); }, [role]);
  useEffect(() => { if (!NAVS[role].some((n) => n.k === active)) setActive(NAVS[role][0].k); }, [role]);
  useEffect(() => { try { window.storage?.set("cura_active_" + role, JSON.stringify(active)); } catch (e) {} }, [active, role]);
  const go = (k) => { setActive(k); setOpen(false); window.scrollTo(0, 0); };
  const [propOpp, setPropOpp] = useState(null);
  const [sent, setSent] = useState([]);
  const [booked, setBooked] = useState([]);
  const bookMeeting = (m) => setBooked((p) => [{ ...m, id: Date.now() }, ...p]);
  const editMeeting = (id, patch) => setBooked((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x));
  const deleteMeeting = (id) => setBooked((p) => p.filter((x) => x.id !== id));
  const [moves, setMoves] = useState({});
  const moveDeal = (key, cur) => setMoves((m) => ({ ...m, [key]: Math.min(cur + 1, STAGES.length - 1) }));
  const moveBack = (key, cur) => setMoves((m) => ({ ...m, [key]: Math.max(cur - 1, 0) }));
  const [lost, setLost] = useState({});
  const markWon = (key) => setMoves((m) => ({ ...m, [key]: STAGES.length - 1 }));
  const markLost = (key) => setLost((l) => ({ ...l, [key]: true }));
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { (async () => { try { const a = await window.storage?.get("qura_sent"); if (a?.value) setSent(JSON.parse(a.value)); } catch (e) {} try { const b = await window.storage?.get("qura_booked"); if (b?.value) setBooked(JSON.parse(b.value)); } catch (e) {} try { const c = await window.storage?.get("qura_moves"); if (c?.value) setMoves(JSON.parse(c.value)); } catch (e) {} try { const d2 = await window.storage?.get("qura_lost"); if (d2?.value) setLost(JSON.parse(d2.value)); } catch (e) {} try { const mkt = await window.storage?.get("qura_market"); if (mkt?.value) setMarket(JSON.parse(mkt.value)); } catch (e) {} try { const up = await window.storage?.get("qura_upgrade"); if (up && up.value != null) setUpgradeTo(JSON.parse(up.value)); } catch (e) {} setHydrated(true); })(); }, []);
  useEffect(() => { if (hydrated) try { window.storage?.set("qura_sent", JSON.stringify(sent)); } catch (e) {} }, [sent, hydrated]);
  useEffect(() => { if (hydrated) try { window.storage?.set("qura_booked", JSON.stringify(booked)); } catch (e) {} }, [booked, hydrated]);
  useEffect(() => { if (hydrated) try { window.storage?.set("qura_moves", JSON.stringify(moves)); } catch (e) {} }, [moves, hydrated]);
  useEffect(() => { if (hydrated) try { window.storage?.set("qura_market", JSON.stringify(market)); } catch (e) {} }, [market, hydrated]);
  useEffect(() => { if (hydrated) try { window.storage?.set("qura_upgrade", JSON.stringify(upgradeTo)); } catch (e) {} }, [upgradeTo, hydrated]);
  useEffect(() => { if (hydrated) try { window.storage?.set("qura_lost", JSON.stringify(lost)); } catch (e) {} }, [lost, hydrated]);
  const openProposal = (o) => { setPropOpp(o || null); go("proposals"); };
  const onSaved = (opp) => { setSent((p) => [{ org: opp.org, role: opp.role, val: opp.val }, ...p]); setToast(`Proposal for ${opp.org} sent · logged to pipeline & meetings`); setTimeout(() => setToast(null), 3000); };
  const screen = () => {
    switch (active) {
      case "command": return <CommandCenter go={go} name={firstName} />;
      case "aibot": return <AgencyBot plan={plan} />;
      case "whyswitch": return <WhySwitch />;
      case "marketmap": return <MarketMap go={go} />;
      case "ops": return <OwnerOps isOwner={isOwner} />;
      case "news": return <IndustryNews />;
      case "feed": return <LiveFeedScreen role={role} displayName={displayName} go={go} market={market} onMarket={setMarket} onBook={bookMeeting} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "suppliers": return <SuppliersScreen onBook={bookMeeting} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "leaderboard": return <Leaderboard go={go} market={market} />;
      case "inbox": return <SupplierInbox go={go} market={market} onBook={bookMeeting} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "dashboard": return <Dashboard go={go} name={firstName} sentN={sent.length} bookedN={booked.length} />;
      case "opportunities": return <Opportunities go={go} market={market} onPropose={openProposal} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "savedOpps": return <SavedOpps onPropose={openProposal} market={market} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "decisionMakers": return <DecisionMakers plan={plan} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "outreach": return <Outreach />;
      case "proposals": return <Proposals onSaved={onSaved} initialOpp={propOpp} />;
      case "meetings": return <Meetings sent={sent} booked={booked} onBook={bookMeeting} onEdit={editMeeting} onDelete={deleteMeeting} />;
      case "pipeline": return <Pipeline sent={sent} moves={moves} onMove={moveDeal} onBack={moveBack} lost={lost} onWon={markWon} onLost={markLost} market={market} />;
      case "weekly": return <WeeklyReport sent={sent} booked={booked} moves={moves} lost={lost} name={firstName} email={ownerEmail} market={market} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "intel": return <Intel />;
      case "analytics": return <Analytics />;
      case "clinicians": return <ClinicianNetwork isOwner={isOwner} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "clinicianReg": return <ClinicianRegistration onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "howto": return <HowToUseQura email={ownerEmail} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "talentpool": return <TalentPipeline role={role} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "liveProjects": return <LiveProjects onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "execs": return <ExecNetwork onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "pricing": return <Pricing role={role} market={market} isOwner={isOwner} plan={plan} onChoose={(pk, annual) => { onPlan && onPlan(pk, annual); const unlocked = lockedFrom && (PLAN_ACCESS[pk] || []).includes(lockedFrom); const lockedLabel = (nav.find((n) => n.k === lockedFrom) || {}).l || "That feature"; const back = unlocked ? lockedFrom : null; setUpgradeTo(null); setLockedFrom(null); setToast(unlocked ? (lockedLabel + " unlocked") : (pk === "trial" ? "Free trial started" : "You are now on the " + (PLAN_LABEL[pk] || pk) + " plan")); setTimeout(() => setToast(null), 2800); if (back) go(back); }} highlight={upgradeTo} />;
      case "settings": return <SettingsScreen plan={plan} trialMsg={trialMsg} go={go} profileName={profileName} onName={onProfileName} />;
      case "admin": return <AdminScreen ownerEmail={ownerEmail} />;
      case "clients": return <ClientsTargets />;
      case "casestudies": return <CaseStudies />;
      case "events": return <EventsForums />;
      case "register": return <CompanyRegister />;
      case "whyqura": return <WhyQura />;
      case "tariffs": return <TariffRates />;
      case "staffing": return <StaffingBoard />;
      case "mobileunits": return <MobileUnits />;
      case "brand": return <BrandShowcase />;
      case "playbook": return <IncentivePlaybook />;
      case "hdash": return <HospitalDash go={go} />;
      case "psintel": return <PublicSectorIntel />;
      case "gpHub": return <GPHub go={go} name={firstName} />;
      case "careHub": return <CareHub go={go} name={firstName} />;
      case "relocation": return <RelocationHub role={role} onNav={go} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "accommodation": return <Accommodation onNav={go} onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "findAgencies": return <FindAgencies />;
      case "shortlists": return <Shortlists onToast={(m) => { setToast(m); setTimeout(() => setToast(null), 2800); }} />;
      case "profile": return <ClinicianProfile />;
      case "myopps": return <MyOpportunities />;
      case "network": return <NetworkScreen />;
      case "messages": return <MessagesScreen />;
      default: return <Dashboard go={go} name={firstName} />;
    }
  };
  const Side = (
    <div style={{ width: 258, background: "linear-gradient(192deg,#0E2342,#0A1730 56%,#070F22)", display: "flex", flexDirection: "column", height: "100%", padding: 16, borderRight: "1px solid rgba(255,255,255,.06)" }}>
      <button style={{ padding: "8px 8px 20px", textAlign: "left" }} onClick={onHome}><Wordmark light /></button>
      <div className="scrollx" style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>{nav.map((n) => (<button key={n.k} className={"navitem" + (active === n.k ? " active" : "")} onClick={() => go(n.k)}><n.i size={17} /><span style={{ flex: 1 }}>{n.l}</span>{n.k === "inbox" && inboxNew > 0 && <span style={{ background: "var(--cyan)", color: "#05201E", fontWeight: 700, fontSize: 10.5, minWidth: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", padding: "0 5px" }}>{inboxNew}</span>}{premiumScreens.includes(n.k) && !((PLAN_ACCESS[plan] || []).includes(n.k)) && <Lock size={12} style={{ opacity: 0.55, flexShrink: 0 }} />}</button>))}</div>
      <button onClick={() => go("pricing")} style={{ display: "block", width: "100%", textAlign: "left", background: "linear-gradient(135deg,rgba(0,194,184,.18),rgba(0,194,184,.05))", border: "1px solid rgba(0,194,184,.24)", borderRadius: 14, padding: 14, margin: "10px 0", cursor: "pointer" }}><div className="row" style={{ gap: 8 }}><Sparkles size={15} color="#5FE6DC" /><span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>Upgrade your plan</span></div><div style={{ color: "#9FB0D0", fontSize: 12, marginTop: 4 }}>AI proposals, full database and live intel.</div><div className="row" style={{ gap: 5, marginTop: 9, color: "#5FE6DC", fontWeight: 600, fontSize: 12 }}>View plans <ArrowRight size={13} /></div></button>
      <button className="navitem" onClick={onLogout}><LogOut size={17} /> Sign out</button>
    </div>
  );
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div className="hsm" style={{ height: "100%" }}>{Side}</div>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,23,51,.5)", zIndex: 40 }} />}
      {open && <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 41 }}>{Side}</div>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="row topbar-pad" style={{ justifyContent: "space-between", padding: "13px 28px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.78)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", flexShrink: 0, zIndex: 5 }}>
          <div className="row" style={{ gap: 12 }}>
            <button onClick={() => setOpen(true)} className="show-sm" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 11, width: 40, height: 40, alignItems: "center", justifyContent: "center", color: "var(--navy)" }}><Menu size={22} /></button>
            <div className="row hsm" style={{ position: "relative", zIndex: 19 }}>
              <div className="row" style={{ gap: 8, border: "1px solid var(--line)", borderRadius: 999, padding: "0 14px", width: 344, background: "var(--bg2)" }}><Search size={16} className="faint" /><input className="in" style={{ border: "none", boxShadow: "none", padding: "9px 0", background: "transparent" }} placeholder="Search organisations, contacts, clinicians" value={q} onChange={(e) => { setQ(e.target.value); setSOpen(true); }} onFocus={() => setSOpen(true)} /></div>
              {sOpen && q.trim() && (<><div onClick={() => setSOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 18 }} /><div className="card" style={{ position: "absolute", top: 46, left: 0, width: 360, maxHeight: 380, overflowY: "auto", zIndex: 20, padding: 6, boxShadow: "var(--sh-lg)" }}>{results.length ? results.map((r, i) => { const RI = r.I; return (<button key={i} onClick={() => { go(r.k); setSOpen(false); setQ(""); }} className="row" style={{ width: "100%", gap: 11, padding: "9px 10px", borderRadius: 10, textAlign: "left" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}><div style={{ width: 32, height: 32, borderRadius: 9, background: "#EEF3FF", display: "grid", placeItems: "center", flexShrink: 0 }}><RI size={15} color="#1E54E6" /></div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div><div className="faint" style={{ fontSize: 12 }}>{r.type} · {r.sub}</div></div></button>); }) : <div className="muted" style={{ padding: "16px 12px", fontSize: 13 }}>No matches for "{q}"</div>}</div></>)}
            </div>
          </div>
          <div className="row" style={{ gap: 16 }}>
            <span className="chip chip-grey hsm">{displayLabel}</span>
            <div className="row hsm" style={{ gap: 7, padding: "0 8px 0 12px", height: 40, borderRadius: 999, border: "1px solid var(--line)", background: "#fff" }}><Globe size={15} className="faint" /><select value={market} onChange={(e) => setMarket(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, fontWeight: 600, color: "var(--navy)", fontFamily: "inherit", cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}>{marketOpts.map(([k, l]) => (<option key={k} value={k}>{l}</option>))}</select><span className="num" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--teal)" }}>{CURRENCY[market].code}{CURRENCY[market].rate !== 1 ? " · " + CURRENCY[market].sym + CURRENCY[market].rate + "/£" : ""}</span><ChevronDown size={14} className="faint" /></div><div style={{ position: "relative", zIndex: 19 }}><button onClick={() => setBOpen((v) => !v)} className="iconbtn" style={{ position: "relative" }}><Bell size={20} className="muted" />{notifs.some((n) => n.dot) && <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 9, background: "var(--red)" }} />}</button>
              {bOpen && (<><div onClick={() => setBOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 18 }} /><div className="card" style={{ position: "absolute", top: 40, right: 0, width: 320, zIndex: 20, padding: 0, overflow: "hidden", boxShadow: "var(--sh-lg)" }}><div className="row" style={{ justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--line)" }}><span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span><button onClick={() => setNotifs(notifs.map((n) => ({ ...n, dot: false })))} style={{ fontSize: 12.5, color: "#076B61", fontWeight: 600 }}>Mark all read</button></div><div style={{ maxHeight: 340, overflowY: "auto" }}>{notifs.map((n, i) => { const NI = n.i; return (<div key={i} className="row" style={{ gap: 11, padding: "12px 16px", borderBottom: i < notifs.length - 1 ? "1px solid var(--line)" : "none", background: n.dot ? "rgba(0,194,184,.05)" : "transparent" }}><div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--cyan-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><NI size={16} color="#06776F" /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.t}</div><div className="muted" style={{ fontSize: 12.5 }}>{n.b}</div></div><span className="faint" style={{ fontSize: 11.5, flexShrink: 0 }}>{n.time}</span></div>); })}</div><button className="row" style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 13, fontWeight: 600, color: "var(--navy)", borderTop: "1px solid var(--line)" }} onClick={() => setBOpen(false)}>View all activity</button></div></>)}
            </div>
            <div style={{ position: "relative", zIndex: 19 }}>
              <button className="row" onClick={() => setAOpen((v) => !v)} style={{ gap: 9, background: "none" }}><Avatar src={displayImg} initials={displayInit} size={36} /><div className="hsm" style={{ lineHeight: 1.2, textAlign: "left" }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{displayName}</div><div className="faint" style={{ fontSize: 11.5 }}>{displayLabel}</div></div></button>
              {aOpen && (<><div onClick={() => setAOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 18 }} /><div className="card" style={{ position: "absolute", top: 48, right: 0, width: 258, zIndex: 20, padding: 8, boxShadow: "var(--sh-lg)" }}>
                <div style={{ padding: "8px 10px 12px" }}><div style={{ fontWeight: 700, fontSize: 14 }}>{displayName}</div><div className="faint" style={{ fontSize: 12 }}>{displayLabel}</div>{plan && <span className="chip chip-cyan" style={{ fontSize: 10, marginTop: 7 }}>{PLAN_LABEL[plan] || plan}</span>}{trialMsg && <div className="muted" style={{ fontSize: 11.5, marginTop: 5 }}>{trialMsg}</div>}</div>
                {(isOwner || founder) && <div style={{ borderTop: "1px solid var(--line)", padding: "10px 4px 4px" }}><div className="faint" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "0 6px 8px" }}>Switch view</div>{["operator", "agency", "hospital", "clinician"].map((rk) => (<button key={rk} onClick={() => { onSwitch(rk); setAOpen(false); }} className="row" style={{ width: "100%", justifyContent: "space-between", gap: 8, padding: "8px 10px", borderRadius: 9, background: rk === role ? "var(--bg)" : "transparent", fontSize: 13.5, fontWeight: rk === role ? 600 : 500 }} onMouseEnter={(e) => { if (rk !== role) e.currentTarget.style.background = "var(--bg)"; }} onMouseLeave={(e) => { if (rk !== role) e.currentTarget.style.background = "transparent"; }}>{ROLE_META[rk] ? ROLE_META[rk].label : rk}{rk === role && <Check size={15} color="#0E8C7E" />}</button>))}</div>}
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: 6, marginTop: 6 }}>{isOwner && <button onClick={() => { go("admin"); setAOpen(false); }} className="row" style={{ width: "100%", gap: 9, padding: "9px 10px", borderRadius: 9, fontSize: 13.5, fontWeight: 500 }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}><ShieldCheck size={15} className="muted" /> Admin</button>}<button onClick={() => { go("settings"); setAOpen(false); }} className="row" style={{ width: "100%", gap: 9, padding: "9px 10px", borderRadius: 9, fontSize: 13.5, fontWeight: 500 }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}><Settings size={15} className="muted" /> Settings</button><button onClick={onLogout} className="row" style={{ width: "100%", gap: 9, padding: "9px 10px", borderRadius: 9, color: "var(--red)", fontSize: 13.5, fontWeight: 600 }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--red-bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}><LogOut size={15} /> Sign out</button></div>
              </div></>)}
            </div>
          </div>
        </div>
        <div className="scrolly appcanvas" style={{ flex: 1, overflowY: "auto", padding: "34px 38px", background: "linear-gradient(180deg,var(--bg2),var(--bg) 300px)" }}><div className="fade" style={{ maxWidth: "none", margin: "0 auto" }} key={active}>{trial && (<div className="card" style={{ padding: "14px 18px", marginBottom: 18, background: trialTone === "ended" ? "var(--red-bg)" : trialTone === "urgent" ? "rgba(245,158,11,.14)" : "linear-gradient(120deg,var(--cyan-soft),#fff 70%)", border: "1px solid " + (trialTone === "ended" ? "var(--red)" : trialTone === "urgent" ? "#F59E0B" : "var(--cyan)") }}><div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}><div className="row" style={{ gap: 10 }}><Sparkles size={17} color={trialTone === "ended" ? "#C0362C" : trialTone === "urgent" ? "#B45309" : "#06776F"} /><div><div className="row" style={{ gap: 8, fontWeight: 700, fontSize: 14 }}><span>{trialTone === "ended" ? "Your free trial has ended" : trialTone === "urgent" ? "Last day of your free trial" : ("Free trial · " + trialLeft + " days left")}</span>{trial.extended && <span className="chip chip-grey" style={{ fontSize: 9.5, fontWeight: 700 }}>Extended</span>}</div><div className="muted" style={{ fontSize: 12.5 }}>{trialTone === "ended" ? "Sign up to continue using Qura." : trialTone === "urgent" ? "Sign up today to keep your data and access." : "Sign up any time to keep your data and unlock every market."}</div></div></div><div className="row" style={{ gap: 12 }}>{trial && !trial.extended && <button onClick={() => { onExtend && onExtend(); setToast("Free trial extended by 3 days."); setTimeout(() => setToast(null), 2800); }} style={{ color: "var(--teal)", fontWeight: 600, background: "none", cursor: "pointer", fontSize: 12.5 }}>Extend +3 days</button>}<button className="btn btn-primary" onClick={onSignup}>Sign up</button></div></div>{trialTone !== "ended" && <div style={{ height: 5, borderRadius: 5, background: "rgba(10,23,51,.08)", marginTop: 12, overflow: "hidden" }} title={Math.round(trialPct) + "% of your trial used"}><div style={{ height: "100%", width: trialPct + "%", background: trialTone === "urgent" ? "#F59E0B" : "linear-gradient(90deg,var(--teal),var(--cyan))", borderRadius: 5, transition: ".3s" }} /></div>}</div>)}{premiumLocked && (<div className="card" style={{ padding: "14px 18px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, background: "linear-gradient(120deg,rgba(45,107,255,.08),#fff 70%)", border: "1px solid var(--blue)" }}><div className="row" style={{ gap: 10 }}><Sparkles size={17} color="#2D6BFF" /><div><div style={{ fontWeight: 700, fontSize: 14 }}>{activeLabel} is a {PLAN_LABEL[neededPlan]} feature</div><div className="muted" style={{ fontSize: 12.5 }}>Upgrade to {PLAN_LABEL[neededPlan]} to unlock {unlockList || "the full experience"}.</div></div></div><div className="row" style={{ gap: 14, flexShrink: 0 }}><button onClick={() => { setUpgradeTo(neededPlan); setLockedFrom(active); go("pricing"); }} style={{ color: "var(--blue)", fontWeight: 600, background: "none", cursor: "pointer", fontSize: 12.5 }}>Compare plans</button><button className="btn" style={{ background: "var(--blue)", color: "#fff" }} onClick={() => { setUpgradeTo(neededPlan); setLockedFrom(active); go("pricing"); }}>Upgrade to {PLAN_LABEL[neededPlan]}</button></div></div>)}{screen()}</div></div>
      </div>
      {readOnly && active !== "pricing" && (<div className="fade" style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(7,14,32,.55)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", padding: 24 }}><div className="card" style={{ maxWidth: 440, padding: 34, textAlign: "center" }}><div style={{ width: 58, height: 58, borderRadius: 999, background: "var(--red-bg)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}><Sparkles size={28} color="#C0362C" /></div><h2 className="disp" style={{ fontSize: 23, fontWeight: 700 }}>Your free trial has ended</h2><p className="muted" style={{ fontSize: 14.5, marginTop: 8, lineHeight: 1.55 }}>Qura is in read-only preview. Choose a plan to keep posting, booking and winning work.</p><button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 20, padding: 13 }} onClick={() => go("pricing")}>Choose a plan <ArrowRight size={16} /></button>{trial && !trial.extended && <button className="btn btn-light" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => onExtend && onExtend()}>Extend my trial 3 days</button>}<button onClick={onSignup} style={{ color: "var(--muted)", fontWeight: 600, background: "none", cursor: "pointer", fontSize: 13, marginTop: 14 }}>See sign-up options</button></div></div>)}
      {toast && <div className="fade" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "var(--navy)", color: "#fff", padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, display: "flex", gap: 9, alignItems: "center", boxShadow: "0 12px 30px rgba(10,23,51,.3)" }}><Check size={17} color="#5FE6DC" /> {toast}</div>}
      {tour && <Walkthrough onClose={closeTour} />}
      <style>{`@media(max-width:960px){.login-wrap{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

/* ===================== root ===================== */
function RoleChoiceScreen({ onPick, onHome }) {
  const roles = [
    { k: "operator", t: "Operator (Founder)", d: "Run and grow the marketplace across every market.", i: Activity, c: "#00C2B8", bg: "rgba(0,194,184,.14)" },
    { k: "agency", t: "Workforce supplier", d: "Win and manage placements and contracts.", i: Briefcase, c: "#2D6BFF", bg: "rgba(45,107,255,.14)" },
    { k: "hospital", t: "Hospital / Provider", d: "Post vacancies and see our candidates.", i: Building2, c: "#0E8C7E", bg: "rgba(14,140,126,.14)" },
    { k: "gp", t: "GP Practice", d: "Fill sessions and find available GPs.", i: Stethoscope, c: "#0E8C7E", bg: "rgba(14,140,126,.14)" },
    { k: "care", t: "Complex Care, Care Homes & SEND", d: "Staff the care sector, compliance built in.", i: Heart, c: "#C8102E", bg: "rgba(200,16,46,.12)" },
    { k: "clinician", t: "Clinician", d: "Find opportunities that fit you.", i: UserCheck, c: "#7B5CFF", bg: "rgba(123,92,255,.14)" },
  ];
  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "grid", placeItems: "center", padding: 24, overflow: "hidden", background: "radial-gradient(135% 120% at 0% 0%, #102A4F 0%, #0A1730 46%, #070E20 100%)" }}>
      <div className="login-orb orb-float" style={{ top: -130, right: -90, width: 440, height: 440, background: "radial-gradient(circle, rgba(0,194,184,.30), transparent 70%)" }} />
      <div className="login-orb orb-float" style={{ bottom: -150, left: -110, width: 480, height: 480, background: "radial-gradient(circle, rgba(45,107,255,.22), transparent 70%)" }} />
      <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 30, left: 34, zIndex: 4 }}><Wordmark light /></button>
      <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 32, right: 34, zIndex: 4, padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.28)", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>{"←"} Back to home</button>
      <div className="reveal" style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 680 }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <span className="chip" style={{ background: "rgba(0,194,184,.16)", color: "#5FE6DC", border: "1px solid rgba(0,194,184,.32)" }}><Sparkles size={13} /> Set up your account</span>
          <h1 className="disp" style={{ color: "#fff", fontSize: 30, fontWeight: 700, margin: "18px 0 6px", lineHeight: 1.15 }}>Which best describes you?</h1>
          <p style={{ color: "#9FB0D0", fontSize: 15, marginTop: 0 }}>Choose how you'll use Qura. You can switch views later.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>{roles.map((r) => (
          <button key={r.k} onClick={() => onPick(r.k)} style={{ textAlign: "left", padding: "22px 22px 20px", cursor: "pointer", borderRadius: 18, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", flexDirection: "column", gap: 14, minWidth: 0, transition: "all .18s ease" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.09)"; e.currentTarget.style.borderColor = "rgba(0,194,184,.5)"; e.currentTarget.style.transform = "translateY(-3px)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.transform = "none"; }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: r.bg, display: "grid", placeItems: "center", flexShrink: 0 }}><r.i size={26} color={r.c} /></div>
              <span style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(255,255,255,.08)", display: "grid", placeItems: "center" }}><ArrowRight size={17} color="#fff" /></span>
            </div>
            <div>
              <div className="disp" style={{ fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 4 }}>{r.t}</div>
              <div style={{ color: "#9FB0D0", fontSize: 13.5, lineHeight: 1.45 }}>{r.d}</div>
            </div>
          </button>
        ))}</div>
      </div>
    </div>
  );
}

function AuthPanel({ mode = "in", roleLabel, onHome, onCreateAccount, onBackToSignIn }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!supabase) { setMsg("Accounts are not switched on yet."); return; }
    if (!email || !pw) { setMsg("Enter your email and password."); return; }
    setBusy(true); setMsg("");
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) setMsg(error.message); else setMsg("Account created. If asked, check your email to confirm, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) setMsg(error.message);
      }
    } catch (e) { setMsg(String(e)); }
    setBusy(false);
  };
  const soon = () => setMsg("SSO and NHS Mail sign-in are coming soon. Please continue with your email and password.");
  const up = mode === "up";
  return (
  <div style={{ minHeight: "100vh", position: "relative", display: "grid", placeItems: "center", padding: 24, overflow: "hidden", background: "radial-gradient(135% 120% at 0% 0%, #102A4F 0%, #0A1730 46%, #070E20 100%)" }}>
    <div className="login-orb orb-float" style={{ top: -130, right: -90, width: 440, height: 440, background: "radial-gradient(circle, rgba(0,194,184,.30), transparent 70%)" }} />
    <div className="login-orb orb-float" style={{ bottom: -150, left: -110, width: 480, height: 480, background: "radial-gradient(circle, rgba(45,107,255,.22), transparent 70%)" }} />
    <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 30, left: 34, zIndex: 4 }}><Wordmark light /></button>
      <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 32, right: 34, zIndex: 4, padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.28)", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>{"←"} Back to home</button>
    <div className="row login-card reveal" style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 940, gap: 0, borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 110px rgba(0,0,0,.5)", alignItems: "stretch", border: "1px solid rgba(255,255,255,.1)" }}>
      <div className="login-brand hsm" style={{ flex: "1 1 0", padding: "46px 44px", background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02))", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <div>
          <span className="chip" style={{ background: "rgba(0,194,184,.16)", color: "#5FE6DC", border: "1px solid rgba(0,194,184,.32)" }}><Sparkles size={13} /> Healthcare growth engine</span>
          <h1 className="disp" style={{ fontSize: 33, fontWeight: 700, margin: "24px 0 14px", lineHeight: 1.12 }}>Win the right work, faster.</h1>
          <p style={{ color: "#9FB0D0", fontSize: 15, lineHeight: 1.6, maxWidth: 380 }}>One intelligent platform linking workforce suppliers, hospitals and clinicians across NHS, private and international markets.</p>
        </div>
        <div>
          <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "0 0 22px" }} />
          <div className="row" style={{ gap: 28 }}>{[["13,000+", "LinkedIn community"], ["100K+", "Decision-makers reached"], ["50+", "Countries"]].map(([n, l]) => (<div key={l}><div className="disp num" style={{ fontSize: 22, fontWeight: 700 }}>{n}</div><div style={{ color: "#8295B6", fontSize: 12 }}>{l}</div></div>))}</div>
        </div>
      </div>
      <div className="login-auth" style={{ flex: "1 1 0", background: "#fff", padding: "46px 42px", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <button className="show-sm" onClick={onHome} style={{ marginBottom: 20, alignSelf: "flex-start" }}><Wordmark /></button>
        <div className="ph-accent" />
        <h2 className="disp" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>{up ? "Create your account" : ("Sign in to " + APP_NAME)}</h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{up ? (roleLabel ? ("Creating your " + roleLabel + " account") : "Join Qura in a few seconds.") : "Welcome back. Let us find your next opportunity."}</p>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "20px 0 0" }}>Work email</label>
        <div className="login-field"><Mail size={16} className="faint" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@qurahealth.org" /></div>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "16px 0 0" }}>Password</label>
        <div className="login-field"><ShieldCheck size={16} className="faint" /><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
        {!up && <div className="row" style={{ justifyContent: "flex-end", marginTop: 12, fontSize: 12.5 }}><span style={{ color: "var(--teal)", fontWeight: 600, cursor: "pointer" }} onClick={soon}>Forgot password?</span></div>}
        {msg && <div className="muted" style={{ fontSize: 13, marginTop: 14, background: "var(--bg)", padding: "10px 12px", borderRadius: 10, lineHeight: 1.45 }}>{msg}</div>}
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18, padding: 13 }} onClick={submit} disabled={busy}>{busy ? "Please wait..." : (up ? "Create account" : "Sign in")} <ArrowRight size={16} /></button>
        <div className="row" style={{ gap: 12, margin: "18px 0", color: "var(--faint)", fontSize: 12 }}><div style={{ flex: 1, height: 1, background: "var(--line)" }} /> or continue with <div style={{ flex: 1, height: 1, background: "var(--line)" }} /></div>
        <div className="row" style={{ gap: 10 }}><button className="btn btn-light" style={{ flex: 1, justifyContent: "center", background: "var(--bg)" }} onClick={soon}><ShieldCheck size={15} /> SSO</button><button className="btn btn-light" style={{ flex: 1, justifyContent: "center", background: "var(--bg)" }} onClick={soon}><Mail size={15} /> NHS Mail</button></div>
        <div className="row" style={{ justifyContent: "center", gap: 6, marginTop: 18, fontSize: 13 }}><span className="muted">{up ? "Already have an account?" : "New member?"}</span><button onClick={() => { setMsg(""); if (up) { onBackToSignIn && onBackToSignIn(); } else { onCreateAccount && onCreateAccount(); } }} style={{ color: "var(--teal)", fontWeight: 700, background: "none", cursor: "pointer" }}>{up ? "Sign in" : "Create account"}</button></div>
      </div>
    </div>
  </div>
  );
}

function BillingResult({ result, onSignIn, onClose }) {
  const ok = result === "success";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(6,14,30,.62)", display: "grid", placeItems: "center", padding: 20, backdropFilter: "blur(3px)" }}>
      {ok ? <div className="toast" style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 210, background: "var(--navy)", color: "#fff", padding: "12px 20px", borderRadius: 999, fontSize: 13.5, fontWeight: 600, boxShadow: "0 12px 34px rgba(10,23,48,.34)" }}>
        <span className="row" style={{ gap: 8 }}><Check size={15} color="#00C2B8" /> Payment successful</span>
      </div> : null}
      <div className="card reveal in" style={{ maxWidth: 520, width: "100%", padding: 38, textAlign: "center", position: "relative", overflow: "hidden" }}>
        {ok ? <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg,var(--teal),var(--cyan))" }} /> : null}
        <div style={{ width: 70, height: 70, borderRadius: 999, background: ok ? "var(--cyan-soft)" : "var(--amber-bg)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
          {ok ? <Check size={32} color="#06776F" /> : <AlertCircle size={30} color="#B45309" />}
        </div>
        {ok ? (
          <>
            <h2 className="disp" style={{ fontSize: 27, fontWeight: 800, margin: "0 0 8px" }}>Welcome to the {APP_NAME} community</h2>
            <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.65, maxWidth: 400, margin: "0 auto 6px" }}>Your payment went through and your subscription is active. A receipt is on its way to your inbox.</p>
            <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.65, maxWidth: 400, margin: "0 auto 24px" }}>Sign back in to unlock everything on your plan.</p>
            <button className="btn btn-primary lift" style={{ padding: "13px 26px", fontSize: 15 }} onClick={onSignIn}>Sign in to {APP_NAME} <ArrowRight size={16} /></button>
            <div style={{ marginTop: 14 }}><button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--muted)" }}>Back to the website</button></div>
          </>
        ) : (
          <>
            <h2 className="disp" style={{ fontSize: 25, fontWeight: 700, margin: "0 0 8px" }}>Checkout cancelled</h2>
            <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.65, maxWidth: 400, margin: "0 auto 24px" }}>No payment was taken. You can pick a plan again whenever you are ready.</p>
            <button className="btn btn-light" onClick={onClose}>Back to the website</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState("landing");
  // Click tracking and session replay follow the visitor: on for the public
  // site, off the moment they are inside the product.
  useEffect(() => { setMarketingMode(stage !== "app"); }, [stage]);
  const [billingResult, setBillingResult] = useState(null);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("billing");
      if (q === "success" || q === "cancelled") {
        setBillingResult(q);
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch (e) {}
  }, []);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [trial, setTrial] = useState(null);
  const [plan, setPlan] = useState(null);
  const [ready, setReady] = useState(false);
  const [authMode, setAuthMode] = useState("in");
  const [pendingRole, setPendingRole] = useState(null);
  const [profileName, setProfileName] = useState("");
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_profile_name"); setProfileName(r?.value || ""); } catch (e) {} })(); }, [session, stage]);
  const email = ((session && session.user && session.user.email) || "").toLowerCase();
  const founder = FOUNDER_IDENTITY[email] || null;
  useEffect(() => { if (founder && stage === "app") setRole("operator"); }, [founder, stage]);
  const isOwner = OWNER_EMAILS.length === 0 || OWNER_EMAILS.includes(email) || Boolean(FOUNDER_IDENTITY[email]);

  const loadAccount = async () => {
    try { const r = await window.storage?.get("qura_role"); setRole(r && r.value ? JSON.parse(r.value) : null); } catch (e) {}
    try { const t = await window.storage?.get("qura_trial"); if (t?.value) setTrial(JSON.parse(t.value)); } catch (e) {}
    try { const pl = await window.storage?.get("qura_plan"); if (pl?.value) setPlan(JSON.parse(pl.value)); } catch (e) {}
  };
  const saveRole = async (r) => { setRole(r); try { await window.storage?.set("qura_role", JSON.stringify(r)); } catch (e) {} };

  useEffect(() => {
    let unsub;
    (async () => {
      if (supabaseEnabled && supabase) {
        try { const { data } = await supabase.auth.getSession(); setSession(data.session); } catch (e) {}
        try { const r = supabase.auth.onAuthStateChange((_e, sx) => setSession(sx)); unsub = r.data.subscription; } catch (e) {}
      }
      await loadAccount();
      setReady(true);
    })();
    return () => { try { unsub && unsub.unsubscribe(); } catch (e) {} };
  }, []);

  const sid = session && session.user && session.user.id;
  useEffect(() => { if (ready) loadAccount(); }, [sid]);

  useEffect(() => {
    if (!supabaseEnabled) return;
    if (session && stage === "auth") {
      (async () => {
        let existing = null;
        try { const r = await window.storage?.get("qura_role"); existing = r && r.value ? JSON.parse(r.value) : null; } catch (e) {}
        if (existing) { setRole(existing); setStage("app"); }
        else if (pendingRole) { await saveRole(pendingRole); setStage("app"); }
        else { setStage("roleChoice"); }
        setPendingRole(null);
      })();
    }
  }, [session, stage]);

  const logTrial = async (name) => { try { const r = await window.storage?.get("qura_trial_events"); const arr = r && r.value ? JSON.parse(r.value) : []; arr.push({ name, at: Date.now() }); window.storage?.set("qura_trial_events", JSON.stringify(arr.slice(-50))); } catch (e) {} };
  const startTrial = () => { const t = { start: Date.now() }; setTrial(t); try { window.storage?.set("qura_trial", JSON.stringify(t)); } catch (e) {} logTrial("trial_started"); };
  const extendTrial = () => { setTrial((t) => { if (!t || t.extended) return t; const nt = { ...t, extra: (t.extra || 0) + 3, extended: true }; try { window.storage?.set("qura_trial", JSON.stringify(nt)); } catch (e) {} return nt; }); logTrial("trial_extended"); };
  const choosePlan = (pl, annual = true) => { if (billingEnabled && (pl === "starter" || pl === "growth")) { startCheckout(pl, annual); return; } setPlan(pl); try { window.storage?.set("qura_plan", JSON.stringify(pl)); } catch (e) {} logTrial("plan_" + pl); if (pl === "trial") startTrial(); };

  const enterApp = () => { if (role) setStage("app"); else setStage("roleChoice"); };
  const getStarted = () => { if (supabaseEnabled && session) enterApp(); else setStage("roleChoice"); };
  const goSignIn = () => { if (supabaseEnabled && session) enterApp(); else if (supabaseEnabled) { setPendingRole(null); setAuthMode("in"); setStage("auth"); } else enterApp(); };
  const pickRole = async (r) => { if (supabaseEnabled && !session) { setPendingRole(r); setAuthMode("up"); setStage("auth"); } else { await saveRole(r); setStage("app"); } };
  const switchRole = (rk) => { setRole(rk); };
  const logout = async () => { try { if (supabase) await supabase.auth.signOut(); } catch (e) {} setStage("landing"); if (!supabaseEnabled) setRole(null); };
  const home = () => setStage("landing");
  const roleLabelOf = (r) => ({ operator: "Operator", agency: "Workforce supplier", hospital: "Hospital / Provider", clinician: "Clinician" }[r] || r);

  if (!ready) return <div className="cura" style={{ display: "grid", placeItems: "center", height: "100vh" }}><style>{STYLES}</style><Loader2 size={28} className="pulse" color="#2D6BFF" /></div>;
  return (
    <div className="cura">
      <style>{STYLES}</style>
      <CookieConsent />
      {billingResult ? <BillingResult result={billingResult} onSignIn={() => { setBillingResult(null); goSignIn(); }} onClose={() => setBillingResult(null)} /> : null}
      {stage === "landing" && <Landing onEnter={goSignIn} onDemo={() => setStage("demo")} />}
      {stage === "demo" && <DemoBooking onHome={home} onSignIn={goSignIn} />}
      {stage === "roleChoice" && <RoleChoiceScreen onPick={pickRole} onHome={home} />}
      {stage === "auth" && <AuthPanel mode={authMode} roleLabel={authMode === "up" && pendingRole ? roleLabelOf(pendingRole) : null} onHome={home} onCreateAccount={() => setStage("roleChoice")} onBackToSignIn={() => { setPendingRole(null); setAuthMode("in"); }} />}
      {stage === "signup" && <Signup onHome={home} onSignIn={goSignIn} onChoose={(pl, annual) => { choosePlan(pl, annual); setStage("app"); }} />}
      {stage === "app" && role && <Shell role={role} trial={trial} plan={plan} onPlan={choosePlan} onExtend={extendTrial} onSignup={() => setStage("signup")} onLogout={logout} onHome={home} onSwitch={switchRole} isOwner={isOwner} ownerEmail={email} profileName={profileName} onProfileName={setProfileName} founder={founder} />}
    </div>
  );
}
