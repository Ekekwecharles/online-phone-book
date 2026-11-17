import { signupInput } from "@phonebook/shared";
import { blindIndex } from "@/lib/crypto";
import { getDb, t } from "@/lib/db";
import { eq, or } from "drizzle-orm";
import { ApiError, clientIp, json, route } from "@/lib/http";
import { createUser, startSession } from "@/lib/accounts";
import { hit } from "@/lib/ratelimit";
import { recordLogin } from "@/lib/notices";

export const POST = route({ auth: false }, async ({ req, body }) => {
  if ((await hit(`signup:${clientIp(req)}`, 3600)) > 10) {
    throw new ApiError(429, "Too many tries. Please wait a while and try again.");
  }
  const i = await body(signupInput);
  const db = await getDb();
  const taken = await db
    .select({ id: t.users.id })
    .from(t.users)
    .where(i.phone ? or(eq(t.users.username, i.username), eq(t.users.phoneIdx, blindIndex(i.phone))) : eq(t.users.username, i.username))
    .limit(1);
  if (taken.length) throw new ApiError(409, "That username or phone number is already used.");

  const { user, recoveryCode } = await createUser(i);
  const s = await startSession(user.id, i.client);
  await recordLogin({ user, kind: i.client, req, deviceId: i.deviceId, silent: true });
  return json(
    { ok: true, token: s.token, recoveryCode, askForEmail: !user.email },
    201,
    s.cookie ? { "set-cookie": s.cookie } : {},
  );
});
