import React from "react";

// Catches any rendering error anywhere below it. Without this, a single fault
// leaves the visitor looking at a blank white page with no explanation and no
// way forward, which is exactly what happened during the refactor.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // Logged to the browser console for now. Once monitoring is wired in, this
    // is the single place to report from.
    try { console.error("Qura render error:", error, info); } catch (e) {}
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "-apple-system,Segoe UI,Roboto,sans-serif", background: "#F4F7FB", color: "#1A2233" }}>
        <div style={{ background: "#fff", border: "1px solid #E4EAF3", borderRadius: 16, padding: 32, maxWidth: 460, width: "100%", textAlign: "center", boxShadow: "0 10px 40px rgba(10,26,48,.08)" }}>
          <h1 style={{ fontSize: 21, margin: "0 0 8px" }}>Something went wrong at our end</h1>
          <p style={{ color: "#5A6783", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 22px" }}>
            This is a fault on the Qura side, not anything you did. Reloading usually clears it.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "12px 22px", border: "none", borderRadius: 10, background: "#0E8C7E", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Reload the page
          </button>
          <p style={{ color: "#8A97AE", fontSize: 12.5, marginTop: 20, marginBottom: 0 }}>
            If it keeps happening, email <a href="mailto:support@qurahealth.org" style={{ color: "#0E8C7E" }}>support@qurahealth.org</a>
          </p>
        </div>
      </div>
    );
  }
}
