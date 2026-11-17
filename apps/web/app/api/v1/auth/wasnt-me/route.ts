import { z } from "zod";
import { password } from "@phonebook/shared";
import { eq } from "drizzle-orm";
import { ApiError, clientIp, json, route } from "@/lib/http";
import { setPassword } from "@/lib/accounts";
import { sha256 } from "@/lib/crypto";
import { getDb, t } from "@/lib/db";
import { hit } from "@/lib/ratelimit";

const input = z.object({ token: z.string().min(10).max(100), newPassword: password });

// The "This wasn't me" link in login emails. Logs out everything and sets a new password.
export const POST = route({ auth: false }, async ({ req, body }) => {
  if ((await hit(`wasntme:${clientIp(req)}`, 3600)) > 10) throw new ApiError(429, "Too many tries. Please wait an hour and try again.");
  const i = await body(input);
  const db = await getDb();
  const ev = (await db.select().from(t.loginEvents).where(eq(t.loginEvents.wasntMeHash, sha256(i.token))))[0];
  if (!ev || Date.now() - ev.at.getTime() > 7 * 24 * 3600_000) throw new ApiError(400, "This link is too old or not right. Use \"Forgot password\" instead.");
  await setPassword(ev.userId, i.newPassword);
  return json({ ok: true });
});
