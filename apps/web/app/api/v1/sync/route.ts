import { normalizeContactValue, syncInput } from "@phonebook/shared";
import { json, route } from "@/lib/http";
import { applyChange, changesSince } from "@/lib/contacts";

/**
 * Two-way sync for the phone app.
 * Phone sends what it changed. Server saves them (newest change wins, by updatedAt),
 * then sends back everything saved since the last sync.
 */
export const POST = route({ auth: true }, async ({ auth, body }) => {
  const i = await body(syncInput);
  const serverTime = Date.now();
  let rejected = 0;
  for (const c of i.changes) {
    const phone = c.phone === undefined ? undefined : normalizeContactValue(c.phone);
    if (c.phone !== undefined && !phone) {
      rejected++; // a bad number. Skip it, keep going.
      continue;
    }
    const saved = await applyChange(auth.user, { ...c, phone: phone ?? undefined }, serverTime);
    if (!saved) rejected++; // a newer copy is already online
  }
  const changes = await changesSince(auth.user, i.since);
  return json({ serverTime, changes, rejected });
});
