import { expect, it } from "vitest";
import { partnerShareText } from "./utils";

it("partnerShareText", () => {
  expect(partnerShareText("Ravi", "https://x/p/t")).toBe(
    "Hi Ravi, here is your delivery link. Open it to see your orders and mark them delivered:\nhttps://x/p/t",
  );
});

import { changedFields, phoneTail } from "./utils";

it("phoneTail normalises prefixes", () => {
  expect(phoneTail("+91 98765-43210")).toBe("9876543210");
  expect(phoneTail("919876543210")).toBe("9876543210");
});

it("changedFields handles numbers starting with 91", () => {
  const p = { name: "A", phone: "919198765432" };
  expect(changedFields(p, { name: "A", phone: "9198765432" })).toEqual({});
  expect(changedFields(p, { name: "A", phone: "+919198765432" })).toEqual({});
  expect(changedFields(p, { name: "B", phone: "9198765432" })).toEqual({
    name: "B",
  });
  expect(changedFields(p, { name: "A", phone: "9800000003" })).toEqual({
    phone: "9800000003",
  });
});
