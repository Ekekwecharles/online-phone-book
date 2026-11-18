import { eq } from "drizzle-orm";
import { APP_NAME } from "@phonebook/shared";
import { getDb, t } from "./db";
import { safeEqual, sha256, sixDigitCode } from "./crypto";
import { sendMail } from "./mailer";
import type { User } from "./session";

/** The email we may use for notices and recovery. Only after the person proved it is theirs. */
export const verifiedEmail = (u: Pick<User, "email" | "emailVerifiedAt">): string | null =>
  u.email && u.emailVerifiedAt ? u.email : null;

const hashFor = (userId: string, email: string, code: string) => sha256(`ev:${userId}:${email}:${code}`);

/** Send a 6-digit code to the saved email. Returns false if the email could not be sent. */
export async function sendVerifyCode(user: Pick<User, "id" | "email">): Promise<boolean> {
  if (!user.email) return false;
  const db = await getDb();
  const code = sixDigitCode();
  const values = {
    email: user.email,
    codeHash: hashFor(user.id, user.email, code),
    expiresAt: new Date(Date.now() + 30 * 60_000),
    attempts: 0,
  };
  await db.insert(t.emailVerifications).values({ userId: user.id, ...values }).onConflictDoUpdate({ target: t.emailVerifications.userId, set: values });
  const sent = await sendMail({
    to: user.email,
    subject: `${APP_NAME}: check your email`,
    text: `Your code is ${code}\n\nType it in ${APP_NAME} to check this email. It works for 30 minutes.\nIf you did not ask for it, ignore this email.`,
  });
  if (!sent) await db.delete(t.emailVerifications).where(eq(t.emailVerifications.userId, user.id));
  return sent;
}

/** true = email is now verified. */
export async function confirmVerifyCode(user: Pick<User, "id" | "email">, code: string): Promise<boolean> {
  if (!user.email) return false;
  const db = await getDb();
  const row = (await db.select().from(t.emailVerifications).where(eq(t.emailVerifications.userId, user.id)))[0];
  if (!row || row.email !== user.email || row.expiresAt < new Date() || row.attempts >= 5) return false;
  if (!safeEqual(row.codeHash, hashFor(user.id, user.email, code))) {
    await db.update(t.emailVerifications).set({ attempts: row.attempts + 1 }).where(eq(t.emailVerifications.userId, user.id));
    return false;
  }
  await db.update(t.users).set({ emailVerifiedAt: new Date() }).where(eq(t.users.id, user.id));
  await db.delete(t.emailVerifications).where(eq(t.emailVerifications.userId, user.id));
  return true;
}
