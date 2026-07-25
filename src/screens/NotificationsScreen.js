import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Switch, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, type } from "../theme";
import { Card, PageHead, Button } from "../components/ui";
import { getPushRegistration, savePrefs } from "../lib/api";
import { registerForPush } from "../lib/push";
import { supabase } from "../lib/supabase";

const ROWS = [
  ["matches", "Matching roles", "The moment a role fits your profile and location."],
  ["introductions", "Introductions", "When a hospital or supplier asks to connect with you."],
  ["interviews", "Interview updates", "Confirmations, reminders and outcome updates."],
];

export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState({ matches: true, introductions: true, interviews: true });
  const [loading, setLoading] = useState(true);
  const [granted, setGranted] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await getPushRegistration();
        if (r?.registration?.prefs) setPrefs(r.registration.prefs);
        setGranted(!!r?.registration?.token);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const toggle = async (key) => {
    const nextPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(nextPrefs);
    try { await savePrefs(nextPrefs); } catch (e) { Alert.alert("Could not save", "Your change was not saved. Try again."); }
  };

  const enablePush = async () => {
    const res = await registerForPush();
    setGranted(res.granted);
    if (!res.granted) {
      Alert.alert("Notifications are off", "To get alerts, enable notifications for Qura in your device settings.");
    }
  };

  const signOut = async () => {
    try { if (supabase) await supabase.auth.signOut(); } catch (e) { Alert.alert("Could not sign out"); }
  };

  if (loading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><ActivityIndicator color={colors.teal} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <PageHead title="Notifications" sub="Choose what Qura tells you about. This is the reason to keep the app installed." />

        {granted === false ? (
          <View style={{ backgroundColor: colors.navy, borderRadius: radius.lg, padding: 18, marginBottom: 14 }}>
            <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>Turn on alerts</Text>
            <Text style={{ color: "#AEBED6", fontSize: 13, marginTop: 6, lineHeight: 19 }}>
              You will not hear about matching roles until notifications are enabled.
            </Text>
            <View style={{ marginTop: 14 }}><Button title="Enable notifications" onPress={enablePush} /></View>
          </View>
        ) : null}

        {ROWS.map(([key, label, desc]) => (
          <Card key={key}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontWeight: "700", fontSize: 15, color: colors.text }}>{label}</Text>
                <Text style={[type.muted, { marginTop: 3 }]}>{desc}</Text>
              </View>
              <Switch
                value={!!prefs[key]}
                onValueChange={() => toggle(key)}
                trackColor={{ false: colors.line, true: colors.teal }}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        ))}

        <View style={{ marginTop: 10 }}>
          <Button title="Sign out" variant="light" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
