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
    async get(key, shared = false) {
      if (!supabaseEnabled) return local.get(key);
      try {
        const o = await owner(shared); if (!o) return local.get(key);
        const { data, error } = await supabase.from("kv").select("value").eq("owner", o).eq("key", key).limit(1).maybeSingle();
        if (error) return local.get(key);
        return data ? { key, value: data.value } : null;
      } catch { return local.get(key); }
    },
    async set(key, value, shared = false) {
      if (!supabaseEnabled) return local.set(key, value);
      try {
        const o = await owner(shared); if (!o) return local.set(key, value);
        await supabase.from("kv").upsert({ owner: o, key, value }, { onConflict: "owner,key" });
        return { key, value };
      } catch { return local.set(key, value); }
    },
    async delete(key, shared = false) {
      if (!supabaseEnabled) return local.del(key);
      try {
        const o = await owner(shared); if (!o) return local.del(key);
        await supabase.from("kv").delete().eq("owner", o).eq("key", key);
        return { key, deleted: true };
      } catch { return local.del(key); }
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
