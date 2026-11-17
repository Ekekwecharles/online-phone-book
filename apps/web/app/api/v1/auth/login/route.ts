import { loginInput } from "@phonebook/shared";
import { ApiError, clientIp, json, route } from "@/lib/http";
import { findUser, startSession } from "@/lib/accounts";
import { checkPassword, fakeCheck } from "@/lib/password";
import { clear, hit, sleep } from "@/lib/ratelimit";
import { recordLogin } from "@/lib/notices";

const TOO_MANY = "Too many tries. Please wait 15 minutes and try again.";

export const POST = route({ auth: false }, async ({ req, body }) => {
  const i = await body(loginInput);
  const ip = clientIp(req);
  const who = i.identifier.trim().toLowerCase();
  const key = `login:${who}:${ip}`;

  // Too many wrong tries from one place, or against one account in an hour.
  const tries = await hit(key, 900);
  const acct = await hit(`login:acct:${who}`, 3600);
  if (tries > 8 || acct > 40) throw new ApiError(429, TOO_MANY);
  if (tries > 3) await sleep(Math.min((tries - 3) * 400, 2000)); // slow down

  const user = await findUser(i.identifier);
  const ok = user ? await checkPassword(user.passwordHash, i.password) : (await fakeCheck(i.password), false);
  if (!user || !ok) throw new ApiError(401, "Wrong username, phone number or password.");

  await clear(key);
  const s = await startSession(user.id, i.client);
  await recordLogin({ user, kind: i.client, req, deviceId: i.deviceId });
  return json({ ok: true, token: s.token }, 200, s.cookie ? { "set-cookie": s.cookie } : {});
});
