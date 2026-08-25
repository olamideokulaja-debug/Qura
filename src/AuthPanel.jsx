// Sign in and create account.
//
// Lifted out of App.jsx. The helpers it needs — the mistyped-domain guard and
// the plain-English translation of Supabase's auth errors — moved with it,
// since nothing else uses them.

import React, { useState } from "react";
import { ArrowRight, Check, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { APP_NAME } from "./constants.js";
import { Wordmark } from "./components/ui.jsx";
import { supabase } from "./supabase.js";
import { seedActive } from "./launch.js";


const EMAIL_TYPOS = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmaill.com": "gmail.com",
  "gmail.co": "gmail.com", "gnail.com": "gmail.com", "gamil.com": "gmail.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com", "outllook.com": "outlook.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com",
  "nhs.ne": "nhs.net", "nhs.uk": "nhs.net",
};


function emailTypo(addr) {
  const at = String(addr || "").split("@");
  if (at.length !== 2) return null;
  const fix = EMAIL_TYPOS[at[1].trim().toLowerCase()];
  return fix ? at[0] + "@" + fix : null;
}

// Supabase returns "Invalid login credentials" whether the password is wrong OR
// the account simply has not been confirmed yet. Someone who has just created
// an account and cannot get in is told their password is wrong, which sends


function authMessage(msg) {
  const m = String(msg || "").toLowerCase();
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Your account exists but the email address has not been confirmed yet. Check your inbox, and your spam folder, for the confirmation link.";
  }
  if (m.includes("invalid login credentials")) {
    return "That email and password did not match. If you have only just signed up, check your inbox for the confirmation link first, since an unconfirmed account cannot sign in.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "There is already an account with that email address. Try signing in instead, or use Forgot password.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts in a short time. Please wait a few minutes and try again.";
  }
  if (m.includes("password should be")) {
    return "That password is too short. Please use at least 6 characters.";
  }
  return msg;
}

export default function AuthPanel({ mode = "in", roleLabel, onHome, onCreateAccount, onBackToSignIn }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [msg, setMsg] = useState("");
  // Shown only after a sign-in failure that an unconfirmed account could
  // explain. Declared here, in the component that renders it: an earlier
  // version had the state in one component and the render in another, which
  // crashed the whole sign-in screen.
  const [canResend, setCanResend] = useState(false);
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!supabase) { setMsg("Accounts are not switched on yet."); return; }
    if (!email || !pw) { setMsg("Enter your email and password."); return; }
    if (mode === "up" && (!first.trim() || !last.trim())) { setMsg("Please enter your first name and surname so we know how to address you."); return; }
    setBusy(true); setMsg("");
    try {
      if (mode === "up") {
        // Store the name on the account so the first screen after sign-up can
        // greet the person by name rather than falling back to anything else.
        const fullName = (first.trim() + " " + last.trim()).replace(/\s+/g, " ");
        // A mistyped domain means the confirmation email is undeliverable and
        // the account is unusable from the moment it is created.
        const fix = emailTypo(email);
        if (fix) {
          setMsg("Did you mean " + fix + "? Please check the email address before continuing.");
          setBusy(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email, password: pw,
          options: {
            // Set here rather than relying on the dashboard Site URL, which is
            // one setting away from silently sending people to the wrong page.
            emailRedirectTo: window.location.origin + "/confirmed.html",
            data: { full_name: fullName, first_name: first.trim(), last_name: last.trim() },
          },
        });
        if (error) setMsg(authMessage(error.message));
        else setMsg("Account created. Check your inbox for the confirmation link, then sign in. It can take a minute, and it sometimes lands in spam.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) {
          setMsg(authMessage(error.message));
          // Offer the resend only where it could plausibly help, so it does not
          // appear every time someone fats-fingers a password.
          const m = String(error.message || "").toLowerCase();
          setCanResend(m.includes("confirm") || m.includes("invalid login credentials"));
        } else setCanResend(false);
      }
    } catch (e) { setMsg(String(e)); }
    setBusy(false);
  };
  const soon = () => setMsg("SSO and NHS Mail sign-in are coming soon. Please continue with your email and password.");
  const up = mode === "up";
  // Self-serve sign-up opens at launch. Before then the only route in is an
  // approved early-access request, which is what the whole waitlist exists
  // for. This is the cosmetic half: the real enforcement is the "Allow new
  // users to sign up" toggle in Supabase, which the approval flow bypasses
  // because it creates users with the service role.
  // Clinicians can register themselves from today: they are the supply the
  // marketplace needs before launch, and clinician accounts are free, so
  // there is nothing to gate. The business roles still come through an
  // approved early-access request until 22 September.
  const selfServeOpen = true;
  const businessSelfServeOpen = seedActive() === false;
  return (
  <div style={{ minHeight: "100vh", position: "relative", display: "grid", placeItems: "center", padding: 24, overflow: "hidden", background: "radial-gradient(135% 120% at 0% 0%, #102A4F 0%, #0A1730 46%, #070E20 100%)" }}>
    <div className="login-orb orb-float" style={{ top: -130, right: -90, width: 440, height: 440, background: "radial-gradient(circle, rgba(0,194,184,.30), transparent 70%)" }} />
    <div className="login-orb orb-float" style={{ bottom: -150, left: -110, width: 480, height: 480, background: "radial-gradient(circle, rgba(45,107,255,.22), transparent 70%)" }} />
    <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 30, left: 34, zIndex: 4 }}><Wordmark light /></button>
      <button onClick={onHome} className="hsm" style={{ position: "absolute", top: 32, right: 34, zIndex: 4, padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.28)", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>{"←"} Back to home</button>
    <div className="row login-card reveal" style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 940, gap: 0, borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 110px rgba(0,0,0,.5)", alignItems: "stretch", border: "1px solid rgba(255,255,255,.1)" }}>
      <div className="login-brand hsm" style={{ flex: "1 1 0", padding: "46px 44px", background: "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02))", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
        <div>
          <span className="chip" style={{ background: "rgba(0,194,184,.16)", color: "#5FE6DC", border: "1px solid rgba(0,194,184,.32)" }}><Sparkles size={13} /> Healthcare growth engine</span>
          <h1 className="disp" style={{ fontSize: 33, fontWeight: 700, margin: "24px 0 14px", lineHeight: 1.12 }}>Win the right work, faster.</h1>
          <p style={{ color: "#9FB0D0", fontSize: 15, lineHeight: 1.6, maxWidth: 380 }}>One intelligent platform linking workforce suppliers, hospitals and clinicians across NHS, private and international markets.</p>
        </div>
        <div>
          <div style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "0 0 22px" }} />
          <div className="row" style={{ gap: 28 }}>{[["13,000+", "LinkedIn community"], ["100K+", "Decision-makers reached"], ["50+", "Countries"]].map(([n, l]) => (<div key={l}><div className="disp num" style={{ fontSize: 22, fontWeight: 700 }}>{n}</div><div style={{ color: "#8295B6", fontSize: 12 }}>{l}</div></div>))}</div>
        </div>
      </div>
      <div className="login-auth" style={{ flex: "1 1 0", background: "#fff", padding: "46px 42px", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <button className="show-sm" onClick={onHome} style={{ marginBottom: 20, alignSelf: "flex-start" }}><Wordmark /></button>
        <div className="ph-accent" />
        <h2 className="disp" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>{up ? "Create your account" : ("Sign in to " + APP_NAME)}</h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>{up ? (roleLabel ? ("Creating your " + roleLabel + " account") : "Join Qura in a few seconds.") : "Welcome back. Let us find your next opportunity."}</p>
        {up && (
          <div className="row" style={{ gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "20px 0 0" }}>First name</label>
              <div className="login-field"><input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Sam" /></div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "20px 0 0" }}>Surname</label>
              <div className="login-field"><input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Okafor" /></div>
            </div>
          </div>
        )}
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "20px 0 0" }}>Work email</label>
        <div className="login-field"><Mail size={16} className="faint" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@qurahealth.org" /></div>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "16px 0 0" }}>Password</label>
        <div className="login-field"><ShieldCheck size={16} className="faint" /><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submit()} /></div>
        {/* This was wired to the coming-soon handler, so anyone locked out was
            told to wait rather than being helped. reset-password.html already
            exists and is what the founder approval emails use. */}
        {!up && <div className="row" style={{ justifyContent: "flex-end", marginTop: 12, fontSize: 12.5 }}>
          <span style={{ color: "var(--teal)", fontWeight: 600, cursor: "pointer" }} onClick={async () => {
            const addr = String(email || "").trim();
            if (!addr || !addr.includes("@")) { setMsg("Enter your email address above first, then press Forgot password."); return; }
            const fix = emailTypo(addr);
            if (fix) { setMsg("Did you mean " + fix + "?"); return; }
            setBusy(true);
            try {
              await supabase.auth.resetPasswordForEmail(addr, {
                redirectTo: window.location.origin + "/reset-password.html",
              });
            } catch (e) {}
            setBusy(false);
            // Deliberately does not say whether the account exists.
            setMsg("If there is an account for that address, a reset link is on its way. It can take a minute, and it sometimes lands in spam.");
          }}>Forgot password?</span>
        </div>}
        {msg && <div className="muted" style={{ fontSize: 13, marginTop: 14, background: "var(--bg)", padding: "10px 12px", borderRadius: 10, lineHeight: 1.45 }}>{msg}</div>}
        {canResend && !resent ? (
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <button className="btn btn-light" style={{ fontSize: 13 }} onClick={async () => {
              // Resends the confirmation link. Supabase does not reveal whether
              // the address exists, so this is safe to offer to anyone.
              try {
                await supabase.auth.resend({
                  type: "signup", email,
                  options: { emailRedirectTo: window.location.origin + "/confirmed.html" },
                });
              } catch (e) {}
              setResent(true);
              setMsg("If that address has an unconfirmed account, a new confirmation link is on its way. It can take a minute, and it sometimes lands in spam.");
            }}>Resend the confirmation email</button>
          </div>
        ) : null}
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 18, padding: 13 }} onClick={submit} disabled={busy}>{busy ? "Please wait..." : (up ? "Create account" : "Sign in")} <ArrowRight size={16} /></button>
        <div className="row" style={{ gap: 12, margin: "18px 0", color: "var(--faint)", fontSize: 12 }}><div style={{ flex: 1, height: 1, background: "var(--line)" }} /> or continue with <div style={{ flex: 1, height: 1, background: "var(--line)" }} /></div>
        <div className="row" style={{ gap: 10 }}><button className="btn btn-light" style={{ flex: 1, justifyContent: "center", background: "var(--bg)" }} onClick={soon}><ShieldCheck size={15} /> SSO</button><button className="btn btn-light" style={{ flex: 1, justifyContent: "center", background: "var(--bg)" }} onClick={soon}><Mail size={15} /> NHS Mail</button></div>
        {!businessSelfServeOpen && !up ? (
          <div className="card" style={{ padding: "12px 16px", marginTop: 16, background: "var(--cyan-soft)", border: "none" }}>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#06776F" }}>
              <strong>Clinicians can join today.</strong> Create your account, get verified, and be visible to hospitals and workforce suppliers from the moment we open. Organisations join on 22 September, or sooner by requesting early access on the home page.
            </div>
          </div>
        ) : null}
        <div className="row" style={{ justifyContent: "center", gap: 6, marginTop: 18, fontSize: 13 }}><span className="muted">{up ? "Already have an account?" : (selfServeOpen ? "New member?" : "")}</span>{(up || selfServeOpen) ? <button onClick={() => { setMsg(""); if (up) { onBackToSignIn && onBackToSignIn(); } else { onCreateAccount && onCreateAccount(); } }} style={{ color: "var(--teal)", fontWeight: 700, background: "none", cursor: "pointer" }}>{up ? "Sign in" : "Create account"}</button> : null}</div>
      </div>
    </div>
  </div>
  );
}
