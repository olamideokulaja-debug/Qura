import Constants from "expo-constants";
import { supabase } from "./supabase";

const API_BASE = Constants.expoConfig?.extra?.apiBase || "https://qurahealth.org";

async function authHeader() {
  try {
    if (!supabase) return {};
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: "Bearer " + token } : {};
  } catch (e) {
    return {};
  }
}

async function req(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(await authHeader()), ...(options.headers || {}) },
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data.error || "Request failed (" + res.status + ")");
    err.status = res.status;
    throw err;
  }
  return data;
}

// Profile
export const getProfile = () => req("/api/profile");
export const saveProfile = (patch) => req("/api/profile", { method: "POST", body: JSON.stringify(patch) });

// Opportunities
export function getOpportunities({ country, profession, market } = {}) {
  const q = new URLSearchParams();
  if (country) q.set("country", country);
  if (profession) q.set("profession", profession);
  if (market) q.set("market", market);
  const qs = q.toString();
  return req("/api/opportunities" + (qs ? "?" + qs : ""));
}

// Applications
export const getApplications = () => req("/api/applications");
export const apply = (opportunityId, role, employer) =>
  req("/api/applications", { method: "POST", body: JSON.stringify({ opportunityId, role, employer }) });

// Push registration + preferences
export const getPushRegistration = () => req("/api/push-register");
export const registerPush = (token, platform, prefs) =>
  req("/api/push-register", { method: "POST", body: JSON.stringify({ token, platform, prefs }) });
export const savePrefs = (prefs) =>
  req("/api/push-register", { method: "POST", body: JSON.stringify({ prefs }) });
