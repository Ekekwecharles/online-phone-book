import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { SESSION_IDLE_MINUTES, SESSION_MAX_MINUTES } from "@phonebook/shared";
import { getDb, t } from "./db";
import { randomToken, sha256 } from "./crypto";

export const COOKIE = "pb_session";
const MOBILE_IDLE_DAYS = 60;
const MIN = 60_000;

export type SessionKind = "web" | "mobile";
export type User = typeof t.users.$inferSelect;
export type Auth = { user: User; sessionId: string; kind: SessionKind };

export async function createSession(userId: string, kind: SessionKind): Promise<string> {
  const token = randomToken();
  const db = await getDb();
  await db.insert(t.sessions).values({ id: sha256(token), userId, kind });
  return token;
}

/** Pure rule, so it can be tested: is this session finished? */
export function sessionExpired(
  s: { kind: string; createdAt: Date; lastSeenAt: Date },
  now = Date.now(),
): boolean {
  if (s.kind === "web") {
    return (
      now - s.createdAt.getTime() > SESSION_MAX_MINUTES * MIN ||
      now - s.lastSeenAt.getTime() > SESSION_IDLE_MINUTES * MIN
    );
  }
  return now - s.lastSeenAt.getTime() > MOBILE_IDLE_DAYS * 24 * 60 * MIN;
}

export async function authFromToken(token: string | undefined | null, want?: SessionKind): Promise<Auth | null> {
  if (!token) return null;
  const db = await getDb();
  const id = sha256(token);
  const rows = await db
    .select({ s: t.sessions, u: t.users })
    .from(t.sessions)
    .innerJoin(t.users, eq(t.users.id, t.sessions.userId))
    .where(eq(t.sessions.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (want && row.s.kind !== want) return null;
  if (sessionExpired(row.s)) {
    await db.delete(t.sessions).where(eq(t.sessions.id, id));
    return null;
  }
  if (Date.now() - row.s.lastSeenAt.getTime() > 30_000) {
    await db.update(t.sessions).set({ lastSeenAt: new Date() }).where(eq(t.sessions.id, id));
  }
  return { user: row.u, sessionId: id, kind: row.s.kind as SessionKind };
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

/** For API routes: a browser cookie, or a phone app token in the Authorization header. */
export async function authFromRequest(req: Request): Promise<Auth | null> {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return authFromToken(bearer.slice(7), "mobile");
  return authFromToken(readCookie(req.headers.get("cookie"), COOKIE), "web");
}

/** For pages. */
export async function currentUser(): Promise<Auth | null> {
  const jar = await cookies();
  return authFromToken(jar.get(COOKIE)?.value, "web");
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  // No Max-Age: a session cookie. The server still ends it after the idle and hard limits.
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export async function deleteSession(id: string) {
  const db = await getDb();
  await db.delete(t.sessions).where(eq(t.sessions.id, id));
}

export async function deleteAllSessions(userId: string) {
  const db = await getDb();
  await db.delete(t.sessions).where(eq(t.sessions.userId, userId));
}

export async function deleteOtherSessions(userId: string, keepId: string) {
  const db = await getDb();
  const all = await db.select({ id: t.sessions.id }).from(t.sessions).where(eq(t.sessions.userId, userId));
  for (const s of all) if (s.id !== keepId) await db.delete(t.sessions).where(and(eq(t.sessions.id, s.id)));
}
