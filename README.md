# Qura mobile (iOS + Android)

Native apps for Qura, built with React Native and Expo. They sign in against the **same
Supabase project** as qurahealth.org and call the **same serverless endpoints**, so there is one
backend and one source of truth.

## Run it locally

1. Install Node 18+ and the Expo tooling: `npm install -g eas-cli`
2. `npm install`
3. Add your keys to `app.json` under `expo.extra`:
   - `supabaseUrl` — your Supabase project URL
   - `supabaseAnonKey` — the anon public key (never the service role key)
4. `npm start`, then scan the QR code with Expo Go on your phone.

## Build for the stores

```
eas login
eas build:configure
eas build --platform ios        # needs an Apple Developer account (£79/yr)
eas build --platform android    # needs a Google Play account (one-off £20)
eas submit --platform ios
eas submit --platform android
```

Keep real keys out of git: use `eas secret:create` rather than committing them to `app.json`.

## What is here

- `App.js` — auth gate plus bottom-tab navigation
- `src/theme.js` — Qura design tokens, mirrored from the web app
- `src/lib/supabase.js` — Supabase client, storing sessions in the device keychain
- `src/lib/api.js` — authenticated calls to the existing qurahealth.org endpoints
- `src/components/ui.js` — Card, Chip, Button, PageHead
- `src/components/graphics.js` — Qura logo, fit-score rings, verification donut, market-mix bars and sparkline (via react-native-svg)
- `src/screens/` — Sign in, Live feed, Live projects, Profile and verification

## What is next

Screens currently render representative data where an endpoint does not yet exist. The next
steps are to expose read endpoints for the feed, opportunities and clinician profile, then wire
push notifications (`expo-notifications`) for matching roles, introductions and interview updates.
