import React, { useState } from "react";
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { colors, radius, type } from "../theme";
import { Button } from "../components/ui";
import { supabase, supabaseEnabled } from "../lib/supabase";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("in");

  const submit = async () => {
    if (!supabaseEnabled) {
      Alert.alert("Not configured", "Add your Supabase keys to app.json extra, or EAS secrets.");
      return;
    }
    setBusy(true);
    try {
      const fn = mode === "in" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const { error } = await fn.call(supabase.auth, { email: email.trim(), password });
      if (error) Alert.alert(mode === "in" ? "Could not sign in" : "Could not sign up", error.message);
    } catch (e) {
      Alert.alert("Something went wrong", String(e.message || e));
    }
    setBusy(false);
  };

  const field = {
    borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 13, color: colors.white, marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.07)", fontSize: 15,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.navy, justifyContent: "center", padding: 26 }}>
      <Text style={{ fontSize: 40, fontWeight: "800", color: colors.white, letterSpacing: 1 }}>Qura</Text>
      <Text style={{ color: colors.cyan, fontSize: 14, marginTop: 4, marginBottom: 28 }}>
        Healthcare growth platform
      </Text>
      <TextInput
        style={field}
        placeholder="you@organisation.com"
        placeholderTextColor="rgba(255,255,255,0.45)"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={field}
        placeholder="Password"
        placeholderTextColor="rgba(255,255,255,0.45)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title={mode === "in" ? "Sign in" : "Create account"} onPress={submit} loading={busy} />
      <Text
        onPress={() => setMode(mode === "in" ? "up" : "in")}
        style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 18, fontSize: 13.5 }}>
        {mode === "in" ? "New to Qura? Create an account" : "Already have an account? Sign in"}
      </Text>
    </KeyboardAvoidingView>
  );
}
