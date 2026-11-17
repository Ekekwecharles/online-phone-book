import { and, eq, gte } from "drizzle-orm";
import { matchesQuery } from "@phonebook/shared";
import { blindIndex, decrypt, encrypt } from "./crypto";
import { getDb, t } from "./db";
import { ApiError } from "./http";
import { userKey } from "./accounts";
import type { User } from "./session";

export const MAX_CONTACTS = 5000; // keeps the free database small

export type ContactOut = { id: string; name: string; phone: string; updatedAt: number };

export type RowIn = { id: string; name: string; phone: string; updatedAt: number };

/** Names and numbers are only decrypted in memory and are never logged. */
export async function listContacts(user: User, q: string | undefined, offset: number, limit: number) {
  const db = await getDb();
  const key = userKey(user);
  const rows = await db.select().from(t.contacts).where(and(eq(t.contacts.userId, user.id), eq(t.contacts.deleted, false)));
  let all: ContactOut[] = rows.map((r) => ({ id: r.id, name: decrypt(key, r.nameEnc), phone: decrypt(key, r.phoneEnc), updatedAt: r.updatedAt }));
  if (q?.trim()) all = all.filter((c) => matchesQuery(c.name, c.phone, q));
  all.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const page = all.slice(offset, offset + limit);
  return { contacts: page, total: all.length, next: offset + limit < all.length ? offset + limit : null };
}

/**
 * Save one contact. Last write wins: if the saved copy is newer, ours is ignored.
 * Returns true if it was saved.
 */
export async function applyChange(
  user: User,
  c: { id: string; name?: string; phone?: string; deleted?: boolean; updatedAt: number },
  now = Date.now(),
): Promise<boolean> {
  const db = await getDb();
  const key = userKey(user);
  const existing = (await db.select().from(t.contacts).where(and(eq(t.contacts.id, c.id)))).at(0);
  if (existing && existing.userId !== user.id) throw new ApiError(404, "We could not find that contact.");
  if (existing && existing.updatedAt > c.updatedAt) return false;
  // A phone's clock can be wrong. Do not accept times far in the future.
  const updatedAt = Math.min(c.updatedAt, now + 60_000);

  if (c.deleted) {
    if (!existing) {
      return true; // nothing to delete
    }
    await db.update(t.contacts).set({ deleted: true, updatedAt, syncedAt: now }).where(eq(t.contacts.id, c.id));
    return true;
  }
  if (c.name === undefined || c.phone === undefined) {
    if (!existing) throw new ApiError(400, "Type a name and a phone number.");
  }
  const name = c.name ?? decrypt(key, existing!.nameEnc);
  const phone = c.phone ?? decrypt(key, existing!.phoneEnc);
  const values = {
    nameEnc: encrypt(key, name),
    phoneEnc: encrypt(key, phone),
    phoneIdx: blindIndex(phone),
    updatedAt,
    syncedAt: now,
    deleted: false,
  };
  if (existing) {
    await db.update(t.contacts).set(values).where(eq(t.contacts.id, c.id));
  } else {
    const count = (await db.select({ id: t.contacts.id }).from(t.contacts).where(and(eq(t.contacts.userId, user.id), eq(t.contacts.deleted, false)))).length;
    if (count >= MAX_CONTACTS) throw new ApiError(400, `You can save up to ${MAX_CONTACTS} contacts.`);
    await db.insert(t.contacts).values({ id: c.id, userId: user.id, ...values });
  }
  return true;
}

/** Changes the server saved since `since`. Includes deleted ones so the phone can remove them. */
export async function changesSince(user: User, since: number) {
  const db = await getDb();
  const key = userKey(user);
  const rows = await db
    .select()
    .from(t.contacts)
    .where(and(eq(t.contacts.userId, user.id), gte(t.contacts.syncedAt, Math.max(0, since - 1000)))); // small overlap is safe
  return rows.map((r) =>
    r.deleted
      ? { id: r.id, deleted: true as const, updatedAt: r.updatedAt }
      : { id: r.id, deleted: false as const, name: decrypt(key, r.nameEnc), phone: decrypt(key, r.phoneEnc), updatedAt: r.updatedAt },
  );
}

export async function deleteAccount(userId: string) {
  const db = await getDb();
  await db.delete(t.users).where(eq(t.users.id, userId)); // contacts, sessions, logins cascade
}
