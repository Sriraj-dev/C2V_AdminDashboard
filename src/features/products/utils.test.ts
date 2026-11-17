import { describe, expect, it } from "vitest";
import type { Product } from "@/lib/api/types";
import { productChanges } from "./utils";

const product: Product = {
  id: "1",
  sku: "EGG6",
  name: "Eggs",
  pricePaise: 1250,
  active: true,
  sortOrder: 2,
  createdAt: "2026-11-01T00:00:00.000Z",
};
const same = { sku: "egg6", name: " Eggs ", price: "12.5", sortOrder: "2", active: true };

describe("productChanges", () => {
  it("is empty when nothing really changed", () => {
    expect(productChanges(product, same)).toEqual({});
  });
  it("returns only changed fields", () => {
    expect(productChanges(product, { ...same, price: "13", active: false })).toEqual({
      price: "13",
      active: false,
    });
  });
  it("treats a blank sort order as unchanged", () => {
    expect(productChanges(product, { ...same, sortOrder: "" })).toEqual({});
  });
});
