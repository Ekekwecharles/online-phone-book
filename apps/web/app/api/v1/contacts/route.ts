import { randomUUID } from "node:crypto";
import { CONTACTS_PAGE_SIZE, contactInput } from "@phonebook/shared";
import { json, route } from "@/lib/http";
import { applyChange, listContacts } from "@/lib/contacts";

export const GET = route({ auth: true }, async ({ req, auth }) => {
  const u = new URL(req.url);
  const offset = Math.max(0, Number(u.searchParams.get("cursor")) || 0);
  const limit = Math.min(500, Math.max(1, Number(u.searchParams.get("limit")) || CONTACTS_PAGE_SIZE));
  return json(await listContacts(auth.user, u.searchParams.get("q") ?? undefined, offset, limit));
});

/** Add a contact, or save changes to one (send its id). Newest change wins. */
export const POST = route({ auth: true }, async ({ auth, body }) => {
  const c = await body(contactInput);
  const id = c.id ?? randomUUID();
  const saved = await applyChange(auth.user, { id, name: c.name, phone: c.phone, updatedAt: Date.now() });
  return json({ ok: true, saved, id }, saved ? 200 : 409);
});
