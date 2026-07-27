// Analytics, loaded only after the visitor has agreed to it.
//
// Nothing here runs until consent is given. PostHog is fetched on demand rather
// than bundled up front, so visitors who decline never download it at all.
//
// Privacy choices worth knowing about:
//   - EU hosting, so personal data does not leave the EU.
//   - Session recordings mask every text input, every email address and every
//     password field. On a healthcare site people type registration numbers and
//     personal details into forms, and none of that should ever be replayable.
//   - Page views are sent by hand, so the addresses recorded are the tidy ones
//     rather than whatever happens to be in the bar.

const POSTHOG_KEY = "phc_v3s7RBj4mS94raWPpFa9yjy675A7Qdy8o4QpADng6Nce";
const POSTHOG_HOST = "https://eu.i.posthog.com";
export const CONSENT_KEY = "qura_cookie_consent";

let client = null;
let starting = null;

export async function readConsent() {
  try {
    const r = await window.storage?.get(CONSENT_KEY);
    return (r && r.value) || null;
  } catch (e) {
    return null;
  }
}

async function start() {
  if (client) return client;
  if (starting) return starting;
  starting = (async () => {
    try {
      const mod = await import("posthog-js");
      const posthog = mod.default || mod;
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "[data-private]",
        },
      });
      client = posthog;
      return client;
    } catch (e) {
      return null;
    } finally {
      starting = null;
    }
  })();
  return starting;
}

/** Called on load. Starts analytics only if the visitor previously agreed. */
export async function initAnalytics() {
  const consent = await readConsent();
  if (consent === "all") return start();
  return null;
}

/** Called when the visitor accepts. */
export async function enableAnalytics() {
  const c = await start();
  if (c) {
    try { c.opt_in_capturing(); } catch (e) {}
  }
  return c;
}

/** Called when the visitor declines, or later withdraws consent. */
export function disableAnalytics() {
  try {
    if (client) {
      client.opt_out_capturing();
      client.reset();
    }
  } catch (e) {}
}

/** A page view, sent by hand so the recorded address is the tidy one. */
export function trackPage(path, title) {
  try {
    if (client) client.capture("$pageview", { $current_url: window.location.origin + path, page_title: title });
  } catch (e) {}
}

/** Any other event worth counting. Silently does nothing without consent. */
export function track(name, props) {
  try {
    if (client) client.capture(name, props || {});
  } catch (e) {}
}
