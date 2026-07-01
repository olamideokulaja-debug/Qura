import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { supabase, supabaseEnabled } from "./supabase.js";
import "./storage.js";
import App from "./App.jsx";
import Auth from "./Auth.jsx";

if (typeof window !== "undefined") {
  window.__quraSignOut = () => { try { return supabase?.auth?.signOut(); } catch (e) {} };
}

function Root() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    if (!supabaseEnabled) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (supabaseEnabled && session === undefined) return null;      // loading
  if (supabaseEnabled && !session) return <Auth />;               // signed out
  return <App />;                                                  // signed in (or demo mode)
}

createRoot(document.getElementById("root")).render(<Root />);
