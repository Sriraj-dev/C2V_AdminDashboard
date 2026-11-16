import { describe, expect, it } from "vitest";
import type { PartnerOrderView } from "@/lib/api/types";
import { groupByDate, TOKEN_RE } from "./utils";

const o = (id: string, deliveryDate: string) => ({ id, deliveryDate }) as PartnerOrderView;

describe("TOKEN_RE", () => {
  it("accepts 43 url-safe chars only", () => {
    expect(TOKEN_RE.test("a".repeat(43))).toBe(true);
    expect(TOKEN_RE.test("A-_".repeat(14) + "a")).toBe(true);
    expect(TOKEN_RE.test("a".repeat(42))).toBe(false);
    expect(TOKEN_RE.test("a".repeat(44))).toBe(false);
    expect(TOKEN_RE.test("a".repeat(42) + "/")).toBe(false);
  });
});

describe("groupByDate", () => {
  it("groups by date, ascending, flagging dates before today as overdue", () => {
    const g = groupByDate([o("1", "2026-11-18"), o("2", "2026-11-14"), o("3", "2026-11-18"), o("4", "2026-11-16")], "2026-11-16");
    expect(g.map((x) => [x.date, x.overdue, x.orders.length])).toEqual([
      ["2026-11-14", true, 1],
      ["2026-11-16", false, 1],
      ["2026-11-18", false, 2],
    ]);
  });
});
