import { Contact, ContactField, getPermissionsAsync } from "expo-contacts";
import * as Crypto from "expo-crypto";
import { api } from "./api";
import { getLastSaved, getMap, getToken, getUsername, setLastSaved, setMap } from "./storage";
import { chunk, devicePhones, planSync, uuidFromHex, type DeviceContact } from "./syncPlan";

export type SyncState = "idle" | "saving" | "saved" | "offline" | "error" | "no-permission" | "paused";
export type SyncStatus = { state: SyncState; lastSaved: number | null; message?: string };

let status: SyncStatus = { state: "idle", lastSaved: null };
const listeners = new Set<(s: SyncStatus) => void>();
const set = (s: Partial<SyncStatus>) => {
  status = { ...status, ...s };
  listeners.forEach((l) => l(status));
};
export const getStatus = () => status;
export function onStatus(fn: (s: SyncStatus) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Read every contact on the phone, a few hundred at a time so old phones do not choke. */
async function readPhoneContacts(): Promise<DeviceContact[]> {
  const out: DeviceContact[] = [];
  const PAGE = 300;
  for (let offset = 0; ; offset += PAGE) {
    const rows = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES], { limit: PAGE, offset });
    for (const r of rows) {
      const phones = (r.phones ?? []).map((p) => p.number).filter((n): n is string => !!n);
      if (phones.length) out.push({ deviceId: "", name: r.fullName ?? "", phones });
    }
    if (rows.length < PAGE) break;
  }
  return out;
}

const sha256 = (s: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);

let running: Promise<SyncStatus> | null = null;

/** Save the phone's contacts online. Safe to call many times. Only one runs at once. */
export function runSync(): Promise<SyncStatus> {
  running ??= doSync().finally(() => {
    running = null;
  });
  return running;
}

async function doSync(): Promise<SyncStatus> {
  const lastSaved = await getLastSaved();
  set({ lastSaved });
  if (!(await getToken())) return status;

  const perm = await getPermissionsAsync();
  if (!perm.granted) {
    set({ state: "no-permission", message: undefined });
    return status;
  }

  set({ state: "saving", message: undefined });
  try {
    const username = (await getUsername()) ?? "";
    const contacts = await readPhoneContacts();
    const ids = new Map<string, string>();
    for (const p of devicePhones(contacts)) ids.set(p, uuidFromHex(await sha256(`${username}|${p}`)));
    const plan = planSync({ contacts, map: await getMap(), idFor: (p) => ids.get(p) ?? uuidFromHex(p), now: Date.now() });

    // The server takes 500 changes at a time.
    for (const part of chunk(plan.changes, 500)) {
      const r = await api("POST", "/sync", { since: Date.now(), changes: part }, { timeoutMs: 60_000 });
      if (!r.ok) {
        set(r.offline ? { state: "offline" } : { state: "error", message: r.error });
        return status; // the map is not saved, so the next try sends these again
      }
    }
    await setMap(plan.nextMap);
    const now = Date.now();
    await setLastSaved(now);
    set(
      plan.suspicious
        ? { state: "paused", lastSaved: now, message: "Many contacts look missing on this phone. We did not delete anything online." }
        : { state: "saved", lastSaved: now, message: undefined },
    );
  } catch {
    set({ state: "error", message: "We could not read your contacts. Please try again." });
  }
  return status;
}
