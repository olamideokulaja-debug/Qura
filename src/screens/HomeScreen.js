import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, type, shadow } from "../theme";
import { Card, Button, Chip } from "../components/ui";
import { getProfile, getApplications, getOpportunities } from "../lib/api";
import { Logo, VerifyDonut, MarketMix, Sparkline } from "../components/graphics";

export default function HomeScreen({ navigation }) {
  const [status, setStatus] = useState(null);
  const [profile, setProfile] = useState({});
  const [apps, setApps] = useState([]);
  const [matches, setMatches] = useState(0);
  const [counts, setCounts] = useState({ NHS: 0, Private: 0, International: 0 });
  const [totalOpen, setTotalOpen] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [pr, ap, op] = await Promise.all([getProfile(), getApplications(), getOpportunities()]);
      setProfile(pr.profile || {}); setStatus(pr.status || null);
      setApps(ap.applications || []);
      const items = op.items || [];
      setMatches(items.filter((o) => o.fit >= 85).length);
      const c = { NHS: 0, Private: 0, International: 0 };
      items.forEach((o) => { if (c[o.market] !== undefined) c[o.market] += 1; });
      setCounts(c); setTotalOpen(items.length);
    } catch (e) {}
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const verified = status?.verified;
  const pct = status ? Math.round((status.done / status.total) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.teal} />}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Logo size={22} stroke={colors.navy} />
          <Text style={[type.small, { letterSpacing: 2 }]}>QURA</Text>
        </View>
        <Text style={[type.display, { marginTop: 2, marginBottom: 16 }]}>
          {profile.profession ? "Welcome back" : "Welcome to Qura"}
        </Text>

        {!verified ? (
          <View style={{ backgroundColor: colors.navy, borderRadius: radius.lg, padding: 20, marginBottom: 14, ...shadow }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <VerifyDonut pct={pct} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.white, fontWeight: "700", fontSize: 16 }}>Get verified to be seen</Text>
                <Text style={{ color: "#AEBED6", fontSize: 13.5, marginTop: 6, lineHeight: 20 }}>
                  Hospitals and suppliers around the world can only see verified profiles.
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 16 }}>
              <Button title="Continue verification" onPress={() => navigation.navigate("Verify")} />
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.cyanSoft, borderRadius: radius.lg, padding: 18, marginBottom: 14, flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: colors.teal, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Text style={{ color: colors.white, fontWeight: "800" }}>✓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 15 }}>You are verified</Text>
              <Text style={{ color: colors.muted, fontSize: 12.5, marginTop: 2 }}>{profile.profession} · {profile.country}</Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 6 }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => navigation.navigate("Opportunities")}>
            <Card style={{ marginBottom: 0 }}>
              <Text style={{ fontSize: 30, fontWeight: "800", color: colors.teal, fontFamily: undefined }}>{matches}</Text>
              <Text style={type.muted}>Strong matches waiting</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => navigation.navigate("Applications")}>
            <Card style={{ marginBottom: 0 }}>
              <Text style={{ fontSize: 30, fontWeight: "800", color: colors.blueInk }}>{apps.length}</Text>
              <Text style={type.muted}>Applications in flight</Text>
            </Card>
          </TouchableOpacity>
        </View>

        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={type.h2}>Live market right now</Text>
            <Chip label={totalOpen + " open"} tone="cyan" />
          </View>
          <MarketMix counts={counts} />
        </Card>
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text style={type.h2}>New roles this week</Text>
            <Chip label="7 days" tone="grey" />
          </View>
          <Text style={[type.small, { marginBottom: 10 }]}>33 new opportunities appeared, trending up</Text>
          <Sparkline />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text style={type.small}>Mon</Text><Text style={type.small}>Sun</Text>
          </View>
        </Card>
        <Text style={[type.h2, { marginTop: 22, marginBottom: 10 }]}>Recent applications</Text>
        {apps.length ? apps.slice(0, 3).map((a) => (
          <Card key={a.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontWeight: "700", fontSize: 14.5, color: colors.text }}>{a.role || "Opportunity"}</Text>
                <Text style={type.small}>{a.employer}</Text>
              </View>
              <Chip label={a.status} tone="cyan" />
            </View>
          </Card>
        )) : (
          <Card><Text style={type.muted}>No applications yet. Browse opportunities and express interest.</Text></Card>
        )}
        <View style={{ marginTop: 6 }}>
          <Button title="Browse opportunities" variant="light" onPress={() => navigation.navigate("Opportunities")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
