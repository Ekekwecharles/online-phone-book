import { recoveryWithCode } from "@phonebook/shared";
import { ApiError, clientIp, json, route } from "@/lib/http";
import { findUser, hashRecoveryCode, issueRecoveryCode, setPassword } from "@/lib/accounts";
import { safeEqual } from "@/lib/crypto";
import { hit } from "@/lib/ratelimit";
import { recordLogin } from "@/lib/notices";

const FAIL = "That code is not right, or it was already used.";

export const POST = route({ auth: false }, async ({ req, body }) => {
  const i = await body(recoveryWithCode);
  const who = i.identifier.trim().toLowerCase();
  if ((await hit(`rec:${clientIp(req)}`, 3600)) > 20 || (await hit(`rec:acct:${who}`, 3600)) > 5) {
    throw new ApiError(429, "Too many tries. Please wait an hour and try again.");
  }
  const user = await findUser(i.identifier);
  const good = user ? safeEqual(user.recoveryCodeHash, hashRecoveryCode(i.code)) : false;
  if (!user || !good) throw new ApiError(400, FAIL);

  await setPassword(user.id, i.newPassword); // logs out every session
  const newCode = await issueRecoveryCode(user.id); // the old code is now used up
  await recordLogin({ user, kind: "recovery", req });
  return json({ ok: true, recoveryCode: newCode });
});
