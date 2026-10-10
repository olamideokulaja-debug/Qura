import { createRoot } from "react-dom/client";
import "./storage.js";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import FoundingBanner from "./FoundingBanner.jsx";
import CompensationPanel from "./CompensationPanel.jsx";
import { supabase, supabaseEnabled } from "./supabase.js";

// A confirmation link can still arrive at the root if an older email is opened
// or a setting is changed. Landing here with a token puts the app in a
// half-signed-in state, which is what made the role picker appear twice. Send
// those arrivals to the confirmation page so there is one way in.
try {
  const h = window.location.hash || "";
  const isConfirm = h.indexOf("access_token") !== -1 && (h.indexOf("type=signup") !== -1 || h.indexOf("type=email") !== -1);
  if (isConfirm && window.location.pathname === "/") {
    window.location.replace("/confirmed.html");
  }
} catch (e) {}

// Deep links into a workspace screen: /?open=send&tab=territories opens SEND
// Intelligence on that tab (used by SEND alert emails and app notifications).
// The app remembers the open screen per role in window.storage, so the link
// writes that value for the supplier and operator workspaces before the app
// starts, then tidies the address bar. Only screens listed here can be opened.
// /?open=myapps opens a clinician's My applications (application reminder emails, 10 October 2026).
const OPENABLE = { send: ["overview", "vacancies", "territories", "councils", "tenders", "schools", "map", "coverage", "insights"], myapps: [] };
const OPEN_ROLES = { send: ["agency", "operator"], myapps: ["clinician"] };
async function applyDeepLink() {
  try {
    const p = new URLSearchParams(window.location.search);
    const open = p.get("open");
    if (!open || !OPENABLE[open]) return;
    const tab = p.get("tab");
    if (tab && OPENABLE[open].includes(tab)) { try { sessionStorage.setItem("qura_send_tab", tab); } catch (e) {} }
    // The screen choice is saved to the account as well as this browser, and the
    // account copy wins. Straight after a page load the sign-in is still being
    // restored, so without this wait only the browser copy was written and the
    // link opened the last screen used instead (found 10 October 2026). Waits at
    // most 3 seconds, and only when a link like this is used.
    if (supabaseEnabled && supabase) {
      for (let i = 0; i < 15; i++) {
        try { const { data } = await supabase.auth.getSession(); if (data && data.session) break; } catch (e) { break; }
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    await Promise.all(OPEN_ROLES[open].map((r) => window.storage.set("cura_active_" + r, JSON.stringify(open)).catch(() => null)));
    p.delete("open"); p.delete("tab");
    const q = p.toString();
    window.history.replaceState({}, "", window.location.pathname + (q ? "?" + q : "") + window.location.hash);
  } catch (e) {}
}

applyDeepLink().finally(() => createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <FoundingBanner />
    <CompensationPanel />
    <App />
  </ErrorBoundary>
));
