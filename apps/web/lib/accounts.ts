import { eq } from "drizzle-orm";
import { parseIdentifier } from "@phonebook/shared";
import { getDb, t } from "./db";
import { blindIndex, encrypt, newRecoveryCode, newUserKey, normalizeRecoveryCode, sha256, unwrapUserKey } from "./crypto";
import { hashPassword } from "./password";
import { createSession, deleteAllSessions, sessionCookie, type SessionKind, type User } from "./session";

export async function findUser(rawIdentifier: string): Promise<User | null> {
  const id = parseIdentifier(rawIdentifier);
  if (!id) return null;
  const db = await getDb();
  const where = id.kind === "phone" ? eq(t.users.phoneIdx, blindIndex(id.value)) : eq(t.users.username, id.value);
  const rows = await db.select().from(t.users).where(where).limit(1);
  return rows[0] ?? null;
}

export const userKey = (u: User) => unwrapUserKey(u.wrappedKey);

export const hashRecoveryCode = (code: string) => sha256("rc:" + normalizeRecoveryCode(code));

export async function createUser(i: { username: string; phone?: string; password: string; email?: string }) {
  const db = await getDb();
  const { key, wrapped } = newUserKey();
  const code = newRecoveryCode();
  const rows = await db
    .insert(t.users)
    .values({
      username: i.username,
      phoneIdx: i.phone ? blindIndex(i.phone) : null,
      phoneEnc: i.phone ? encrypt(key, i.phone) : null,
      passwordHash: await hashPassword(i.password),
      wrappedKey: wrapped,
      email: i.email ?? null,
      recoveryCodeHash: hashRecoveryCode(code),
    })
    .returning();
  return { user: rows[0], recoveryCode: code };
}

/** New password. Logs out every phone and browser. */
export async function setPassword(userId: string, password: string) {
  const db = await getDb();
  await db.update(t.users).set({ passwordHash: await hashPassword(password) }).where(eq(t.users.id, userId));
  await deleteAllSessions(userId);
}

export async function issueRecoveryCode(userId: string): Promise<string> {
  const db = await getDb();
  const code = newRecoveryCode();
  await db.update(t.users).set({ recoveryCodeHash: hashRecoveryCode(code) }).where(eq(t.users.id, userId));
  return code;
}

/** Make a session. Web gets a cookie header. The phone app gets the token. */
export async function startSession(userId: string, kind: SessionKind) {
  const token = await createSession(userId, kind);
  return kind === "web" ? { cookie: sessionCookie(token), token: undefined } : { cookie: undefined, token };
}

export function publicUser(u: User) {
  return { username: u.username, hasPhone: !!u.phoneIdx, email: u.email, hasRecoveryPhone: !!u.recoveryPhoneEnc };
}
