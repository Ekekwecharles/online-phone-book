import { sql } from "drizzle-orm";
import { getDb, t } from "./db";

/**
 * Count one try for `key`. Returns how many tries have been used in the window.
 * The window restarts by itself once it is over. Works in one database call.
 */
export async function hit(key: string, windowSec: number): Promise<number> {
  const db = await getDb();
  const rows = await db
    .insert(t.rateLimits)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: t.rateLimits.key,
      set: {
        count: sql`CASE WHEN ${t.rateLimits.windowStart} < now() - (${windowSec} * interval '1 second') THEN 1 ELSE ${t.rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${t.rateLimits.windowStart} < now() - (${windowSec} * interval '1 second') THEN now() ELSE ${t.rateLimits.windowStart} END`,
      },
    })
    .returning({ count: t.rateLimits.count });
  return rows[0].count;
}

/** How many tries so far, without counting a new one. */
export async function peek(key: string, windowSec: number): Promise<number> {
  const db = await getDb();
  const r = await db.execute(
    sql`SELECT count FROM rate_limits WHERE key = ${key} AND window_start > now() - (${windowSec} * interval '1 second')`,
  );
  const row = (r as unknown as { rows: { count: number }[] }).rows[0];
  return row?.count ?? 0;
}

export async function clear(key: string): Promise<void> {
  const db = await getDb();
  await db.delete(t.rateLimits).where(sql`${t.rateLimits.key} = ${key}`);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
