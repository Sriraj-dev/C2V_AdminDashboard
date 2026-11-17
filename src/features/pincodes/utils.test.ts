import { describe, expect, it } from "vitest";
import type { Pincode } from "@/lib/api/types";
import { pincodeChanges } from "./utils";

const saved: Pincode = {
  id: "1",
  pincode: "560034",
  deliveryWeekday: 3,
  note: null,
  active: true,
  createdAt: "2026-11-01T00:00:00.000Z",
};

describe("pincodeChanges", () => {
  it("is empty when only whitespace differs", () => {
    expect(pincodeChanges(saved, { deliveryWeekday: 3, note: "  ", active: true })).toEqual({});
  });
  it("ignores the pincode in full form values", () => {
    const full = { pincode: "560034", deliveryWeekday: 3, note: "", active: true };
    expect(pincodeChanges(saved, full)).toEqual({});
    const changed = pincodeChanges(saved, { ...full, deliveryWeekday: 5 });
    expect(changed).toEqual({ deliveryWeekday: 5 });
    expect(changed).not.toHaveProperty("pincode");
  });
  it("returns the changed fields only", () => {
    expect(pincodeChanges(saved, { deliveryWeekday: 5, note: "Koramangala", active: true })).toEqual({
      deliveryWeekday: 5,
      note: "Koramangala",
    });
  });
});
