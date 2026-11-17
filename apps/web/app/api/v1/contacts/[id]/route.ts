import { z } from "zod";
import { json, route } from "@/lib/http";
import { applyChange } from "@/lib/contacts";

export const DELETE = route({ auth: true }, async ({ req, auth }) => {
  const id = z.string().uuid().parse(new URL(req.url).pathname.split("/").pop());
  await applyChange(auth.user, { id, deleted: true, updatedAt: Date.now() });
  return json({ ok: true });
});
