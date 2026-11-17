import { recoveryEmailConfirm } from "@phonebook/shared";
import { eq } from "drizzle-orm";
import { ApiError, clientIp, json, route } from "@/lib/http";
import { findUser, issueRecoveryCode, setPassword } from "@/lib/accounts";
import { safeEqual, sha256 } from "@/lib/crypto";
import { getDb, t } from "@/lib/db";
import { hit } from "@/lib/ratelimit";
import { recordLogin } from "@/lib/notices";

const FAIL = "That code is not right, or it is too old. Ask for a new one.";

export const POST = route({ auth: false }, async ({ req, body }) => {
  const i = await body(recoveryEmailConfirm);
  if ((await hit(`recconf:${clientIp(req)}`, 3600)) > 20) throw new ApiError(429, "Too many tries. Please wait an hour and try again.");
  const user = await findUser(i.identifier);
  if (!user) throw new ApiError(400, FAIL);
  const db = await getDb();
  const row = (await db.select().from(t.emailCodes).where(eq(t.emailCodes.userId, user.id)))[0];
  if (!row || row.expiresAt < new Date() || row.attempts >= 5) throw new ApiError(400, FAIL);
  if (!safeEqual(row.codeHash, sha256(`${user.id}:${i.code}`))) {
    await db.update(t.emailCodes).set({ attempts: row.attempts + 1 }).where(eq(t.emailCodes.userId, user.id));
    throw new ApiError(400, FAIL);
  }
  await db.delete(t.emailCodes).where(eq(t.emailCodes.userId, user.id)); // one use only
  await setPassword(user.id, i.newPassword);
  const newCode = await issueRecoveryCode(user.id);
  await recordLogin({ user, kind: "recovery", req });
  return json({ ok: true, recoveryCode: newCode });
});
