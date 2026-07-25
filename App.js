import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

import { colors } from "./src/theme";
import { supabase, supabaseEnabled } from "./src/lib/supabase";
import { registerForPush } from "./src/lib/push";
import SignInScreen from "./src/screens/SignInScreen";
import HomeScreen from "./src/screens/HomeScreen";
import OpportunitiesScreen from "./src/screens/OpportunitiesScreen";
import ApplicationsScreen from "./src/screens/ApplicationsScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import VerifyScreen from "./src/screens/VerifyScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Dot({ color, filled }) {
  return <View style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: color,
    borderWidth: filled ? 0 : 1.5, borderColor: color }} />;
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { borderTopColor: colors.line, height: 84, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: "600" },
      }}>
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: ({ color, focused }) => <Dot color={color} filled={focused} /> }} />
      <Tab.Screen name="Opportunities" component={OpportunitiesScreen}
        options={{ tabBarIcon: ({ color, focused }) => <Dot color={color} filled={focused} /> }} />
      <Tab.Screen name="Applications" component={ApplicationsScreen}
        options={{ tabBarIcon: ({ color, focused }) => <Dot color={color} filled={focused} /> }} />
      <Tab.Screen name="Alerts" component={NotificationsScreen}
        options={{ tabBarIcon: ({ color, focused }) => <Dot color={color} filled={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    if (!supabaseEnabled) { setReady(true); return; }
    let sub;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session || null);
      setReady(true);
      const listener = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      sub = listener?.data?.subscription;
    })();
    return () => { try { sub?.unsubscribe(); } catch (e) {} };
  }, []);

  // After sign-in: register for push, and handle taps on a notification.
  useEffect(() => {
    if (!session) return;
    registerForPush();
    const routeFor = (data) => {
      if (!data) return null;
      if (data.type === "match") return "Opportunities";
      if (data.type === "introduction") return "Home";
      if (data.type === "interview") return "Applications";
      return null;
    };
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const route = routeFor(resp?.notification?.request?.content?.data);
      if (route && navRef.current) { try { navRef.current.navigate(route); } catch (e) {} }
    });
    return () => { try { sub.remove(); } catch (e) {} };
  }, [session]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.cyan} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={session ? "dark" : "light"} />
      <NavigationContainer ref={navRef}>
        {session ? (
          <Stack.Navigator>
            <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="Verify" component={VerifyScreen}
              options={{ title: "Get verified", headerTintColor: colors.navy, headerShadowVisible: false }} />
          </Stack.Navigator>
        ) : (
          <SignInScreen />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
