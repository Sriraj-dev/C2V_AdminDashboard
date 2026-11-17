import { describe, expect, it } from "vitest";
import { settingsChanges } from "./utils";

const saved = {
  supportPhone: "919876543210",
  welcomeImageUrl: null,
  deliveryFeePaise: 4000,
  minOrderPaise: 19950,
};
const same = { supportPhone: "98765 43210", welcomeImageUrl: "", deliveryFee: "40.00", minOrder: "199.5" };

describe("settingsChanges", () => {
  it("reports nothing when only formatting differs", () => {
    expect(settingsChanges(saved, same)).toEqual({});
  });
  it("reports only changed fields, including clearing the phone", () => {
    expect(settingsChanges(saved, { ...same, supportPhone: "", deliveryFee: "50" })).toEqual({
      supportPhone: "",
      deliveryFee: "50",
    });
  });
});
