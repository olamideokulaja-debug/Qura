import { createRoot } from "react-dom/client";
import "./storage.js";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

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

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
