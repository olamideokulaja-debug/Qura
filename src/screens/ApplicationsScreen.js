import React, { useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors, type } from "../theme";
import { Card, Chip, PageHead, Empty } from "../components/ui";
import { getApplications } from "../lib/api";

export default function ApplicationsScreen() {
  const [apps, setApps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setRefreshing(true);
    try { const r = await getApplications(); setApps(r.applications || []); } catch (e) {}
    setRefreshing(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <FlatList
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        data={apps}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.teal} />}
        ListHeaderComponent={<PageHead title="Applications" sub="Every role you have expressed interest in, and where it stands." />}
        ListEmptyComponent={<Empty text="No applications yet." />}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontWeight: "700", fontSize: 15, color: colors.text }}>{item.role || "Opportunity"}</Text>
                <Text style={type.small}>{item.employer}</Text>
                <Text style={[type.small, { marginTop: 4 }]}>{new Date(item.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</Text>
              </View>
              <Chip label={item.status} tone="cyan" />
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
