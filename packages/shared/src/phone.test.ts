import { describe, expect, it } from "vitest";
import { normalizeNgPhone, normalizeAnyPhone, normalizeContactValue, isCallable, matchesQuery } from "./phone";

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

describe("normalizeContactValue", () => {
  it("cleans real phone numbers", () => expect(normalizeContactValue("0803 123 4567")).toBe("+2348031234567"));
  it("keeps short numbers and codes as typed", () => {
    expect(normalizeContactValue(" 09388 ")).toBe("09388");
    expect(normalizeContactValue("*901#")).toBe("*901#");
    expect(normalizeContactValue("22123456789")).toBe("22123456789");
  });
  it("rejects empty and very long values", () => {
    expect(normalizeContactValue("   ")).toBeNull();
    expect(normalizeContactValue("x".repeat(41))).toBeNull();
  });
  it("only real phone numbers can be called", () => {
    expect(isCallable("+2348031234567")).toBe(true);
    expect(isCallable("09388")).toBe(false);
    expect(isCallable("22123456789")).toBe(false);
  });
  it("search finds codes as typed", () => expect(matchesQuery("Test", "09388", "9388")).toBe(true));
});

describe("normalizeAnyPhone", () => {
  it("keeps foreign numbers", () => expect(normalizeAnyPhone("+1 415 555 0123")).toBe("+14155550123"));
  it("normalises Nigerian numbers", () => expect(normalizeAnyPhone("0803 123 4567")).toBe("+2348031234567"));
});
