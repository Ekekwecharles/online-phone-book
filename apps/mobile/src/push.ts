import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

// Show login notices even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** Ask for permission, get the Expo push token, and tell the server. Fails quietly. */
export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    if (!projectId) return; // set after the Expo account is connected
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("logins", { name: "Login notices", importance: Notifications.AndroidImportance.HIGH });
    }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await api("POST", "/push-token", { token, platform: Platform.OS === "ios" ? "ios" : "android" });
  } catch {
    // Push is a bonus. Never break the app for it.
  }
}
