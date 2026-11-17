import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

const g = globalThis as unknown as { __db?: Promise<Db> };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Neon's free database sleeps when idle. The first request can fail or be slow.
// Try again a few times before giving up.
const retryFetch: typeof fetch = async (input, init) => {
  let last: unknown;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(input, init);
      if (res.status < 500 || i === 3) return res;
      last = new Error("db " + res.status);
    } catch (e) {
      last = e;
    }
    await sleep(500 * (i + 1));
  }
  throw last;
};

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    neonConfig.fetchFunction = retryFetch;
    return drizzle(neon(url), { schema });
  }
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is not set");
  // Local development and tests: a free Postgres that runs inside Node. Never used in production.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const fs = await import("node:fs");
  const path = await import("node:path");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (dir !== "memory") fs.mkdirSync(path.dirname(dir), { recursive: true }); // PGlite makes the last folder itself
  const client = dir === "memory" ? new PGlite() : new PGlite(dir);
  const sqlText = fs.readFileSync(path.join(process.cwd(), "lib", "db", "migrations", "0001_init.sql"), "utf8");
  await client.exec(sqlText);
  return drizzlePglite(client, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  g.__db ??= connect().catch((e) => {
    g.__db = undefined; // do not keep a failed connection
    throw e;
  });
  return g.__db;
}

export * as t from "./schema";
