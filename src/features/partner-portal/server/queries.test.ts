import { beforeEach, describe, expect, it, vi } from "vitest";

const partnerRead = vi.fn();
vi.mock("@/lib/api/partner", () => ({ partnerRead: (...a: unknown[]) => partnerRead(...a) }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import { getPartnerOrders } from "./queries";

beforeEach(() => partnerRead.mockReset());

describe("getPartnerOrders", () => {
  it("bad-shape token → notFound and no API call", async () => {
    await expect(getPartnerOrders("nope")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(partnerRead).not.toHaveBeenCalled();
  });

  it("reads /orders for a valid token", async () => {
    const data = { partner: { name: "Ravi" }, items: [] };
    partnerRead.mockResolvedValue(data);
    const token = "a".repeat(43);
    expect(await getPartnerOrders(token)).toBe(data);
    expect(partnerRead).toHaveBeenCalledWith(token, "/orders");
  });
});
