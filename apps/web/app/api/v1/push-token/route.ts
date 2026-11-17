import { z } from "zod";
import { json, route } from "@/lib/http";
import { getDb, t } from "@/lib/db";

const input = z.object({ token: z.string().min(10).max(200), platform: z.enum(["android", "ios"]) });

export const POST = route({ auth: true }, async ({ auth, body }) => {
  const i = await body(input);
  const db = await getDb();
  await db
    .insert(t.pushTokens)
    .values({ userId: auth.user.id, ...i })
    .onConflictDoUpdate({ target: t.pushTokens.token, set: { userId: auth.user.id, platform: i.platform } });
  return json({ ok: true });
});
