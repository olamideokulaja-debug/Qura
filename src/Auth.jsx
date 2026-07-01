import { useState } from "react";
import { supabase } from "./supabase.js";

export default function Auth() {
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !pw) { setMsg("Enter your email and password."); return; }
    setBusy(true); setMsg("");
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        setMsg(error ? error.message : "Account created. Check your email to confirm, then sign in.");
        if (!error) setMode("in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) setMsg(error.message);
      }
    } catch (e) { setMsg(String(e)); }
    setBusy(false);
  };

  const input = { width: "100%", padding: "12px 14px", borderRadius: 11, border: "1px solid #d7deea", fontSize: 14, marginTop: 6, boxSizing: "border-box", fontFamily: "inherit", outline: "none" };
  const label = { fontSize: 13, fontWeight: 600, display: "block", marginTop: 14, color: "#0A1730" };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif", background: "radial-gradient(135% 120% at 0% 0%, #102A4F 0%, #0A1730 46%, #070E20 100%)" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: 34, boxShadow: "0 30px 80px rgba(0,0,0,.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#0E8C7E,#00C2B8)" }} />
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-.02em", color: "#0A1730" }}>Qura</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "16px 0 2px", color: "#0A1730" }}>{mode === "up" ? "Create your account" : "Sign in"}</h1>
        <p style={{ color: "#6B7A93", fontSize: 14, marginTop: 0 }}>Healthcare growth CRM</p>
        <label style={label}>Work email</label>
        <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organisation.com" />
        <label style={label}>Password</label>
        <input style={input} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="********" onKeyDown={(e) => e.key === "Enter" && submit()} />
        {msg && <div style={{ fontSize: 13, marginTop: 12, color: "#0A1730", background: "#EEF3FA", padding: "10px 12px", borderRadius: 10, lineHeight: 1.4 }}>{msg}</div>}
        <button onClick={submit} disabled={busy} style={{ width: "100%", marginTop: 18, padding: 13, borderRadius: 11, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, color: "#fff", background: "linear-gradient(180deg,#12a08f,#0E8C7E)", opacity: busy ? 0.7 : 1 }}>{busy ? "Please wait..." : mode === "up" ? "Create account" : "Sign in"}</button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#6B7A93" }}>
          {mode === "up" ? "Already have an account? " : "New to Qura? "}
          <button onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(""); }} style={{ background: "none", border: "none", color: "#0E8C7E", fontWeight: 700, cursor: "pointer" }}>{mode === "up" ? "Sign in" : "Create one"}</button>
        </div>
      </div>
    </div>
  );
}
