# Qura — deployable web app

The Qura prototype as a standard Vite + React project. It layers up cleanly, and each layer is optional and turned on with environment variables — no code changes:

1. **Demo (default, zero setup):** data in the browser's `localStorage`.
2. **Accounts + shared data (Supabase):** real email/password sign-in, data synced per account across devices.
3. **Billing (Stripe):** paid plans go through Stripe Checkout and the paid plan is written back to the account.
4. **AI (Anthropic):** the proposal features, via a serverless proxy that keeps your key server-side.

If a layer isn't configured, the app falls back safely and still runs.

---

## 1. Run locally

Node.js 18+ (nodejs.org).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
```

---

## 2. Deploy free with Vercel

Push to a GitHub repo, then import it in Vercel and click Deploy (it auto-detects Vite). Or `npm i -g vercel && vercel`. You get `your-repo.vercel.app` in about a minute.

```bash
git init && git add . && git commit -m "Qura app"
git branch -M main
git remote add origin https://github.com/YOU/YOUR-REPO.git
git push -u origin main
```

---

## 3. Real accounts + shared data (Supabase)

1. Create a free project at supabase.com.
2. In the **SQL Editor**, run the contents of `supabase/schema.sql`.
3. In **Project Settings > API**, copy the **Project URL** and **anon public key**.
4. Set env vars (locally in `.env.local`, and in Vercel):
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Redeploy. The app now shows a real sign in / sign up screen and stores each account's data in Supabase. (Leaving these blank keeps demo mode.)

---

## 4. Billing (Stripe)

This makes the paid plans actually charge and updates the account's plan automatically.

1. Create a Stripe account (stripe.com). Start in **test mode**.
2. Create two **Products** (Starter, Growth), each with a **monthly** and a **yearly** recurring **Price**. Copy the four price IDs (they look like `price_...`).
3. In **Developers > API keys**, copy your **Secret key**.
4. Add server-side env vars in Vercel:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_STARTER_MONTHLY=price_...
   STRIPE_PRICE_STARTER_ANNUAL=price_...
   STRIPE_PRICE_GROWTH_MONTHLY=price_...
   STRIPE_PRICE_GROWTH_ANNUAL=price_...
   SUPABASE_URL=...                    # same project URL as above
   SUPABASE_SERVICE_ROLE_KEY=...       # Supabase > Settings > API > service_role (secret!)
   ```
5. Add the client flag so the app routes paid plans to Checkout:
   ```
   VITE_BILLING_ENABLED=true
   ```
6. Set up the webhook: in Stripe **Developers > Webhooks**, add an endpoint at
   `https://YOUR-DOMAIN/api/stripe-webhook`, subscribe to
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`,
   then copy the **Signing secret** into:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
7. Redeploy. Now choosing Starter or Growth opens Stripe Checkout; on payment, the webhook writes the plan to the account and the app reflects it. The 7-day free trial and Enterprise ("contact sales") do not go through Checkout.

Use Stripe's test card `4242 4242 4242 4242`, any future expiry and CVC, while in test mode. Switch to live keys when ready.

Security note: `/api/checkout` currently trusts the userId/email sent from the browser. For production, verify the Supabase access token server-side in that function before creating the session.

---

## 5. AI features (Anthropic)

Add `ANTHROPIC_API_KEY` (server-side env var, no `VITE_` prefix) in Vercel and redeploy. Powers `/api/anthropic`. Without it, the AI parts fall back gracefully.

---

## 6. Custom domain

Buy a domain (~£8–£15/year; check current price), add it in Vercel **Settings > Domains**, follow the DNS steps. HTTPS is automatic.

---

## 7. Before real NHS or patient data

Qura is NHS-facing, so production handling of real trust or patient data brings in UK GDPR, information governance, and NHS standards such as **DTAC**, **DCB0129/DCB0160** and **DSPT**. Fine for demos and dummy-data pilots, but plan for it early with information-governance input before real data goes in.

---

## Account roles & owner admin

Each account now picks a role the first time it signs in (Operator, Healthcare Agency, Hospital/Provider or Clinician). That role is saved to the account, the app opens straight into it, and normal users cannot switch views. Owners keep the "switch view" flipper plus an Admin screen.

- **Make yourself the owner:** in Vercel add the env var `VITE_OWNER_EMAILS` set to your email (comma-separated for more than one), then redeploy. Until you set it, every account is treated as an owner.
- **Use the Admin screen:** it needs the server-side keys `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Settings > API > service_role). You may already have these from the Stripe step. The Admin screen lists everyone who has signed up and lets you set or change each person's role. It appears in the account menu (top-right avatar) for owners only.

## Environment variables at a glance

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client | real accounts + data |
| `VITE_BILLING_ENABLED` | client | route paid plans to Stripe |
| `VITE_OWNER_EMAILS` | client + server | who is an owner (birds-eye + admin) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | lets the admin screen list & set roles |
| `ANTHROPIC_API_KEY` | server | AI proposals |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | server | billing |
| `STRIPE_PRICE_*_MONTHLY/ANNUAL` | server | plan prices |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | server | webhook writes the plan |

## Project structure

```
qura-web/
├── api/
│   ├── anthropic.js        # AI proxy (holds Anthropic key)
│   ├── admin.js            # owner-only: list users, set roles
│   ├── checkout.js         # creates a Stripe Checkout session
│   └── stripe-webhook.js   # Stripe -> writes plan back to the account
├── supabase/schema.sql     # run once in Supabase
├── src/
│   ├── App.jsx             # the full Qura app
│   ├── Auth.jsx            # real sign in / sign up
│   ├── supabase.js         # Supabase client
│   ├── billing.js          # Stripe Checkout helper
│   ├── storage.js          # per-account storage (localStorage fallback)
│   └── main.jsx            # entry + auth gate
├── index.html
├── .env.example
├── package.json
└── vite.config.js
```

## Scheduled Public Sector Intelligence refresh (Vercel Cron)

The ICB board-paper and council/governing-body intelligence page can update itself.

- The scheduled function lives at `api/refresh-intel.js`.
- `vercel.json` runs it daily at 06:00 UTC (`0 6 * * *`). Vercel picks this up automatically on deploy.
- On each run it fetches each public source, uses your `ANTHROPIC_API_KEY` to distil only the Qura-relevant points (workforce, diagnostics, insourcing, procurement, SEND, complex care), and writes the results to Supabase shared rows (`psintel_icb`, `psintel_bodies`, `psintel_updated`). The app reads these on load and shows a "Last refreshed" time, falling back to the built-in baseline for any source it cannot read.

### Environment variables it uses (all already in the project)
- `ANTHROPIC_API_KEY` (summaries)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (writing shared rows)
- `CRON_SECRET` (optional but recommended). Set any random string. Vercel sends it automatically to the cron; it also lets you trigger a run manually at `/api/refresh-intel?key=YOUR_SECRET`.

### Run it once immediately
After deploying, visit `https://YOUR-APP.vercel.app/api/refresh-intel?key=YOUR_CRON_SECRET` (or without `?key=` if you did not set `CRON_SECRET`). You should see a small JSON `{ ok: true, ... }` response, and the intelligence page will then show the refreshed data.

### Pointing at exact board papers
`SOURCES_ICB` and `SOURCES_BODIES` in `api/refresh-intel.js` hold each source name and URL. Replace a URL with the exact board-papers/meetings page for sharper extraction; anything left unreadable simply uses its baseline points.

## Industry news refresh (Vercel Cron)

- Function: `api/refresh-news.js`. `vercel.json` runs it daily at 05:00 UTC.
- It pulls public healthcare news per region (UK, Nigeria, Middle East, International) from Google News RSS and writes them to Supabase shared rows (`qura_news_uk`, `qura_news_ng`, `qura_news_me`, `qura_news_intl`, `qura_news_updated`). The Industry news page reads these, falling back to a built-in baseline per region.
- Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (already set) and the optional `CRON_SECRET`. Trigger once manually at `/api/refresh-news?key=YOUR_CRON_SECRET`.
- Licensed sources (e.g. HSJ) are not pulled directly; they can be added when licensed.

## To connect later (email sending)

The mailshots (Decision makers) and the automatic Friday delivery of the Weekly activity
report send real emails, which needs an email provider (e.g. Resend or SendGrid) plus a
verified qura.health domain. The screens, Qura Credits (5 messages/day on standard, more on
premium; 10 follow-invites/day) and limits all work now; only the outbound email delivery
waits on that provider. Once added, wire an `api/send-mail.js` and set the provider API key
as a Vercel env var.

## Email sending (Resend)

- Function: `api/send-mail.js`. The Weekly report "Email me" button now sends the report to the signed-in user's email.
- To switch it on: create an account at resend.com, verify your sending domain (e.g. qura.health), create an API key, then in Vercel set env vars `RESEND_API_KEY` (your key) and optionally `MAIL_FROM` (e.g. `Qura <noreply@qura.health>`). Redeploy.
- Until the key is set, the button reports "Email is not configured yet". The same function can later power mailshots, introductions and interest notifications once real recipient data and consent are in place.

## Payments (Stripe) — going live

The Pricing page now launches real Stripe Checkout for paid plans when `VITE_BILLING_ENABLED=true`. Free/trial and Enterprise (contact sales) plans do not charge.

**Env vars (Vercel):**
- `STRIPE_SECRET_KEY` — your live secret key.
- `STRIPE_WEBHOOK_SECRET` — from the webhook you create (below).
- `VITE_BILLING_ENABLED=true`.
- Price IDs. Generic (apply to every persona): `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_ANNUAL`, `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_GROWTH_ANNUAL`.
- Optional per-persona overrides (only if you want different prices per audience): `STRIPE_PRICE_AGENCY_GROWTH_ANNUAL`, `STRIPE_PRICE_BUYER_GROWTH_ANNUAL`, `STRIPE_PRICE_CLINICIAN_GROWTH_ANNUAL`, and the same pattern for STARTER / MONTHLY. The app first looks for the persona-specific price, then falls back to the generic one.

**Steps:**
1. In Stripe (live mode), create a Product per plan (e.g. Starter, Growth) with a monthly and an annual recurring Price. Copy each Price ID (starts with `price_`).
2. In Vercel, add the env vars above with those Price IDs. Set `VITE_BILLING_ENABLED=true`.
3. In Stripe, add a webhook endpoint pointing to `https://your-domain/api/stripe-webhook`, subscribe to checkout and subscription events, and copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Redeploy. Test one real subscription end to end before announcing.

## Demo & member sessions (Book a Demo + How to use Qura)

- The public "Book a demo" screen is now video-first. Paste your demo embed URL into
  `DEMO_VIDEO_URL` at the top of the DemoBooking section in `src/App.jsx` to go live; until then a
  branded placeholder shows.
- Signed-in members get a "How to use Qura" page with: rewatch demo, 1:1 strategy session
  (Founder £299 / Senior £149) with slot picker and waiting list, and team workshops (£99 up to 5 /
  £199 unlimited). Bookings are recorded on the member's dashboard.
- Paid sessions use Stripe **one-off** payments. Create these as **one-time** prices in Stripe and add
  the price IDs to Vercel:
  - `STRIPE_PRICE_SESSION_FOUNDER`
  - `STRIPE_PRICE_SESSION_SENIOR`
  - `STRIPE_PRICE_WORKSHOP_W5`
  - `STRIPE_PRICE_WORKSHOP_WUNLIMITED`
  The checkout function auto-detects session/workshop as one-off (payment mode) vs subscriptions.
- Calendar invites, confirmation emails, video links and reminders send once the email/notification
  backend (Resend, already set up) and a calendar/video provider are connected.

## Countdown launch mode

- Set `LAUNCH_DATE` near the top of the Landing section in `src/App.jsx` (e.g. "2026-09-22T09:00:00").
- The Home tab shows a live countdown, a daily-rotating feature spotlight, and an early-access email
  capture. Captured emails are stored under `qura_waitlist`; for a real campaign, export them or wire
  the capture to your email tool.
- The countdown hides itself automatically once the launch date passes, revealing the normal hero.
