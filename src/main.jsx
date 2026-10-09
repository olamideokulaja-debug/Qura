import { createRoot } from "react-dom/client";
import "./storage.js";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import FoundingBanner from "./FoundingBanner.jsx";
import CompensationPanel from "./CompensationPanel.jsx";

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
const OPENABLE = { send: ["overview", "vacancies", "territories", "councils", "tenders", "schools", "map", "coverage", "insights"] };
async function applyDeepLink() {
  try {
    const p = new URLSearchParams(window.location.search);
    const open = p.get("open");
    if (!open || !OPENABLE[open]) return;
    const tab = p.get("tab");
    if (tab && OPENABLE[open].includes(tab)) { try { sessionStorage.setItem("qura_send_tab", tab); } catch (e) {} }
    await Promise.all(["agency", "operator"].map((r) => window.storage.set("cura_active_" + r, JSON.stringify(open)).catch(() => null)));
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
