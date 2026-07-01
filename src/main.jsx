import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { supabase, supabaseEnabled } from "./supabase.js";
import "./storage.js";
import App from "./App.jsx";
import Auth from "./Auth.jsx";

const OWNER_EMAILS = (import.meta.env.VITE_OWNER_EMAILS || "")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

if (typeof window !== "undefined") {
  window.__quraSignOut = () => { try { return supabase?.auth?.signOut(); } catch (e) {} };
}

function RoleChoice({ onPick }) {
  const roles = [
    ["operator", "Operator (Founder)", "Run and grow the marketplace"],
    ["agency", "Healthcare Agency", "Win and manage placements"],
    ["hospital", "Hospital / Provider", "Post needs and find partners"],
    ["clinician", "Clinician", "Find opportunities that fit you"],
  ];
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif", background: "radial-gradient(135% 120% at 0% 0%, #102A4F 0%, #0A1730 46%, #070E20 100%)" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, color: "#fff" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#0E8C7E,#00C2B8)" }} />
          <span style={{ fontWeight: 800, fontSize: 20 }}>Qura</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Which best describes you?</h1>
        <p style={{ color: "#9FB0D0", fontSize: 14, marginTop: 0 }}>Choose how you'll use Qura. This sets up your account.</p>
        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>{roles.map(([k, t, d]) => (
          <button key={k} onClick={() => onPick(k)} style={{ textAlign: "left", background: "#fff", border: "1px solid #d7deea", borderRadius: 14, padding: "16px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span><span style={{ fontWeight: 700, fontSize: 15, color: "#0A1730", display: "block" }}>{t}</span><span style={{ fontSize: 13, color: "#6B7A93" }}>{d}</span></span>
            <span style={{ color: "#0E8C7E", fontWeight: 700, fontSize: 18 }}>&rarr;</span>
          </button>
        ))}</div>
      </div>
    </div>
  );
}

function Gate({ session }) {
  const email = (session?.user?.email || "").toLowerCase();
  const isOwner = OWNER_EMAILS.length === 0 || OWNER_EMAILS.includes(email);
  const [role, setRole] = useState(undefined);
  useEffect(() => {
    (async () => {
      try { const r = await window.storage?.get("qura_role"); setRole(r && r.value ? JSON.parse(r.value) : null); }
      catch (e) { setRole(null); }
    })();
  }, []);
  if (role === undefined) return null;
  if (!role) return <RoleChoice onPick={async (r) => { try { await window.storage?.set("qura_role", JSON.stringify(r)); } catch (e) {} setRole(r); }} />;
  return <App forcedRole={role} isOwner={isOwner} ownerEmail={email} />;
}

function Root() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    if (!supabaseEnabled) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (!supabaseEnabled) return <App />;
  if (session === undefined) return null;
  if (!session) return <Auth />;
  return <Gate session={session} />;
}

createRoot(document.getElementById("root")).render(<Root />);
