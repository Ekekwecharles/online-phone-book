import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function key(name: "MASTER_KEY" | "INDEX_KEY"): Buffer {
  const v = process.env[name];
  if (!v) throw new Error(name + " is not set");
  const b = Buffer.from(v, "base64");
  if (b.length !== 32) throw new Error(name + " must be 32 bytes (base64)");
  return b;
}

const b64 = (b: Buffer) => b.toString("base64url");

/** AES-256-GCM. Output: iv.tag.ciphertext (base64url). */
export function encrypt(k: Buffer, plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [b64(iv), b64(c.getAuthTag()), b64(ct)].join(".");
}

export function decrypt(k: Buffer, packed: string): string {
  const [iv, tag, ct] = packed.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", k, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

/** Make a new data key for a user. Returns the key and the locked copy to store. */
export function newUserKey(): { key: Buffer; wrapped: string } {
  const k = randomBytes(32);
  return { key: k, wrapped: encrypt(key("MASTER_KEY"), k.toString("base64")) };
}

export function unwrapUserKey(wrapped: string): Buffer {
  return Buffer.from(decrypt(key("MASTER_KEY"), wrapped), "base64");
}

/** One-way fingerprint so we can find a phone number without storing it in plain text. */
export function blindIndex(value: string): string {
  return createHmac("sha256", key("INDEX_KEY")).update(value).digest("hex");
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** Recovery code like ABCD-EFGH-JKLM-NPQR-STUV (100 bits). */
export function newRecoveryCode(): string {
  const bytes = randomBytes(20);
  let s = "";
  for (let i = 0; i < 20; i++) s += CODE_CHARS[bytes[i] % 32];
  return s.match(/.{4}/g)!.join("-");
}

export const normalizeRecoveryCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

export function sixDigitCode(): string {
  return String(randomBytes(4).readUInt32BE() % 1_000_000).padStart(6, "0");
}
