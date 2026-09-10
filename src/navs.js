import {
  Activity, Award, BarChart3, Briefcase, Building2, Calendar,
  ClipboardList, CreditCard, FileText, GitBranch, Globe, GraduationCap,
  Heart, Home, Inbox, LayoutDashboard, MessageSquare, Network,
  Package, Radar, Rss, Send, ShieldCheck, Sparkles,
  Star, Stethoscope, Target, Ticket, Trophy, Truck,
  UserCheck, Users, Zap,
} from "lucide-react";

// The navigation registry.
//
// Lifted out of App.jsx unchanged so that src/navigation.test.js can check the
// consolidated lens configuration against the real thing. A coverage test that
// reads a copy of the data proves nothing.
//
// This is the flat list per role as it has always been. src/data/navigation.js
// groups these keys into 5 to 7 primary destinations per lens without removing
// any of them; lenses with no group config still render straight from here.

export const NAVS = {
  operator: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "academy", l: "Qura Academy", i: Award }, { k: "command", l: "MCC", i: Activity }, { k: "ops", l: "Sign-ups & financials", i: BarChart3 }, { k: "feed", l: "Live feed", i: Rss }, { k: "suppliers", l: "Private clinics", i: Package }, { k: "leaderboard", l: "Leaderboard", i: Trophy }, { k: "inbox", l: "Enquiry inbox", i: Inbox }, { k: "opportunities", l: "Clinical Demand", i: Target }, { k: "savedOpps", l: "Saved", i: Star }, { k: "talentpool", l: "Talent pipeline", i: Users },
    { k: "decisionMakers", l: "Decision makers", i: Users }, { k: "execs", l: "Executive network", i: Briefcase }, { k: "aibot", l: "AI assistant", i: Sparkles }, { k: "whyswitch", l: "Why switch", i: Award }, { k: "marketmap", l: "Market map", i: Radar }, { k: "proposals", l: "Proposals", i: FileText },
    { k: "pipeline", l: "Pipeline & CRM", i: GitBranch }, { k: "weekly", l: "Weekly report", i: FileText }, { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss },
    { k: "analytics", l: "Analytics", i: BarChart3 }, { k: "clinicians", l: "Clinician network", i: Stethoscope },
    { k: "clients", l: "Clients & targets", i: Building2 }, { k: "casestudies", l: "Case studies", i: Award },
    { k: "playbook", l: "Incentive playbook", i: Zap }, { k: "events", l: "Round-tables", i: Ticket },
    { k: "register", l: "Register a company", i: ClipboardList }, { k: "whyqura", l: "Why Qura wins", i: Trophy }, { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "staffing", l: "Site staffing", i: Building2 }, { k: "mobileunits", l: "Mobile units", i: Truck }, { k: "brand", l: "Brand channels", i: Sparkles }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
  agency: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "academy", l: "Qura Academy", i: Award }, { k: "dashboard", l: "Dashboard", i: LayoutDashboard }, { k: "standing", l: "Your Qura standing", i: ShieldCheck }, { k: "feed", l: "Live feed", i: Rss }, { k: "suppliers", l: "Private clinics", i: Package }, { k: "leaderboard", l: "Leaderboard", i: Trophy }, { k: "inbox", l: "Enquiry inbox", i: Inbox }, { k: "opportunities", l: "Opportunities", i: Target }, { k: "savedOpps", l: "Saved", i: Star }, { k: "talentpool", l: "Talent pipeline", i: Users },
    { k: "decisionMakers", l: "Decision makers", i: Users }, { k: "execs", l: "Executive network", i: Briefcase }, { k: "aibot", l: "AI assistant", i: Sparkles }, { k: "whyswitch", l: "Why switch", i: Award }, { k: "marketmap", l: "Market map", i: Radar }, { k: "outreach", l: "Outreach", i: Send },
    { k: "proposals", l: "Proposals", i: FileText }, { k: "meetings", l: "Meetings", i: Calendar },
    { k: "pipeline", l: "Pipeline & CRM", i: GitBranch }, { k: "weekly", l: "Weekly report", i: FileText }, { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss },
    { k: "analytics", l: "Analytics", i: BarChart3 }, { k: "clinicians", l: "Clinician network", i: Stethoscope },
    { k: "clients", l: "Clients & targets", i: Building2 }, { k: "casestudies", l: "Case studies", i: Award },
    { k: "playbook", l: "Incentive playbook", i: Zap }, { k: "events", l: "Round-tables", i: Ticket },
    { k: "register", l: "Register a company", i: ClipboardList }, { k: "whyqura", l: "Why Qura wins", i: Trophy }, { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "staffing", l: "Site staffing", i: Building2 }, { k: "mobileunits", l: "Mobile units", i: Truck }, { k: "brand", l: "Brand channels", i: Sparkles }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
  hospital: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "academy", l: "Qura Academy", i: Award }, { k: "feed", l: "Post & live feed", i: Rss }, { k: "clinicians", l: "Candidate search", i: Stethoscope }, { k: "execs", l: "Executive network", i: Briefcase }, { k: "talentpool", l: "Available talent", i: Users }, { k: "shortlists", l: "My shortlists", i: Heart },
    { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss },
    { k: "hdash", l: "Dashboard", i: LayoutDashboard }, { k: "weekly", l: "Weekly report", i: FileText }, { k: "findAgencies", l: "Find workforce suppliers", i: Briefcase }, { k: "meetings", l: "Meetings", i: Calendar },
    { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "staffing", l: "Site staffing", i: Building2 }, { k: "mobileunits", l: "Mobile units", i: Truck },
    { k: "casestudies", l: "Case studies", i: Award }, { k: "events", l: "Round-tables", i: Ticket }, { k: "whyqura", l: "Why Qura", i: Trophy }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
  clinician: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "academy", l: "Qura Academy", i: Award }, { k: "profile", l: "My profile", i: UserCheck }, { k: "feed", l: "Live feed", i: Rss }, { k: "myopps", l: "Opportunities for me", i: Target }, { k: "myapps", l: "My applications", i: FileText }, { k: "vault", l: "My documents", i: ShieldCheck },
    { k: "clinicianReg", l: "Get verified", i: ShieldCheck }, { k: "liveProjects", l: "Live projects", i: Radar }, { k: "network", l: "Network", i: Users }, { k: "messages", l: "Messages", i: MessageSquare }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss },
  ],
  gp: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "academy", l: "Qura Academy", i: Award }, { k: "feed", l: "Post & live feed", i: Rss }, { k: "gpHub", l: "GP hub", i: Stethoscope }, { k: "clinicians", l: "Find GPs & locums", i: UserCheck }, { k: "shortlists", l: "My shortlists", i: Heart },
    { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss }, { k: "meetings", l: "Meetings", i: Calendar },
    { k: "findAgencies", l: "Find workforce suppliers", i: Briefcase }, { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "casestudies", l: "Case studies", i: Award }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
  care: [
    { k: "howto", l: "How to use Qura", i: GraduationCap }, { k: "academy", l: "Qura Academy", i: Award }, { k: "feed", l: "Post & live feed", i: Rss }, { k: "careHub", l: "Care hub", i: Heart }, { k: "clinicians", l: "Find carers & nurses", i: Stethoscope }, { k: "shortlists", l: "My shortlists", i: Heart },
    { k: "intel", l: "Market intelligence", i: Radar }, { k: "psintel", l: "Public sector intel", i: Network }, { k: "relocation", l: "Relocation", i: Globe }, { k: "accommodation", l: "Accommodation", i: Home }, { k: "news", l: "Industry news", i: Rss }, { k: "meetings", l: "Meetings", i: Calendar },
    { k: "tariffs", l: "Tariff rates", i: FileText }, { k: "casestudies", l: "Case studies", i: Award }, { k: "pricing", l: "Pricing", i: CreditCard },
  ],
};
