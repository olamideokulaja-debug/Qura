import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, type, space } from "../theme";
import { Card, Button } from "../components/ui";
import { CATEGORIES, COUNTRIES, EXPERIENCE } from "../lib/constants";
import { getProfile, saveProfile } from "../lib/api";

function Selectable({ label, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={{ paddingVertical: 12, paddingHorizontal: 15, borderRadius: radius.md, borderWidth: 1,
        borderColor: selected ? colors.teal : colors.line, backgroundColor: selected ? colors.cyanSoft : colors.white,
        marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ fontSize: 14.5, color: colors.text, fontWeight: selected ? "600" : "400" }}>{label}</Text>
      {selected ? <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: colors.teal }} /> : null}
    </TouchableOpacity>
  );
}

export default function VerifyScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { const r = await getProfile(); setP(r.profile || {}); } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const set = (patch) => setP((prev) => ({ ...prev, ...patch }));
  const catBody = p.category ? CATEGORIES[p.category].body : "";

  const steps = [
    { title: "What is your professional category?", valid: () => !!p.category },
    { title: "Your profession", valid: () => !!p.profession },
    { title: "Registration", valid: () => p.regNumber && p.regNumber.length >= 4 },
    { title: "Where are you based?", valid: () => !!p.country },
    { title: "Experience", valid: () => !!p.experienceYears },
    { title: "Your CV", valid: () => !!p.cvUploaded },
  ];

  const persist = async (patch) => {
    setSaving(true);
    try { const r = await saveProfile({ ...p, ...patch }); setP(r.profile); return r; }
    catch (e) { Alert.alert("Could not save", String(e.message || e)); }
    finally { setSaving(false); }
  };

  const next = async () => {
    if (!steps[step].valid()) { Alert.alert("Almost there", "Please complete this step to continue."); return; }
    await persist({ regBody: catBody });
    if (step < steps.length - 1) setStep(step + 1);
    else {
      const r = await persist({ regBody: catBody });
      if (r?.status?.verified) {
        Alert.alert("You are verified", "Your profile is complete and visible to hospitals and suppliers.",
          [{ text: "Great", onPress: () => navigation.goBack() }]);
      }
    }
  };

  if (loading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><ActivityIndicator color={colors.teal} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["bottom"]}>
      <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
        <View style={{ flexDirection: "row", gap: 5, marginBottom: 16 }}>
          {steps.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i <= step ? colors.teal : colors.line }} />
          ))}
        </View>
        <Text style={type.small}>Step {step + 1} of {steps.length}</Text>
        <Text style={[type.h1, { marginTop: 4, marginBottom: 14 }]}>{steps[step].title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 20 }}>
        {step === 0 && Object.keys(CATEGORIES).map((c) => (
          <Selectable key={c} label={c} selected={p.category === c} onPress={() => set({ category: c, profession: null })} />
        ))}
        {step === 1 && CATEGORIES[p.category]?.professions.map((pr) => (
          <Selectable key={pr} label={pr} selected={p.profession === pr} onPress={() => set({ profession: pr })} />
        ))}
        {step === 2 && (
          <Card>
            <Text style={type.muted}>Registered with {catBody}.</Text>
            <Text style={[type.small, { marginTop: 12, marginBottom: 6 }]}>Registration number</Text>
            <TextInput
              value={p.regNumber || ""}
              onChangeText={(t) => set({ regNumber: t })}
              autoCapitalize="characters"
              placeholder={catBody + " number"}
              placeholderTextColor={colors.faint}
              style={{ borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 13, fontSize: 15, color: colors.text }}
            />
            <Text style={[type.small, { marginTop: 10 }]}>We verify this against the {catBody} register before your profile goes live.</Text>
          </Card>
        )}
        {step === 3 && COUNTRIES.map((c) => (
          <Selectable key={c} label={c} selected={p.country === c} onPress={() => set({ country: c })} />
        ))}
        {step === 4 && EXPERIENCE.map((e) => (
          <Selectable key={e} label={e} selected={p.experienceYears === e} onPress={() => set({ experienceYears: e })} />
        ))}
        {step === 5 && (
          <Card>
            <Text style={type.muted}>Upload your CV so hospitals and suppliers can see your full background.</Text>
            <View style={{ marginTop: 14 }}>
              <Button
                title={p.cvUploaded ? "CV uploaded" : "Upload CV"}
                variant={p.cvUploaded ? "light" : "primary"}
                onPress={() => { set({ cvUploaded: true }); Alert.alert("CV attached", "In the shipping app this opens your files or camera. For now it is marked complete."); }}
              />
            </View>
            <Text style={[type.small, { marginTop: 10 }]}>An incomplete profile cannot join the network. This is what keeps Qura trusted.</Text>
          </Card>
        )}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 10, padding: 18, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white }}>
        {step > 0 ? <View style={{ flex: 1 }}><Button title="Back" variant="light" onPress={() => setStep(step - 1)} /></View> : null}
        <View style={{ flex: 2 }}><Button title={step === steps.length - 1 ? "Finish" : "Continue"} onPress={next} loading={saving} /></View>
      </View>
    </SafeAreaView>
  );
}
