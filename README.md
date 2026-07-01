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
