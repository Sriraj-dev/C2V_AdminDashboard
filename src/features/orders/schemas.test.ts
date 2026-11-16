import { describe, expect, it } from "vitest";
import { activeFiltersSchema, historyParamsSchema } from "./schemas";

describe("historyParamsSchema", () => {
  it("drops unknown statuses", () =>
    expect(historyParamsSchema.parse({ status: "confirmed,bogus" }).status).toEqual(["confirmed"]));
  it("bad page becomes 1", () => expect(historyParamsSchema.parse({ page: "0" }).page).toBe(1));
  it("default page", () => expect(historyParamsSchema.parse({}).page).toBe(1));
  it("bad pincode dropped", () => expect(historyParamsSchema.parse({ pincode: "12" }).pincode).toBeUndefined());
  it("ignores unknown keys", () => expect(historyParamsSchema.parse({ view: "history", q: "x" }).q).toBe("x"));
  it("includeUnpaid", () => {
    expect(historyParamsSchema.parse({ includeUnpaid: "1" }).includeUnpaid).toBe(true);
    expect(historyParamsSchema.parse({ includeUnpaid: "0" }).includeUnpaid).toBe(false);
  });
  it("bad dates dropped, arrays take no value", () => {
    const r = historyParamsSchema.parse({ deliveryFrom: "nope", q: ["a", "b"] });
    expect(r.deliveryFrom).toBeUndefined();
    expect(r.q).toBeUndefined();
  });
});

describe("activeFiltersSchema", () => {
  it("keeps valid values", () => {
    expect(activeFiltersSchema.parse({ date: "2026-11-20", pincode: "560001", partnerId: "unassigned", q: "a" })).toEqual({
      date: "2026-11-20",
      pincode: "560001",
      partnerId: "unassigned",
      q: "a",
    });
  });
  it("drops invalid values", () => {
    expect(activeFiltersSchema.parse({ date: "x", pincode: "1", partnerId: "nope", q: "a".repeat(101) })).toEqual({});
  });
});
