import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import type { SyncMap } from "./syncPlan";

// The login token goes in the phone's secure store. The background job can read it too.
const secure = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };
const TOKEN = "pb_token";
const DEVICE = "pb_device";
const USER = "pb_user";
const MAP = "pb_map";
const SAVED = "pb_last_saved";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN, secure);
  } catch {
    return null; // if the secure store fails, act as logged out instead of crashing
  }
}
export const setToken = (t: string) => SecureStore.setItemAsync(TOKEN, t, secure);

/** A random id for this phone. It lets the server tell "same phone" from "new phone". */
export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE, secure);
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE, id, secure);
  }
  return id;
}

export const getUsername = () => AsyncStorage.getItem(USER);
export const setUsername = (u: string) => AsyncStorage.setItem(USER, u);

/** Only a list of ids and fingerprints. It has no names and no phone numbers. */
export async function getMap(): Promise<SyncMap> {
  try {
    return JSON.parse((await AsyncStorage.getItem(MAP)) ?? "{}") as SyncMap;
  } catch {
    return {};
  }
}
export const setMap = (m: SyncMap) => AsyncStorage.setItem(MAP, JSON.stringify(m));

export async function getLastSaved(): Promise<number | null> {
  const v = await AsyncStorage.getItem(SAVED);
  return v ? Number(v) : null;
}
export const setLastSaved = (n: number) => AsyncStorage.setItem(SAVED, String(n));

/** On log out: forget the login and what we remembered. The phone id stays. */
export async function clearLogin() {
  await SecureStore.deleteItemAsync(TOKEN, secure);
  await AsyncStorage.multiRemove([USER, MAP, SAVED]);
}
