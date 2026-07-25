import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Session tokens are stored in the device keychain / keystore, not plain storage.
const SecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

const url = Constants.expoConfig?.extra?.supabaseUrl;
const anonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

export const supabaseEnabled = Boolean(url && anonKey && !String(url).startsWith("SET_IN"));

export const supabase = supabaseEnabled
  ? createClient(url, anonKey, {
      auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
