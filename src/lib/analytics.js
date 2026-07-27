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

// PostHog is fetched on demand, which takes a moment. Anything captured during
// that gap would otherwise be thrown away, so it waits here and is sent once the
// client is ready.
let pending = [];
function flush() {
  const queued = pending;
  pending = [];
  queued.forEach(({ name, props }) => {
    try { client.capture(name, props); } catch (e) {}
  });
}
function send(name, props) {
  if (client) {
    try { client.capture(name, props); } catch (e) {}
  } else {
    if (pending.length < 50) pending.push({ name, props });
  }
}

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
      // Apply whichever mode the app is already in, in case the visitor signed
      // in before agreeing to analytics.
      try {
        posthog.set_config({ autocapture: marketing });
        if (!marketing) posthog.stopSessionRecording();
      } catch (e) {}
      flush();
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
    // Count the page they were on when they agreed, which would otherwise be
    // the one view we always miss.
    try {
      send("$pageview", { $current_url: window.location.href, page_title: document.title });
    } catch (e) {}
  }
  return c;
}

/** Called when the visitor declines, or later withdraws consent. */
export function disableAnalytics() {
  pending = [];
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
    send("$pageview", { $current_url: window.location.origin + path, page_title: title });
  } catch (e) {}
}

// Automatic click tracking and session replay run on the public marketing site
// only. Inside the signed-in product, suppliers click on clinician names and see
// them on screen, and neither should end up recorded: those are real people who
// were never asked. Once signed in, only the events written by hand are sent,
// and none of those carry anyone's name.
let marketing = true;
export function setMarketingMode(on) {
  marketing = !!on;
  if (!client) return;
  try {
    client.set_config({ autocapture: marketing });
    if (marketing) { client.startSessionRecording(); } else { client.stopSessionRecording(); }
  } catch (e) {}
}

/** Any other event worth counting. Silently does nothing without consent. */
export function track(name, props) {
  try {
    send(name, props || {});
  } catch (e) {}
}
