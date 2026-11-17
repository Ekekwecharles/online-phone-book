/**
 * Nigerian phone numbers. Canonical form: "+234" + 10 digits, e.g. +2348031234567.
 * Accepts 0803..., 803..., 234803..., +234803..., with spaces, dashes, brackets.
 * Returns null when the text is not a Nigerian mobile/landline number.
 */
export function normalizeNgPhone(input: string): string | null {
  if (typeof input !== "string") return null;
  let s = input.trim().replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  let national: string;
  if (s.startsWith("+234")) national = s.slice(4);
  else if (s.startsWith("234")) national = s.slice(3);
  else if (s.startsWith("0")) national = s.slice(1);
  else national = s;
  // Some people write +234 (0)803...
  if (national.startsWith("0")) national = national.slice(1);
  if (!/^\d{10}$/.test(national)) return null;
  if (!/^[789]/.test(national)) return null;
  return "+234" + national;
}

/** Does this text look like a phone number (so login/search can treat it as one)? */
export function looksLikePhone(input: string): boolean {
  return /^[+\d][\d\s\-().+]{6,}$/.test(input.trim());
}

/** For contacts: keep any number, even a foreign one, as clean digits. */
export function normalizeAnyPhone(input: string): string | null {
  const ng = normalizeNgPhone(input);
  if (ng) return ng;
  const s = input.trim().replace(/[\s\-().]/g, "");
  if (/^\+\d{7,15}$/.test(s)) return s;
  return null;
}
