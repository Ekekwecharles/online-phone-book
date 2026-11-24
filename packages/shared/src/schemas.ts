import { z } from "zod";
import { looksLikePhone, normalizeNgPhone, normalizeContactValue } from "./phone";

// Simple, plain-English messages.
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use at least 3 letters or numbers.")
  .max(30, "Use 30 letters or numbers at most.")
  .regex(/^[a-z][a-z0-9_]*$/, "Start with a letter. Use only letters, numbers and _.");

export const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(100, "That password is too long.");

export const ngPhone = z
  .string()
  .transform((v, ctx) => {
    const n = normalizeNgPhone(v);
    if (!n) ctx.addIssue({ code: "custom", message: "That phone number does not look right." });
    return n ?? "";
  });

export const email = z.string().trim().toLowerCase().email("That email does not look right.").max(200);

/** Log in with a username OR a phone number. */
export const identifier = z.string().trim().min(1, "Type your username or phone number.").max(60);

export function parseIdentifier(raw: string): { kind: "phone" | "username"; value: string } | null {
  const t = raw.trim();
  if (looksLikePhone(t)) {
    const p = normalizeNgPhone(t);
    return p ? { kind: "phone", value: p } : null;
  }
  const u = username.safeParse(t);
  return u.success ? { kind: "username", value: u.data } : null;
}

export const signupInput = z.object({
  username,
  phone: ngPhone.optional().or(z.literal("").transform(() => undefined)),
  password,
  email: email.optional().or(z.literal("").transform(() => undefined)),
  client: z.enum(["web", "mobile"]).default("web"),
  deviceId: z.string().max(100).optional(),
});

export const loginInput = z.object({
  identifier,
  password: z.string().min(1, "Type your password.").max(100),
  client: z.enum(["web", "mobile"]).default("web"),
  deviceId: z.string().max(100).optional(),
});

export const contactInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Type a name.").max(100),
  phone: z
    .string()
    .trim()
    .max(40)
    .transform((v, ctx) => {
      const n = normalizeContactValue(v);
      if (!n) ctx.addIssue({ code: "custom", message: "Type a number." });
      return n ?? "";
    }),
});

export const syncInput = z.object({
  /** Client time of the last successful sync (ms). 0 = first sync. */
  since: z.number().int().min(0).default(0),
  /** Changes made on the phone. Last write wins by `updatedAt`. */
  changes: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(100).optional(),
        phone: z.string().trim().max(40).optional(),
        deleted: z.boolean().optional(),
        updatedAt: z.number().int().min(0),
      }),
    )
    .max(500),
});

export const recoveryStart = z.object({ identifier });
export const recoveryWithCode = z.object({
  identifier,
  code: z.string().trim().min(8).max(40),
  newPassword: password,
});
export const recoveryEmailConfirm = z.object({
  identifier,
  code: z.string().trim().length(6),
  newPassword: password,
});
