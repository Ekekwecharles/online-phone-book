import { z } from "zod";
import { ApiError, json, route } from "@/lib/http";
import { confirmVerifyCode } from "@/lib/emailVerify";
import { hit } from "@/lib/ratelimit";

const input = z.object({ code: z.string().trim().regex(/^\d{6}$/, "The code has 6 numbers.") });

/** Check the 6-digit code from the email. */
export const POST = route({ auth: true }, async ({ auth, body }) => {
  const i = await body(input);
  if ((await hit(`econfirm:${auth.user.id}`, 3600)) > 20) throw new ApiError(429, "Too many tries. Please wait an hour and try again.");
  if (!(await confirmVerifyCode(auth.user, i.code))) throw new ApiError(400, "That code is not right, or it is too old. Ask for a new one.");
  return json({ ok: true });
});
