import { desc, eq } from "drizzle-orm";
import { json, route } from "@/lib/http";
import { getDb, t } from "@/lib/db";

export const GET = route({ auth: true }, async ({ auth }) => {
  const db = await getDb();
  const rows = await db
    .select({ id: t.loginEvents.id, at: t.loginEvents.at, kind: t.loginEvents.kind, deviceType: t.loginEvents.deviceType, place: t.loginEvents.place, emailed: t.loginEvents.emailed })
    .from(t.loginEvents)
    .where(eq(t.loginEvents.userId, auth.user.id))
    .orderBy(desc(t.loginEvents.at))
    .limit(50);
  return json({ logins: rows });
});
