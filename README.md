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
are no authoring, approval or adjustment controls in this view.

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
