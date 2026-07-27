import React, { useEffect, useState } from "react";
import { enableAnalytics, disableAnalytics } from "../lib/analytics.js";

// Extracted from App.jsx on 27 July 2026. Behaviour unchanged.

export function PrivacyContent() {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text)" }}>
      <p style={{ marginTop: 0 }}><b>Data controller.</b> Qura Ltd (company no. 17310951), registered office 167-169 Great Portland Street, 5th Floor, London W1W 5PF, is the controller of your personal data. Contact us at privacy@qurahealth.org.</p>
      <p>Qura is committed to protecting your personal data in line with the UK GDPR and the Data Protection Act 2018.</p>
      <p><b>What we collect.</b> Account details you provide (name, email, role), the data you add (shortlists, notes, messages) and the basic usage needed to run the service.</p>
      <p><b>Lawful basis.</b> We process account data to provide the service you signed up for (contract), and professional business-contact information on the basis of legitimate interests, balanced against individuals' rights. Contact details are masked until consent is confirmed.</p>
      <p><b>Your rights.</b> You can access, correct, export or delete your data, object to processing, and withdraw consent at any time. Use the data controls in Settings, or contact privacy@qurahealth.org.</p>
      <p><b>Retention & security.</b> Data is stored per account and kept only as long as needed. We do not sell your data and we do not show third-party ads.</p>
      <p><b>Personal profiles.</b> Individuals' names and contact details are anonymised or withheld until written consent is given, in line with GDPR.</p>
      <p className="faint" style={{ fontSize: 12 }}>This is a plain-English summary. For a specific request, contact privacy@qurahealth.org.</p>
    </div>
  );
}

export function RefundContent() {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text)" }}>
      <p style={{ marginTop: 0 }}><b>Who we are.</b> Qura Ltd (company no. 17310951), 167-169 Great Portland Street, 5th Floor, London W1W 5PF.</p>
      <p><b>Cancelling a subscription.</b> Cancel any time in your account settings or by emailing support@qurahealth.org. Cancelling stops the next renewal, and your access continues until the end of the period you have already paid for.</p>
      <p><b>Your first 14 days.</b> If you are unhappy within 14 days of a new subscription, contact us and we will refund your first payment in full. Consumers also have a statutory 14 day right to cancel; where the service starts immediately, a proportionate deduction may apply for what has been used.</p>
      <p><b>Renewals.</b> Renewal payments are not automatically refundable, since you can cancel any time before a renewal date. We send a reminder before annual renewals, and will consider unused renewals case by case.</p>
      <p><b>Sessions and workshops.</b> Cancel or reschedule free of charge up to 48 hours before the start time, for a full refund or a new date. Inside 48 hours the fee is non-refundable, though we will try to reschedule where we can. If we cancel, you get a full refund or a replacement booking.</p>
      <p><b>How to request one.</b> Email support@qurahealth.org with your account email. We aim to reply within 2 working days, and approved refunds return to your original payment method within 5 to 10 working days.</p>
      <p><b>Price changes.</b> Existing subscribers are told in advance, and any new price applies from the next renewal, never mid-term.</p>
    </div>
  );
}

export function CookieContent() {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text)" }}>
      <p style={{ marginTop: 0 }}>Qura uses essential cookies and browser storage to run the service, for example keeping you signed in and remembering your consent choice. With your consent, we may use a little analytics to improve the product.</p>
      <p><b>Your choice.</b> On your first visit you can choose Accept all or Essential only. You can change this at any time by clearing your browser storage or contacting privacy@qurahealth.org.</p>
      <p><b>Third parties.</b> Payment (Stripe) and hosting (Vercel) may set cookies when their features are used, under their own notices.</p>
      <p><b>Who we are.</b> Qura Ltd (company no. 17310951), 167-169 Great Portland Street, 5th Floor, London W1W 5PF.</p>
      <p className="faint" style={{ fontSize: 12 }}>The full cookie policy is available on request at privacy@qurahealth.org.</p>
    </div>
  );
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => { (async () => { try { const r = await window.storage?.get("qura_cookie_consent"); if (!r || !r.value) setShow(true); } catch (e) { setShow(true); } })(); }, []);
  // Anyone can change their mind later: the footer link fires this event and the
  // banner comes back. Withdrawing consent has to be as easy as giving it.
  useEffect(() => {
    const reopen = () => setShow(true);
    window.addEventListener("qura:cookie-preferences", reopen);
    return () => window.removeEventListener("qura:cookie-preferences", reopen);
  }, []);

  const choose = (v) => {
    try { window.storage?.set("qura_cookie_consent", v); } catch (e) {}
    if (v === "all") { enableAnalytics(); } else { disableAnalytics(); }
    setShow(false);
  };
  if (!show && !open) return null;
  return (
    <>
      {open ? <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(6,14,30,.55)", zIndex: 90, display: "grid", placeItems: "center", padding: 20 }}><div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 560, width: "100%", padding: 26, maxHeight: "82vh", overflowY: "auto" }}><div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}><h3 className="disp" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Privacy & data protection</h3><button className="btn btn-light" style={{ padding: "6px 9px" }} onClick={() => setOpen(false)}>Close</button></div><PrivacyContent /></div></div> : null}
      {show ? <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 80, padding: 16, display: "flex", justifyContent: "center" }}><div className="card" style={{ maxWidth: 720, width: "100%", padding: 16, boxShadow: "0 12px 40px rgba(10,23,51,.28)" }}><div className="row" style={{ gap: 14, justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}><div style={{ fontSize: 13, lineHeight: 1.5, flex: 1, minWidth: 220 }}>We use essential cookies to run Qura and, with your consent, a little analytics to improve it. See our <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 600, cursor: "pointer", padding: 0 }}>privacy notice</button>.</div><div className="row" style={{ gap: 8 }}><button className="btn btn-light" onClick={() => choose("essential")}>Essential only</button><button className="btn btn-primary" onClick={() => choose("all")}>Accept all</button></div></div></div></div> : null}
    </>
  );
}
