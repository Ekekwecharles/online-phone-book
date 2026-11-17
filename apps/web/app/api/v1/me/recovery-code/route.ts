import { z } from "zod";
import { ApiError, json, route } from "@/lib/http";
import { issueRecoveryCode } from "@/lib/accounts";
import { checkPassword } from "@/lib/password";
import { hit } from "@/lib/ratelimit";

/** Make a new recovery code. The old one stops working. Shown once. */
export const POST = route({ auth: true }, async ({ auth, body }) => {
  const i = await body(z.object({ password: z.string().min(1).max(100) }));
  if ((await hit(`pw:${auth.user.id}`, 900)) > 8) throw new ApiError(429, "Too many tries. Please wait 15 minutes.");
  if (!(await checkPassword(auth.user.passwordHash, i.password))) throw new ApiError(401, "That password is not right.");
  return json({ recoveryCode: await issueRecoveryCode(auth.user.id) });
});
