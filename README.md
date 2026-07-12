# Forte Compass

An OKR and performance platform for Imade Forte Holdings and its subsidiaries.
It holds every team to the change it creates, not the hours it logs. Objectives are
authored, coached toward outcomes, submitted, approved and scored, right across the group.

This build covers Stages 1 to 5:

- **Stage 1** The branded gateway and the outcome ladder.
- **Stage 2** A deployable, multi-tenant stack with sign-in and role routing.
- **Stage 3** OKR authoring with the coach-hard outcome engine and the approval workflow.
- **Stage 4** The scorecard. Objectives are auto-scored against the house rubric, and a lead,
  HR or the MD can adjust any dimension with every change logged.
- **Stage 5** The Organisations view, AI-suggested next OKRs, and stall detection with a
  WhatsApp nudge.

## The public website (landing page)

The app now opens on the Imade Forte Holdings website, not the sign-in. The homepage is the public
company site, built from the company profile: a hero ("Strategy That Strengthens Institutions."),
About and an at-a-glance panel, Vision, Mission and Values, five detailed service cards,
Differentiators, the leadership of Dr. Olamide Okulaja and Jennifer Kaja with their photos and bios,
a credibility band, and a Contact section with details and a form. Colours and imagery come from the
profile: navy, charcoal and gold, the shield and wordmark together, and the profile's own photographs.

Staff reach the platform through the "Forte Compass" item in the top bar (and a link in the footer),
which opens a short overview of what Compass does and then the sign-in. A "back to Imade Forte" link
returns to the site.

The contact form emails info@imadeforteholdings.com. To have it send automatically, get a free access
key at web3forms.com using that address and set it in Vercel as VITE_WEB3FORMS_KEY, then redeploy.
Without a key the form still works: it opens the visitor's email app addressed to info@ with their
message filled in.

To make this the live website, point the imadeforteholdings.com domain at this Vercel project
(Vercel, then Settings, then Domains, then add the domain and follow the DNS steps).

## Reviews and feedback

Everyone has a Reviews tab. A staff member sees their own reviews there, most recent first, so they
know exactly how they did last cycle: the rating, a summary, their strengths and what to improve,
plus any quick feedback colleagues have left them. They can acknowledge a review and add a short
response. A manager runs a review session from the same tab: for each of their people they open a
composer, set an overall rating (exceeds, meets, below, unsatisfactory), and write the summary,
strengths and areas to improve. Anyone can also send a quick note of feedback to a colleague.

## Performance and intervention

HR, the MD and the Chairman get a Performance tab that watches for people who perform low
consistently. It reads each person's band, their history of below-expectations and unsatisfactory
reviews (frequency) and how serious those are (severity), along with movement against last cycle,
and turns that into a recommendation: on track, monitor, improvement plan, or recommend for
termination, with the reasons shown. The Chairman or MD can refer an improvement or termination
case to HR with one click, and HR works it off a shared action queue.

## Leave and time off

Everyone can request leave under the Leave tab: annual, sick, maternity or paternity, and
compassionate, with the day count worked out from the dates. Each person sees their remaining
balance per type and the status of their requests. Approvals go to the Managing Director, who has
an approval queue on the same tab; HR and admin can see all leave across the group.

## Payroll

Payroll runs on an approval chain: HR prepares the month's run and submits it to the MD, the MD approves it, and the Accountant then downloads it as an Excel file to upload to the banking platform and marks it paid. A status bar at the top shows exactly where the run is. The Payroll tab (MD, HR, admin and the Accountant) computes pay under current Nigerian rules: pay is split
into basic, housing, transport and other allowances; pension is 8 percent employee and 10 percent
employer on basic-plus-housing-plus-transport; NHF is 2.5 percent of basic and, with pension and a
rent relief of 20 percent of rent capped at ₦500,000, reduces taxable income; PAYE then follows the
Nigeria Tax Act 2025 bands; and NHIS (employee 5 percent of basic) plus the flat ₦4,000 annual
development levy come off after tax. NHF and NHIS can each be toggled to match the company's
situation. The table shows gross, PAYE, total deductions and net per person, salaries are editable
inline, and each person has a full payslip, with monthly earnings and deductions and an annual
summary, that can be printed or saved as PDF. The figures are estimates to confirm with your
accountant and the Nigeria Revenue Service before remittance.

## Onboarding

HR, the MD and admin get an Onboarding tab that tracks new hires against a standard checklist
(offer, contract, documents, bank and pension details, accounts, equipment, orientation, and a
first-week check-in). Each person shows a progress bar; opening their card reveals the checklist to
tick off. Anyone added through the Roster starts a fresh checklist automatically, and each new hire
sees their own progress on their dashboard until it is complete.

## Review cycles

HR, the MD and admin get a Cycles tab that manages review periods. One cycle is active at a time,
and it is the cycle that new objectives and new reviews are stamped with. "Roll to next cycle"
closes the current one and opens a new one, carrying every approved objective forward as a draft to
refine and resubmit; the closed cycle's objectives, scores, reviews and check-ins stay intact as
history. Any past cycle can be made active again, and the Scorecards tab has a cycle selector so you
can look back at how any period was scored. The Chairman's cockpit always reflects the active cycle.

## Documents

HR, the MD and admin get a Documents tab: pick a person and see their records, held per category
(contract, ID, certificate, tax, pension, other). Uploading a file adds it under the chosen
category, and each person sees their own documents on their dashboard. In the hosted app files live
against each profile; in the local demo an uploaded file opens for the session while its record is
kept, which keeps the demo light without a storage backend.

## The wider HR suite

Forte Compass now spans OKRs and the outcome engine, check-ins and trends, scorecards, the
holding-company cockpit with workspace switching, organisations and the organogram, reviews and
feedback, performance and intervention, leave, full Nigerian payroll with printable payslips,
onboarding, review cycles, per-person documents, and export.

## Export

The Export tab (the Chairman, MD, HR and admin) generates two artefacts from live data for the
active cycle: a branded review pack, with a navy-and-gold cover, the cohort scorecard, individual
coaching sections and a risk register, that opens as a document to print or save as PDF; and an
Excel tracker with the cohort scorecard and every key result (baseline, target, current and
confidence).

## Server-enforced permissions

The simple deployment stores each tenant's data as one keyed JSON document with tenant-level row
security, which isolates tenants but leaves the finer visibility rules to the interface. The lower
half of `supabase/schema.sql` is the production model: normalised tables (objectives, key results,
reviews, feedback, leave, salaries, documents and cycles) with row-level-security policies that
enforce the same rules at the database, keyed to the signed-in user's role and subsidiary. A staff
member's query returns only their own objectives, scores and documents; a lead sees their
subsidiary; the MD, HR and the Chairman see the group; leave decisions and pay are limited to the
MD, HR and admin; and a person can read their own pay line but not anyone else's. Point the client's
live data layer at these tables to switch database-enforced permissions on.

### Migrating to the enforced tables, safely (step 1: objectives)

The migration moves one entity at a time onto the enforced tables, tested on a Vercel preview before
it ever reaches the live site. Step one covers objectives. It is off unless a deploy sets the
environment variable VITE_USE_TABLES to on, so the production site is untouched until you choose to
switch it.

To test step one on a preview, not on your live site:
1. In Supabase, open SQL Editor and run `supabase/schema.sql` again (it only adds the new objectives
   policy and the owner_key column; safe to re-run).
2. In Vercel, open Settings, then Environment Variables. Add VITE_USE_TABLES with the value on, and
   tick only Preview (leave Production unticked). Save.
3. Deploy a preview (the simplest way is to let me push the change to a branch, which gives you a
   preview link automatically). Open that preview link and sign in.
4. Go to My OKRs and create an objective. Refresh the page. It should still be there, now served from
   the objectives table rather than the interface's local copy. That confirms the round-trip and the
   row-level rules. When it looks right, we promote it and move to the next entity.

On the preview in table mode, My OKRs is the user's own objectives from the database; the wider
scorecards and cockpit that aggregate everyone follow in the next migration steps (reviews, then
leave, pay and documents), each tested the same way.

## Check-ins and trends

Once an objective is approved, its owner logs progress under the Check-ins tab: a new value, a
confidence level, and an optional note, on a weekly cadence for operations and monthly for
leadership. Each key result then carries a history rather than a single figure, shown as a
progress bar toward target and a small trend line, with the latest value and confidence alongside.
The dashboard flags any approved key result still awaiting its first check-in. Progress and the
stall flags read from the most recent check-in, so the picture stays current as the cycle runs.

## Organogram

The Organogram tab draws the whole group as a tree: Imade Forte Holdings at the top, then the
Corporate head office and each subsidiary, and under each one its people arranged by reporting
line, all the way down to every staff member. Each organisation shows who its head reports to.
Nodes are interactive: tapping a person opens their profile, tapping an organisation opens its
panel. Reporting lines are seeded sensibly and can be changed any time in the Roster tab. The
organogram is available to the Chairman, the MD, HR and a tenant admin.

## The Chairman's cockpit

Signing in as the Chairman opens a dedicated, read-only view at the level of the holding company.
It leads with the health of the whole group and a card for the Corporate head office and each
subsidiary; tapping any card zooms into that organisation's staff, objectives and risks. Below
that sit the standing of every staff member with a one-click drill into any person's objectives
and scorecards, the risks and stalled results across the whole group, and who is climbing and who
is slipping against the previous cycle. The Chairman sees everything and changes nothing: there
are no authoring, approval or adjustment controls in this view. A workspace switcher on the
cockpit lets the Chairman step into another role (MD, a lead, HR or a staff member) to see what
they see, with a "Return to Chairman" banner to come straight back. Chairman and MD are corporate
roles at the level of the holding company, so they are never asked to pick a company. Navigation
across the app is a left sidebar that collapses to a menu on small screens.

## Organisations

Imade Forte Holdings Limited is the parent. Its four operating subsidiaries each have their own
tab with their own staff and OKRs: Genesys Health Information Limited, Girard Property Limited,
Yostrat Business Services, and Realms Healthcare Services Consulting Limited. Head-office
functions (the Chairman, the MD, the EA, HR and Finance) sit at a Corporate level, and a Holding
company overview rolls everything up. Selecting an organisation shows the people under it with
their scores, the objectives that belong to it, its outcome ratio and weighted average, its
priority, and any key results that need attention. A subsidiary lead sees only their own
organisation; the MD, HR and the Chairman see all of them.

## Suggestions and nudges

From My OKRs, "Suggest next OKRs" proposes three outcome-shaped objectives tailored to the
person's organisation, and "Use this" opens the author already filled in. Across the app, a key
result is flagged as needing attention when confidence is low or progress is well behind the
target. In an organisation view, a lead, HR or the MD can turn any flagged key result into a
ready-to-send WhatsApp nudge with one click. With the AI key set the suggestions come from the
model; without it, a built-in engine does the same job offline.

## Two ways to run it

**Demo mode (default, no setup).** Deploy the folder as-is and it works immediately. It runs
on seeded May 2026 cohort data held in the browser, with a "pick who you are" sign-in so you can
walk every role. Nothing leaves the device. This is the right mode for review and for showing
people around.

**Live mode (when you are ready).** Add a Supabase project and an AI key in Vercel and the same
app switches to real accounts, real tenancy with row-level security, and the AI outcome engine.
No code changes. Steps are below.

## Put it online (about 15 minutes, no coding)

1. Create a free account at **github.com** and a free account at **vercel.com**.
2. On GitHub, click **New repository**, name it `forte-compass`, and create it.
3. On the repository page choose **uploading an existing file**, then drag in *everything* inside
   this folder (including the `src`, `api`, `public` and `supabase` folders). Commit.
4. In Vercel click **Add New, Project**, pick the `forte-compass` repository, and click **Deploy**.
   Vercel detects Vite automatically. When it finishes you get a live link. That link is the
   working app in demo mode.

## Turn on live mode

In Vercel, open the project, then **Settings, Environment Variables**, and add:

| Name | Where it comes from |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase, Project Settings, API |
| `VITE_SUPABASE_ANON_KEY` | Supabase, Project Settings, API |
| `ANTHROPIC_API_KEY` | Your Anthropic console. Kept server-side, never sent to the browser. |
| `ANTHROPIC_MODEL` | Optional. Defaults to `claude-sonnet-5`. |

Then, in Supabase, open the **SQL editor** and run the contents of `supabase/schema.sql` once.
It creates the organisations, profiles and data tables and the tenant row-level security, and
seeds the Imade Forte and demo tenants. Redeploy in Vercel and the app is live.

New Supabase projects require email confirmation by default, so "Create account" sends a
confirmation link and you sign in after confirming. To skip that while testing, turn off
"Confirm email" under Authentication, Providers, Email in Supabase. On first sign-in the app
asks each person to set their role and organisation once, then remembers it.

## What is in this build

- `src/App.jsx` The whole application in one file: gateway, sign-in, role router, dashboard,
  the authoring engine and the approval workflow.
- `api/anthropic.js` The server-side AI proxy. Holds the key, so the browser never sees it. When
  no key is set the app quietly uses its built-in offline engine instead.
- `supabase/schema.sql` The database and tenant row-level security for live mode.
- `public/imade-forte-logo.png` The Imade Forte lockup used in the header and footer.
  `imade-forte-logo-hires.png` is kept for the review-pack exports in a later stage.
- `.env.example` The list of environment variables, for reference.

## The outcome engine

When you author a key result, the engine reads it and labels it input, activity, output or
outcome. Anything that is not an outcome is coached: you are shown one or two outcome-shaped
rewrites, and the objective cannot be saved until every weaker key result is either rewritten or
kept with a short reason on the record. Baseline, measure and target are required throughout.
With the AI key set, the classification and rewrites come from the model; without it, a built-in
rule-based engine does the same job offline.

## Scoring and the scorecard

Once an objective is submitted or approved it is scored against the house rubric: SMART quality
30 percent, strategic alignment 30 percent, ambition 20 percent, ownership 20 percent, banded
green at 7 and above, amber from 4, red below. The score is computed automatically to start.
A subsidiary lead (for their own people), HR or the MD can then adjust any dimension. Every
adjustment is written to the objective's history with the dimension, the before and after values,
who made it, their role, the time, and a reason. A person sees only their own scorecard; peers
never see each other's. Adjusted scores flow straight to the group board.

## Roster and admin

HR, the MD and a tenant admin get a Roster tab to manage people: add someone, edit their name,
role, organisation and check-in cadence, set who they report to, or remove them. The two profiles
still missing a surname are highlighted and counted at the top, so they are quick to complete, and
any change flows straight through to the organisations, the board and the cockpit.

## Notes for the roster

Two people are still seeded without surnames (Adebayo and Chinonso), and one HR seat is a
placeholder. These are flagged in the app and are easy to correct before the roster goes live.

## Public website and the Forte Compass door

The homepage is a tabbed public site for Imade Forte Holdings, dark navy with gold, carrying the
real logo. Each section is a top-bar tab that fits the screen with little scrolling: Home (hero over
a dimmed architectural backdrop, animated stats, a partners line), About (who we are, vision and
mission, at-a-glance, values, and a company-profile download), Practices (an interactive explorer
with a sector filter, a photo, and an in-focus note per practice, including the real LASMIIZO
feasibility engagement), Advantages, Insights (three perspective cards with images), Leadership (the
two leaders with their photos and bios, plus recognition), Careers (routes new joiners to Forte
Compass), and Contact (details, a WhatsApp button, and a form that emails info@imadeforteholdings.com
with a spam honeypot). Tabs deep-link by URL hash, and the copy is drawn from the company profile and
the live site.

Setup notes: add a free web3forms.com key as VITE_WEB3FORMS_KEY in Vercel so the contact form sends
by email; to use your domain, add imadeforteholdings.com in Vercel under Settings then Domains; and
to turn on privacy-friendly analytics, set your domain in index.html at window.__ENV.PLAUSIBLE.

