import { z } from "zod";
import { email, ngPhone } from "@phonebook/shared";
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
  if (i.email !== undefined) set.email = i.email;
  if (i.recoveryPhone !== undefined) set.recoveryPhoneEnc = i.recoveryPhone ? encrypt(userKey(auth.user), i.recoveryPhone) : null;
  if (Object.keys(set).length) await db.update(t.users).set(set).where(eq(t.users.id, auth.user.id));
  return json({ ok: true });
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
