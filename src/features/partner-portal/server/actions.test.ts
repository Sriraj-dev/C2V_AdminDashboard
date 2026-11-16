import { beforeEach, describe, expect, it, vi } from "vitest";

const partnerWrite = vi.fn();
vi.mock("@/lib/api/partner", () => ({ partnerWrite: (...a: unknown[]) => partnerWrite(...a) }));

import { partnerDelivered, partnerOutForDelivery } from "./actions";

const TOKEN = "t".repeat(43);
const O1 = "11111111-1111-4111-8111-111111111111";
const order = { id: O1, status: "out_for_delivery" };

beforeEach(() => partnerWrite.mockReset());

describe("partner actions", () => {
  it("out-for-delivery posts to the token path", async () => {
    partnerWrite.mockResolvedValue({ ok: true, data: { order } });
    const r = await partnerOutForDelivery(TOKEN, O1);
    expect(partnerWrite).toHaveBeenCalledWith(TOKEN, `/orders/${O1}/out-for-delivery`);
    expect(r).toEqual({ ok: true, data: { order } });
  });

  it("delivered passes notified=false through", async () => {
    partnerWrite.mockResolvedValue({ ok: true, data: { order, notified: false } });
    const r = await partnerDelivered(TOKEN, O1);
    expect(partnerWrite).toHaveBeenCalledWith(TOKEN, `/orders/${O1}/delivered`);
    expect(r).toEqual({ ok: true, data: { order, notified: false } });
  });

  it("409 returns the API message", async () => {
    partnerWrite.mockResolvedValue({
      ok: false,
      error: { status: 409, code: "invalid_transition", message: "Order is not out for delivery." },
    });
    expect(await partnerDelivered(TOKEN, O1)).toEqual({
      ok: false,
      error: { code: "invalid_transition", message: "Order is not out for delivery." },
    });
  });

  it("404 returns the fixed no-longer-assigned copy", async () => {
    partnerWrite.mockResolvedValue({ ok: false, error: { status: 404, code: "not_found", message: "x" } });
    expect(await partnerOutForDelivery(TOKEN, O1)).toEqual({
      ok: false,
      error: { code: "not_found", message: "This order is no longer assigned to you." },
    });
  });

  it("rejects a non-uuid orderId and a malformed token without calling the API", async () => {
    expect(await partnerOutForDelivery(TOKEN, "../x")).toMatchObject({ ok: false });
    expect(await partnerDelivered("short", O1)).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(partnerWrite).not.toHaveBeenCalled();
  });
});
