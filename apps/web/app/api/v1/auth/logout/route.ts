import { json, route } from "@/lib/http";
import { clearCookie, deleteSession } from "@/lib/session";

export const POST = route({ auth: true }, async ({ auth }) => {
  await deleteSession(auth.sessionId);
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
});
