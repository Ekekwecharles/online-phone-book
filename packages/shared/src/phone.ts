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

/** Show +2348031234567 as 0803 123 4567. Other numbers are shown as they are. */
export function formatPhone(p: string): string {
  const m = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(p);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : p;
}

/** Does a contact match what the user typed? Name, or any part of the number (0803... or +234803... both work). */
export function matchesQuery(name: string, phone: string, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (name.toLowerCase().includes(needle)) return true;
  let digits = needle.replace(/\D/g, "");
  if (digits.length < 3) return false;
  if (digits.startsWith("234")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.length >= 2 && phone.replace(/\D/g, "").includes(digits);
}

/** For contacts: keep any number, even a foreign one, as clean digits. */
export function normalizeAnyPhone(input: string): string | null {
  const ng = normalizeNgPhone(input);
  if (ng) return ng;
  const s = input.trim().replace(/[\s\-().]/g, "");
  if (/^\+\d{7,15}$/.test(s)) return s;
  return null;
}
