import React, { useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, type } from "../theme";
import { Card, Chip, Button, PageHead, Empty } from "../components/ui";
import { MARKETS } from "../lib/constants";
import { getOpportunities, getApplications, apply } from "../lib/api";
import { FitRing } from "../components/graphics";

export default function OpportunitiesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [applied, setApplied] = useState({});
  const [market, setMarket] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (m = market) => {
    setRefreshing(true);
    try {
      const [op, ap] = await Promise.all([getOpportunities({ market: m }), getApplications()]);
      setItems(op.items || []);
      const map = {}; (ap.applications || []).forEach((a) => { map[a.opportunityId] = a.status; });
      setApplied(map);
    } catch (e) {}
    setRefreshing(false);
  }, [market]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onApply = async (o) => {
    setBusyId(o.id);
    try {
      await apply(o.id, o.role, o.employer);
      setApplied((m) => ({ ...m, [o.id]: "Interest sent" }));
    } catch (e) {}
    setBusyId(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <FlatList
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load()} tintColor={colors.teal} />}
        ListHeaderComponent={
          <View>
            <PageHead title="Opportunities" sub="Roles matched to your profile, updating around the clock." />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {MARKETS.map((m) => (
                <TouchableOpacity key={m} onPress={() => { setMarket(m); load(m); }} activeOpacity={0.8}
                  style={{ paddingVertical: 8, paddingHorizontal: 15, borderRadius: 999, marginRight: 8,
                    backgroundColor: market === m ? colors.navy : colors.white, borderWidth: 1, borderColor: market === m ? colors.navy : colors.line }}>
                  <Text style={{ color: market === m ? colors.white : colors.muted, fontWeight: "600", fontSize: 13 }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          // An empty page should recruit, not apologise. Before launch this
          // rarely shows. After 22 September, when the illustrative roles
          // switch off, it is what a clinician sees until the first real
          // requirement is posted, so it asks them to do the two things that
          // make them findable the moment one is.
          <View style={{ padding: 26, alignItems: "center" }}>
            <Text style={[type.h2, { textAlign: "center" }]}>Nothing matching you yet</Text>
            <Text style={[type.muted, { textAlign: "center", marginTop: 8, lineHeight: 20 }]}>
              Requirements are posted by hospitals, GP practices and workforce suppliers throughout the day.
              Get verified and keep your profile current, and you will be in front of them the moment one lands.
            </Text>
            <View style={{ marginTop: 16, width: "100%" }}>
              {/* Only routes this repo actually contains. VerifyScreen exists;
                  a profile screen does not, so it is a line of text rather
                  than a button that might not resolve. */}
              <Button title="Get verified" onPress={() => navigation.navigate("Verify")} />
            </View>
            <Text style={[type.muted, { textAlign: "center", marginTop: 14, fontSize: 12 }]}>
              Pull down to refresh.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const done = !!applied[item.id];
          return (
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={[type.h2, { flex: 1, paddingRight: 10 }]}>{item.role}</Text>
                <FitRing value={item.fit} />
              </View>
              <Text style={[type.muted, { marginTop: 2 }]}>{item.employer} · {item.region}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4, marginBottom: 8 }}>
                <Chip label={item.market} tone="blue" />
                <Chip label={item.rate} tone="grey" />
                <Chip label={"Start " + item.start} tone="grey" />
              </View>
              <Text style={[type.muted, { marginBottom: 12 }]}>{item.summary}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={type.small}>Closes in {item.closes}</Text>
                <View style={{ width: 150 }}>
                  <Button
                    title={done ? "Interest sent" : "Express interest"}
                    variant={done ? "light" : "primary"}
                    disabled={done}
                    loading={busyId === item.id}
                    onPress={() => onApply(item)}
                  />
                </View>
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}
