import { z } from "zod";
import { APP_NAME, email, ngPhone } from "@phonebook/shared";
import { sendVerifyCode, verifiedEmail } from "@/lib/emailVerify";
import { sendMail } from "@/lib/mailer";
import { eq } from "drizzle-orm";
import { ApiError, json, route } from "@/lib/http";
import { publicUser, userKey } from "@/lib/accounts";
import { checkPassword } from "@/lib/password";
import { encrypt } from "@/lib/crypto";
import { getDb, t } from "@/lib/db";
import { deleteAccount } from "@/lib/contacts";
import { clearCookie } from "@/lib/session";
import { hit } from "@/lib/ratelimit";

export const GET = route({ auth: true }, async ({ auth }) => json(publicUser(auth.user)));

const patch = z.object({
  email: email.nullable().optional().or(z.literal("").transform(() => null)),
  recoveryPhone: ngPhone.nullable().optional().or(z.literal("").transform(() => null)),
});

/** Add, change or remove the recovery email and the second phone number. */
export const PATCH = route({ auth: true }, async ({ auth, body }) => {
  const i = await body(patch);
  const db = await getDb();
  const set: Partial<typeof t.users.$inferInsert> = {};
  let sendTo: string | null = null;
  if (i.email !== undefined && i.email !== auth.user.email) {
    set.email = i.email;
    set.emailVerifiedAt = null; // a new email must be checked again
    await db.delete(t.emailVerifications).where(eq(t.emailVerifications.userId, auth.user.id));
    sendTo = i.email;
    const old = verifiedEmail(auth.user);
    if (old) {
      await sendMail({
        to: old,
        subject: `${APP_NAME}: your email was changed`,
        text: `The email on your ${APP_NAME} account was changed.\n\nIf this was you, you do not need to do anything.\nIf it was NOT you, log in and change your password now, then use "Log out everywhere" in Settings.`,
      });
    }
  }
  if (i.recoveryPhone !== undefined) set.recoveryPhoneEnc = i.recoveryPhone ? encrypt(userKey(auth.user), i.recoveryPhone) : null;
  if (Object.keys(set).length) await db.update(t.users).set(set).where(eq(t.users.id, auth.user.id));
  let codeSent: boolean | undefined;
  if (sendTo) {
    if ((await hit(`everify:${auth.user.id}`, 3600)) > 5) throw new ApiError(429, "Too many tries. Please wait an hour and try again.");
    codeSent = await sendVerifyCode({ id: auth.user.id, email: sendTo });
  }
  return json({ ok: true, codeSent });
});

const sure = z.object({ password: z.string().min(1).max(100) });

/** Delete the account and every contact. Needs the password. */
export const DELETE = route({ auth: true }, async ({ auth, body }) => {
  const i = await body(sure);
  if ((await hit(`pw:${auth.user.id}`, 900)) > 8) throw new ApiError(429, "Too many tries. Please wait 15 minutes.");
  if (!(await checkPassword(auth.user.passwordHash, i.password))) throw new ApiError(401, "That password is not right.");
  await deleteAccount(auth.user.id);
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
});
