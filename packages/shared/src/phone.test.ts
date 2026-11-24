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

describe("foreign numbers", () => {
  it.each([
    ["+1 (415) 555-0123", "+14155550123"],
    ["+49 151 23456789", "+4915123456789"],
    ["0049 151 23456789", "+4915123456789"],
    ["+44 7911 123456", "+447911123456"],
  ])("%s -> %s", (i, o) => {
    expect(normalizeContactValue(i)).toBe(o);
    expect(normalizeContactValue(i, true)).toBe(o); // also kept on the Free plan
    expect(isCallable(o)).toBe(true);
  });
});

describe("Free plan limits (when LIMITS_ON is true)", () => {
  it("keeps real numbers and drops codes and random numbers", () => {
    expect(normalizeContactValue("0803 123 4567", true)).toBe("+2348031234567");
    expect(normalizeContactValue("09388", true)).toBeNull();
    expect(normalizeContactValue("22123456789", true)).toBeNull();
    expect(normalizeContactValue("*901#", true)).toBeNull();
  });
});

describe("normalizeAnyPhone", () => {
  it("keeps foreign numbers", () => expect(normalizeAnyPhone("+1 415 555 0123")).toBe("+14155550123"));
  it("normalises Nigerian numbers", () => expect(normalizeAnyPhone("0803 123 4567")).toBe("+2348031234567"));
});
