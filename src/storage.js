// window.storage backed by Supabase (per signed-in account + shared rows).
// Falls back to localStorage automatically when Supabase is not configured,
// no user is signed in, or a query fails — so the app always runs.
import { supabase, supabaseEnabled } from "./supabase.js";

const P = "qura::";
const local = {
  get(key) { const v = localStorage.getItem(P + key); return v === null ? null : { key, value: v }; },
  set(key, value) { localStorage.setItem(P + key, value); return { key, value }; },
  del(key) { localStorage.removeItem(P + key); return { key, deleted: true }; },
  list(prefix) { const keys = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(P + prefix)) keys.push(k.slice(P.length)); } return { keys }; },
};

async function owner(shared) {
  if (shared) return "shared";
  try { const { data } = await supabase.auth.getSession(); return data?.session?.user?.id || null; } catch { return null; }
}

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    // Anything written before sign-in lands in localStorage, because there is
    // no account to attach it to yet. Once signed in, reads go to the database.
    // Without a fallback, everything chosen before signing up is invisible
    // afterwards: the role picked on the way in, a saved search, a started
    // form. So when the account has no row for a key, look locally, and adopt
    // what is found onto the account so it is there on the next device too.
    async get(key, shared = false) {
      if (!supabaseEnabled) return local.get(key);
      try {
        const o = await owner(shared); if (!o) return local.get(key);
        const { data, error } = await supabase.from("kv").select("value").eq("owner", o).eq("key", key).limit(1).maybeSingle();
        if (error) return local.get(key);
        if (data) return { key, value: data.value };
        const fallback = local.get(key);
        if (fallback && !shared) {
          try { await supabase.from("kv").upsert({ owner: o, key, value: fallback.value }, { onConflict: "owner,key" }); } catch (e) {}
        }
        return fallback;
      } catch { return local.get(key); }
    },
    async set(key, value, shared = false) {
      if (!supabaseEnabled) return local.set(key, value);
      // Mirror locally as well as to the account. It costs nothing, and it
      // means a value survives a sign-out, a token expiry mid-flow, or the
      // database being briefly unreachable.
      if (!shared) { try { local.set(key, value); } catch (e) {} }
      try {
        const o = await owner(shared); if (!o) return { key, value };
        await supabase.from("kv").upsert({ owner: o, key, value }, { onConflict: "owner,key" });
        return { key, value };
      } catch { return local.set(key, value); }
    },
    // Delete must clear both copies, or a deleted value reappears from the
    // local mirror the moment the database row is gone.
    async delete(key, shared = false) {
      if (!shared) { try { local.del(key); } catch (e) {} }
      if (!supabaseEnabled) return { key, deleted: true };
      try {
        const o = await owner(shared); if (!o) return { key, deleted: true };
        await supabase.from("kv").delete().eq("owner", o).eq("key", key);
        return { key, deleted: true };
      } catch { return { key, deleted: true }; }
    },
    async list(prefix = "", shared = false) {
      if (!supabaseEnabled) return local.list(prefix);
      try {
        const o = await owner(shared); if (!o) return local.list(prefix);
        const { data, error } = await supabase.from("kv").select("key").eq("owner", o).like("key", prefix + "%");
        if (error) return local.list(prefix);
        return { keys: (data || []).map((r) => r.key) };
      } catch { return local.list(prefix); }
    },
  };
}
