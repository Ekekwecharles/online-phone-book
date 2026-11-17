import { describe, expect, it } from "vitest";
import { normalizeNgPhone, normalizeAnyPhone } from "./phone";

describe("normalizeNgPhone", () => {
  it.each([
    ["08031234567", "+2348031234567"],
    ["+2348031234567", "+2348031234567"],
    ["2348031234567", "+2348031234567"],
    ["8031234567", "+2348031234567"],
    ["0803 123 4567", "+2348031234567"],
    ["0803-123-4567", "+2348031234567"],
    ["+234 (0) 803 123 4567", "+2348031234567"],
    ["002348031234567", "+2348031234567"],
  ])("%s -> %s", (i, o) => expect(normalizeNgPhone(i)).toBe(o));

  it.each(["", "abc", "0803123", "+14155550123", "05031234567890"])("rejects %s", (i) =>
    expect(normalizeNgPhone(i)).toBeNull(),
  );
});

describe("normalizeAnyPhone", () => {
  it("keeps foreign numbers", () => expect(normalizeAnyPhone("+1 415 555 0123")).toBe("+14155550123"));
  it("normalises Nigerian numbers", () => expect(normalizeAnyPhone("0803 123 4567")).toBe("+2348031234567"));
});
