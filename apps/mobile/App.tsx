import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Platform, Pressable, SafeAreaView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Contacts from "expo-contacts";
import * as BackgroundTask from "expo-background-task";
import { APP_NAME } from "@phonebook/shared";
import { api, setLoggedOutHandler } from "./src/api";
import { registerForPush } from "./src/push";
import { clearLogin, getToken, getUsername, setToken, setUsername } from "./src/storage";
import { runSync } from "./src/sync";
import { SYNC_TASK } from "./src/task";
import { LoginScreen, RecoverScreen, SignupScreen, type Route } from "./src/screens/AuthScreens";
import { ContactsScreen, LoginsScreen, SettingsScreen } from "./src/screens/HomeScreens";
import { c } from "./src/ui";

type Tab = "contacts" | "logins" | "settings";
const TABS: { key: Tab; label: string }[] = [
  { key: "contacts", label: "Contacts" },
  { key: "logins", label: "Recent logins" },
  { key: "settings", label: "Settings" },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [route, setRoute] = useState<Route>("login");
  const [tab, setTab] = useState<Tab>("contacts");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishLogout = useCallback(async () => {
    await clearLogin();
    try {
      await BackgroundTask.unregisterTaskAsync(SYNC_TASK);
    } catch {}
    setUser(null);
    setRoute("login");
    setTab("contacts");
  }, []);

  // First open: are we already logged in?
  useEffect(() => {
    setLoggedOutHandler(() => void finishLogout());
    (async () => {
      if (await getToken()) setUser((await getUsername()) ?? "");
      setReady(true);
    })();
  }, [finishLogout]);

  // While logged in: save on open, save when contacts change, and plan a background save.
  useEffect(() => {
    if (!user && user !== "") return;
    void runSync();
    void registerForPush();
    BackgroundTask.registerTaskAsync(SYNC_TASK, { minimumInterval: 15 }).catch(() => {});
    const app = AppState.addEventListener("change", (s) => s === "active" && void runSync());
    const sub = Contacts.addContactsChangeListener(() => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => void runSync(), 3000); // wait for the phone to finish
    });
    return () => {
      app.remove();
      sub.remove();
    };
  }, [user]);

  async function loggedIn(token: string, username: string) {
    await setToken(token);
    await setUsername(username);
    setUser(username);
  }
  async function logoutEverywhere() {
    await api("POST", "/auth/logout-all");
    await finishLogout();
  }
  async function logout() {
    await api("POST", "/auth/logout");
    await finishLogout();
  }

  if (!ready) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={c.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? 28 : 0 }}>
      <StatusBar style="dark" />
      <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: c.brand }}>{APP_NAME}</Text>
      </View>
      {user === null ? (
        route === "signup" ? (
          <SignupScreen go={setRoute} onDone={loggedIn} />
        ) : route === "recover" ? (
          <RecoverScreen go={setRoute} />
        ) : (
          <LoginScreen go={setRoute} onDone={loggedIn} />
        )
      ) : (
        <>
          <View style={{ flex: 1 }}>
            {tab === "contacts" && <ContactsScreen goSettings={() => setTab("settings")} />}
            {tab === "logins" && <LoginsScreen onLogoutAll={logoutEverywhere} />}
            {tab === "settings" && <SettingsScreen username={user} onLogout={logout} onLogoutAll={logoutEverywhere} onDeleted={finishLogout} />}
          </View>
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: c.line }}>
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t.key }}
                onPress={() => setTab(t.key)}
                style={{ flex: 1, minHeight: 56, alignItems: "center", justifyContent: "center", backgroundColor: tab === t.key ? c.brandLight : "#fff" }}
              >
                <Text style={{ fontSize: 16, fontWeight: "800", color: tab === t.key ? c.brandDark : c.muted }}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
