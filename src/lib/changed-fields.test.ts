import { describe, expect, it } from "vitest";
import { changedFields } from "./changed-fields";

describe("changedFields", () => {
  it("returns only differing keys", () => {
    expect(changedFields({ a: 1, b: "x", c: true }, { a: 1, b: "y", c: false })).toEqual({ b: "y", c: false });
  });
  it("returns an empty object when nothing changed", () => {
    expect(changedFields({ a: 1 }, { a: 1 })).toEqual({});
  });
});
