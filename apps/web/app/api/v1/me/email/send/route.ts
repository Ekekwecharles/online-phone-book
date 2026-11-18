import { ApiError, json, route } from "@/lib/http";
import { sendVerifyCode } from "@/lib/emailVerify";
import { hit } from "@/lib/ratelimit";

/** Send the 6-digit code again. */
export const POST = route({ auth: true }, async ({ auth }) => {
  if (!auth.user.email) throw new ApiError(400, "Please save an email first.");
  if (auth.user.emailVerifiedAt) return json({ ok: true, alreadyChecked: true });
  if ((await hit(`everify:${auth.user.id}`, 3600)) > 5) throw new ApiError(429, "Too many tries. Please wait an hour and try again.");
  const sent = await sendVerifyCode(auth.user);
  if (!sent) throw new ApiError(503, "We could not send the email now. Please try again later.");
  return json({ ok: true });
});
