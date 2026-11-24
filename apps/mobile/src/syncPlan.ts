import { normalizeContactValue } from "@phonebook/shared";

// Pure logic. No phone or network code here, so it can be tested on a laptop.

export type DeviceContact = {
  deviceId: string; // the contact's id on this phone
  name: string;
  phones: string[];
  updatedAt?: number; // when this contact last changed on the phone (ms), if the phone tells us
};

/** What we saved online last time, for each (phone contact + number). */
export type SyncMap = Record<string, { id: string; fp: string }>;

export type Change = { id: string; name?: string; phone?: string; deleted?: boolean; updatedAt: number };

export type Plan = {
  changes: Change[];
  /** Save this as the new map only AFTER the server accepted the changes. */
  nextMap: SyncMap;
  /** true when many contacts vanished at once. We then delete nothing online. */
  suspicious: boolean;
};

const keyOf = (deviceId: string, phone: string) => `${deviceId}|${phone}`;

/** Every clean number on the phone. Used to make online ids before planning. */
export function devicePhones(contacts: DeviceContact[]): string[] {
  const out = new Set<string>();
  for (const c of contacts) for (const p of c.phones) {
    const n = normalizeContactValue(p);
    if (n) out.add(n);
  }
  return [...out];
}

/** Turn a hex hash into an id shaped like a UUID. Same input always gives the same id. */
export function uuidFromHex(hex: string): string {
  const h = hex.padEnd(32, "0").slice(0, 32).split("");
  h[12] = "5";
  h[16] = "89ab"[parseInt(h[16], 16) % 4];
  const s = h.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

/**
 * Work out what to send. Each (contact, number) becomes one online contact.
 * The id comes from the number, so the same number is never saved twice,
 * even after the app is installed again on a new phone.
 */
export function planSync(opts: { contacts: DeviceContact[]; map: SyncMap; idFor: (phone: string) => string; now: number }): Plan {
  const { contacts, map, idFor, now } = opts;
  const nextMap: SyncMap = {};
  const changes: Change[] = [];
  const sentIds = new Set<string>();
  const liveIds = new Set<string>();

  for (const c of contacts) {
    for (const raw of c.phones) {
      const phone = normalizeContactValue(raw);
      if (!phone) continue; // empty, or longer than 40 letters. Nothing to save.
      const name = c.name.trim().slice(0, 100) || phone;
      const id = idFor(phone);
      const key = keyOf(c.deviceId, phone);
      const fp = `${name}\u0000${phone}`;
      if (nextMap[key]) continue;
      nextMap[key] = { id, fp };
      liveIds.add(id);
      if (map[key]?.fp === fp || sentIds.has(id)) continue; // nothing new
      sentIds.add(id);
      changes.push({ id, name, phone, updatedAt: c.updatedAt && c.updatedAt > 0 ? Math.min(c.updatedAt, now) : now });
    }
  }

  // Contacts we saved before, but that are gone from the phone now.
  const gone = new Set<string>();
  const oldIds = new Set<string>();
  for (const [key, v] of Object.entries(map)) {
    oldIds.add(v.id);
    if (!nextMap[key] && !liveIds.has(v.id)) gone.add(v.id);
  }
  // Safety: if most contacts vanished at once, the phone probably did not give them to us
  // (for example, the permission was taken away). Never wipe the online copy for that.
  const suspicious = gone.size > 0 && (contacts.length === 0 || (oldIds.size >= 10 && gone.size * 2 > oldIds.size));
  if (suspicious) {
    for (const [key, v] of Object.entries(map)) if (gone.has(v.id)) nextMap[key] = v; // keep, try again later
  } else {
    for (const id of gone) changes.push({ id, deleted: true, updatedAt: now });
  }
  return { changes, nextMap, suspicious };
}

export function chunk<T>(a: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n));
  return out;
}
