import { and, desc, eq, gt } from "drizzle-orm";
import { APP_NAME, NOTICE_EMAIL_COOLDOWN_MINUTES } from "@phonebook/shared";
import { getDb, t } from "./db";
import { randomToken, sha256 } from "./crypto";
import { sendMail } from "./mailer";
import { deviceType, roughPlace } from "./http";
import type { User } from "./session";

export type LoginKind = "web" | "mobile" | "recovery";

/**
 * Rule for login emails (kept small because free email has a daily limit):
 *  - Web logins and recovery: always email. A browser could be on a borrowed computer,
 *    so we never treat a web browser as "trusted".
 *  - Phone app: email only for a new phone, or a new place. The same phone in the same place is trusted.
 *  - At most one email every few minutes per account (recovery is always sent).
 * "Recent logins" and push notices always show every login, with or without an email.
 */
export function shouldEmail(a: {
  kind: LoginKind;
  hasEmail: boolean;
  deviceSeenBefore: boolean;
  placeSeenBefore: boolean;
  emailedRecently: boolean;
}): boolean {
  if (!a.hasEmail) return false;
  if (a.kind === "recovery") return true;
  if (a.emailedRecently) return false;
  if (a.kind === "web") return true;
  return !a.deviceSeenBefore || !a.placeSeenBefore;
}

export async function recordLogin(opts: { user: User; kind: LoginKind; req: Request; deviceId?: string; silent?: boolean }) {
  const { user, kind, req, deviceId } = opts;
  const db = await getDb();
  const ua = req.headers.get("user-agent") ?? "";
  const place = roughPlace(req);
  const dtype = deviceType(ua);

  const past = await db
    .select({ deviceId: t.loginEvents.deviceId, place: t.loginEvents.place, emailed: t.loginEvents.emailed, at: t.loginEvents.at })
    .from(t.loginEvents)
    .where(and(eq(t.loginEvents.userId, user.id), eq(t.loginEvents.kind, "mobile")))
    .orderBy(desc(t.loginEvents.at))
    .limit(50);
  const recent = await db
    .select({ id: t.loginEvents.id })
    .from(t.loginEvents)
    .where(
      and(
        eq(t.loginEvents.userId, user.id),
        eq(t.loginEvents.emailed, true),
        gt(t.loginEvents.at, new Date(Date.now() - NOTICE_EMAIL_COOLDOWN_MINUTES * 60_000)),
      ),
    )
    .limit(1);

  const email = !opts.silent && shouldEmail({
    kind,
    hasEmail: !!user.email,
    deviceSeenBefore: !!deviceId && past.some((p) => p.deviceId === deviceId),
    placeSeenBefore: past.some((p) => p.place === place),
    emailedRecently: recent.length > 0,
  });

  const wasntMe = randomToken(24);
  await db.insert(t.loginEvents).values({
    userId: user.id,
    kind,
    deviceType: dtype,
    deviceId: deviceId ?? null,
    place,
    emailed: email,
    wasntMeHash: sha256(wasntMe),
  });

  if (email && user.email) {
    const base = process.env.APP_URL ?? "";
    const what = kind === "recovery" ? "Your password was reset." : "Someone logged into your account.";
    const sent = await sendMail({
      to: user.email,
      subject: `${APP_NAME}: new login`,
      text: [
        what,
        "",
        `When: ${new Date().toUTCString()}`,
        `Device: ${dtype}`,
        `Place: ${place} (this is a rough guess)`,
        "",
        "If this was you, you do not need to do anything.",
        "",
        "If this was NOT you, tap this link now. It logs out every phone and browser, and asks for a new password:",
        `${base}/wasnt-me?t=${wasntMe}`,
      ].join("\n"),
    });
    if (!sent) await db.update(t.loginEvents).set({ emailed: false }).where(eq(t.loginEvents.wasntMeHash, sha256(wasntMe)));
  }

  if (!opts.silent) await pushNotice(user.id, `New login on your ${APP_NAME} account`, `${dtype}, ${place}`);
}

/** Expo push (free). Failures are ignored on purpose. */
export async function pushNotice(userId: string, title: string, body: string) {
  try {
    const db = await getDb();
    const tokens = await db.select({ token: t.pushTokens.token }).from(t.pushTokens).where(eq(t.pushTokens.userId, userId));
    if (!tokens.length) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(tokens.map((x) => ({ to: x.token, title, body }))),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
}
