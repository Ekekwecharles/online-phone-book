import { json, route } from "@/lib/http";
import { clearCookie, deleteAllSessions } from "@/lib/session";

export const POST = route({ auth: true }, async ({ auth }) => {
  await deleteAllSessions(auth.user.id);
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
});
