import { recoveryStart } from "@phonebook/shared";
import { eq } from "drizzle-orm";
import { APP_NAME } from "@phonebook/shared";
import { ApiError, clientIp, json, route } from "@/lib/http";
import { findUser } from "@/lib/accounts";
import { sha256, sixDigitCode } from "@/lib/crypto";
import { getDb, t } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { hit } from "@/lib/ratelimit";
import { verifiedEmail } from "@/lib/emailVerify";

// Same answer whether or not the account or email exists.
const SAME = { ok: true, message: "If this account has a checked email, we sent a code to it. It works for 15 minutes." };

export const POST = route({ auth: false }, async ({ req, body }) => {
  const i = await body(recoveryStart);
  const who = i.identifier.trim().toLowerCase();
  if ((await hit(`recmail:${clientIp(req)}`, 3600)) > 10 || (await hit(`recmail:acct:${who}`, 3600)) > 3) {
    throw new ApiError(429, "Too many tries. Please wait an hour and try again.");
  }
  const user = await findUser(i.identifier);
  const to = user ? verifiedEmail(user) : null; // only a verified email can recover an account
  if (user && to) {
    const code = sixDigitCode();
    const db = await getDb();
    const values = { codeHash: sha256(`${user.id}:${code}`), expiresAt: new Date(Date.now() + 15 * 60_000), attempts: 0 };
    await db.insert(t.emailCodes).values({ userId: user.id, ...values }).onConflictDoUpdate({ target: t.emailCodes.userId, set: values });
    const sent = await sendMail({
      to,
      subject: `${APP_NAME}: your code`,
      text: `Your code is ${code}\n\nIt works for 15 minutes.\nIf you did not ask for it, ignore this email. Your account is safe.`,
    });
    if (!sent) await db.delete(t.emailCodes).where(eq(t.emailCodes.userId, user.id));
  }
  return json(SAME);
});
