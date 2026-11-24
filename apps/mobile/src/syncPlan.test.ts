import { describe, expect, it } from "vitest";
import { chunk, devicePhones, planSync, uuidFromHex, type DeviceContact, type SyncMap } from "./syncPlan";

const idFor = (p: string) => "id" + p;
const c = (deviceId: string, name: string, ...phones: string[]): DeviceContact => ({ deviceId, name, phones });
const run = (contacts: DeviceContact[], map: SyncMap = {}, now = 1000) => planSync({ contacts, map, idFor, now });

describe("planSync", () => {
  it("first sync sends everything with clean numbers", () => {
    const p = run([c("1", "Mama", "0803 123 4567"), c("2", "Chidi", "+234 809 999 8888")]);
    expect(p.changes.map((x) => x.phone)).toEqual(["+2348031234567", "+2348099998888"]);
    expect(p.changes.every((x) => !x.deleted)).toBe(true);
  });

  it("sends nothing when nothing changed", () => {
    const first = run([c("1", "Mama", "08031234567")]);
    const second = run([c("1", "Mama", "08031234567")], first.nextMap);
    expect(second.changes).toEqual([]);
  });

  it("sends only the contact that was renamed", () => {
    const first = run([c("1", "Mama", "08031234567"), c("2", "Chidi", "08099998888")]);
    const second = run([c("1", "Mummy", "08031234567"), c("2", "Chidi", "08099998888")], first.nextMap);
    expect(second.changes).toHaveLength(1);
    expect(second.changes[0]).toMatchObject({ name: "Mummy", phone: "+2348031234567" });
  });

  it("one contact with two numbers makes two online contacts", () => {
    const p = run([c("1", "Mama", "08031234567", "08099998888")]);
    expect(p.changes).toHaveLength(2);
  });

  it("the same number saved twice on the phone is sent once", () => {
    const p = run([c("1", "Mama", "08031234567"), c("2", "Mama work", "0803 123 4567")]);
    expect(p.changes).toHaveLength(1);
  });

  it("saves short numbers and codes as typed, because for now we keep everything", () => {
    const p = run([c("1", "Test", "09388"), c("2", "My BVN", "22123456789"), c("3", "Ok", "08031234567")]);
    expect(p.changes.map((x) => x.phone)).toEqual(["09388", "22123456789", "+2348031234567"]);
  });

  it("skips empty numbers and values longer than 40 characters", () => {
    const p = run([c("1", "Empty", "   "), c("2", "Long", "x".repeat(41)), c("3", "Ok", "08031234567")]);
    expect(p.changes).toHaveLength(1);
  });

  it("uses the number as the name when the name is empty", () => {
    expect(run([c("1", "  ", "08031234567")]).changes[0].name).toBe("+2348031234567");
  });

  it("deletes online what was deleted on the phone", () => {
    const first = run([c("1", "Mama", "08031234567"), c("2", "Chidi", "08099998888")]);
    const second = run([c("1", "Mama", "08031234567")], first.nextMap, 5000);
    expect(second.changes).toEqual([{ id: "id+2348099998888", deleted: true, updatedAt: 5000 }]);
    expect(second.suspicious).toBe(false);
  });

  it("changing a number deletes the old one and adds the new one", () => {
    const first = run([c("1", "Mama", "08031234567")]);
    const second = run([c("1", "Mama", "08011112222")], first.nextMap, 5000);
    expect(second.changes.filter((x) => x.deleted)).toHaveLength(1);
    expect(second.changes.filter((x) => !x.deleted)).toHaveLength(1);
  });

  it("does not delete the online copy when the phone shows no contacts", () => {
    const first = run([c("1", "Mama", "08031234567")]);
    const second = run([], first.nextMap);
    expect(second.changes).toEqual([]);
    expect(second.suspicious).toBe(true);
    expect(second.nextMap).toEqual(first.nextMap); // remembered, not forgotten
  });

  it("does not delete when most contacts vanish at once", () => {
    const many = Array.from({ length: 20 }, (_, i) => c(String(i), "P" + i, "0803000" + String(1000 + i)));
    const first = run(many);
    const second = run(many.slice(0, 5), first.nextMap);
    expect(second.suspicious).toBe(true);
    expect(second.changes.some((x) => x.deleted)).toBe(false);
  });

  it("still deletes a few contacts out of many", () => {
    const many = Array.from({ length: 20 }, (_, i) => c(String(i), "P" + i, "0803000" + String(1000 + i)));
    const first = run(many);
    const second = run(many.slice(0, 18), first.nextMap);
    expect(second.suspicious).toBe(false);
    expect(second.changes.filter((x) => x.deleted)).toHaveLength(2);
  });

  it("uses the phone's own change time when it is known, never a future time", () => {
    const a: DeviceContact = { ...c("1", "Mama", "08031234567"), updatedAt: 500 };
    const b: DeviceContact = { ...c("2", "Chidi", "08099998888"), updatedAt: 99999 };
    const p = run([a, b], {}, 1000);
    expect(p.changes.map((x) => x.updatedAt)).toEqual([500, 1000]);
  });
});

describe("helpers", () => {
  it("devicePhones lists clean unique numbers", () => {
    expect(devicePhones([c("1", "A", "08031234567", "+2348031234567", "x")])).toEqual(["+2348031234567", "x"]);
  });
  it("uuidFromHex makes a stable uuid-shaped id", () => {
    const a = uuidFromHex("a".repeat(64));
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuidFromHex("a".repeat(64))).toBe(a);
  });
  it("chunk splits lists", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
