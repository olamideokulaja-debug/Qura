import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { registerPush } from "./api";

// Foreground behaviour: show the alert even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Ask permission, get the Expo push token, and register it with Qura.
// Returns { granted, token } and never throws.
export async function registerForPush() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return { granted: false, token: null };

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Qura alerts",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#00C2B8",
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenData.data;
    try { await registerPush(token, Platform.OS); } catch (e) {}
    return { granted: true, token };
  } catch (e) {
    return { granted: false, token: null, error: String(e.message || e) };
  }
}
