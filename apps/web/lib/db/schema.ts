import { bigint, boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// Keep this file in step with the files in migrations/.

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  phoneIdx: text("phone_idx").unique(), // HMAC of the login phone number
  phoneEnc: text("phone_enc"),
  passwordHash: text("password_hash").notNull(),
  wrappedKey: text("wrapped_key").notNull(), // this user's data key, locked with MASTER_KEY
  email: text("email"), // used for login notices and recovery codes, but only once verified
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  recoveryPhoneEnc: text("recovery_phone_enc"), // stored for later; no SMS yet
  recoveryCodeHash: text("recovery_code_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    nameEnc: text("name_enc").notNull(),
    phoneEnc: text("phone_enc").notNull(),
    phoneIdx: text("phone_idx").notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(), // when the user changed it (ms). Newest wins.
    syncedAt: bigint("synced_at", { mode: "number" }).notNull(), // when the server saved it (ms). Used to pull changes.
    deleted: boolean("deleted").notNull().default(false),
  },
  (t) => [index("contacts_user_synced").on(t.userId, t.syncedAt)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256 of the token
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // 'web' | 'mobile'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user").on(t.userId)],
);

export const loginEvents = pgTable(
  "login_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    kind: text("kind").notNull(), // 'web' | 'mobile' | 'recovery'
    deviceType: text("device_type").notNull(),
    deviceId: text("device_id"),
    place: text("place").notNull(),
    emailed: boolean("emailed").notNull().default(false),
    wasntMeHash: text("wasnt_me_hash"),
  },
  (t) => [index("login_events_user_at").on(t.userId, t.at)],
);

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    platform: text("platform").notNull(),
  },
  (t) => [uniqueIndex("push_tokens_token").on(t.token)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export const emailVerifications = pgTable("email_verifications", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
});

export const emailCodes =pgTable("email_codes", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
});
