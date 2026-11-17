import { z } from "zod";
import { password } from "@phonebook/shared";
import { ApiError, json, route } from "@/lib/http";
import { setPassword } from "@/lib/accounts";
import { checkPassword } from "@/lib/password";
import { hit } from "@/lib/ratelimit";
import { createSession, sessionCookie } from "@/lib/session";

const input = z.object({ current: z.string().min(1).max(100), newPassword: password });

/** Change password. Every session ends, and this one gets a fresh start. */
export const POST = route({ auth: true }, async ({ auth, body }) => {
  const i = await body(input);
  if ((await hit(`pw:${auth.user.id}`, 900)) > 8) throw new ApiError(429, "Too many tries. Please wait 15 minutes.");
  if (!(await checkPassword(auth.user.passwordHash, i.current))) throw new ApiError(401, "Your old password is not right.");
  await setPassword(auth.user.id, i.newPassword);
  const token = await createSession(auth.user.id, auth.kind);
  return json({ ok: true, token: auth.kind === "mobile" ? token : undefined }, 200, auth.kind === "web" ? { "set-cookie": sessionCookie(token) } : {});
});
