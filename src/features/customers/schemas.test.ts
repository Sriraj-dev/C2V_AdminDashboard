import { describe, expect, it } from "vitest";
import { customerParamsSchema } from "./schemas";

describe("customerParamsSchema", () => {
  it("defaults page to 1 and q to undefined", () => {
    expect(customerParamsSchema.parse({})).toEqual({ q: undefined, page: 1 });
  });
  it("keeps valid values", () => {
    expect(customerParamsSchema.parse({ q: "asha", page: "3" })).toEqual({ q: "asha", page: 3 });
  });
  it("drops over-long q and bad pages", () => {
    expect(customerParamsSchema.parse({ q: "x".repeat(101), page: "0" })).toEqual({ q: undefined, page: 1 });
    expect(customerParamsSchema.parse({ q: ["a"], page: "abc" })).toEqual({ q: undefined, page: 1 });
  });
  it("trims q and treats blank as none", () => {
    expect(customerParamsSchema.parse({ q: "  asha " }).q).toBe("asha");
    expect(customerParamsSchema.parse({ q: "   " }).q).toBeUndefined();
  });
});
