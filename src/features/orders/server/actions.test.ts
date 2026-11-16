import { beforeEach, describe, expect, it, vi } from "vitest";

const adminWrite = vi.fn();
const revalidatePath = vi.fn();
vi.mock("@/lib/api/admin", () => ({ adminWrite: (...a: unknown[]) => adminWrite(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));

import {
  assignOrder,
  bulkAssign,
  cancelOrder,
  markDelivered,
  markOutForDelivery,
  refundOrder,
} from "./actions";

const O1 = "11111111-1111-4111-8111-111111111111";
const O2 = "22222222-2222-4222-8222-222222222222";
const O3 = "33333333-3333-4333-8333-333333333333";
const P1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const order = { id: O1, status: "assigned" };

beforeEach(() => {
  adminWrite.mockReset();
  revalidatePath.mockReset();
});

describe("order actions", () => {
  it("assignOrder posts partnerId to /admin/orders/<id>/assign and revalidates", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { order } });
    const r = await assignOrder({ orderId: O1, partnerId: P1 });
    expect(adminWrite).toHaveBeenCalledWith(`/admin/orders/${O1}/assign`, { body: { partnerId: P1 } });
    expect(r).toEqual({ ok: true, data: { order } });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects a non-uuid orderId without calling the API", async () => {
    const r = await markOutForDelivery("../../partners");
    expect(r).toMatchObject({ ok: false, error: { code: "validation_error" } });
    expect(adminWrite).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    const a = await assignOrder({ orderId: "x", partnerId: P1 });
    expect(a).toMatchObject({ ok: false, error: { code: "validation_error" } });
    expect(adminWrite).not.toHaveBeenCalled();
  });

  it("maps 409 partner_unavailable to its API message", async () => {
    adminWrite.mockResolvedValue({
      ok: false,
      error: { status: 409, code: "partner_unavailable", message: "That partner is not available." },
    });
    const r = await assignOrder({ orderId: O1, partnerId: P1 });
    expect(r).toEqual({ ok: false, error: { code: "partner_unavailable", message: "That partner is not available." } });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps 409 invalid_transition (order changed elsewhere) to its API message", async () => {
    adminWrite.mockResolvedValue({
      ok: false,
      error: { status: 409, code: "invalid_transition", message: "This order changed. Refresh and try again." },
    });
    const r = await cancelOrder(O1);
    expect(r).toEqual({
      ok: false,
      error: { code: "invalid_transition", message: "This order changed. Refresh and try again." },
    });
  });

  it("markDelivered returns notified=false through", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { order, notified: false } });
    const r = await markDelivered(O1);
    expect(adminWrite).toHaveBeenCalledWith(`/admin/orders/${O1}/delivered`, {});
    expect(r).toEqual({ ok: true, data: { order, notified: false } });
  });

  it("refundOrder passes already_refunded through", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { result: "already_refunded", order } });
    const r = await refundOrder(O1);
    expect(adminWrite).toHaveBeenCalledWith(`/admin/orders/${O1}/refund`, {});
    expect(r).toEqual({ ok: true, data: { result: "already_refunded", order } });
  });

  it("bulkAssign summarises results: 2 ok, 1 failed with message", async () => {
    adminWrite.mockResolvedValue({
      ok: true,
      data: {
        results: [
          { orderId: O1, ok: true, order },
          { orderId: O2, ok: false, error: { code: "invalid_transition", message: "Already out for delivery." } },
          { orderId: O3, ok: true, order },
        ],
      },
    });
    const r = await bulkAssign({ orderIds: [O1, O2, O3], partnerId: P1 });
    expect(adminWrite).toHaveBeenCalledWith("/admin/orders/bulk-assign", {
      body: { orderIds: [O1, O2, O3], partnerId: P1 },
    });
    expect(r).toEqual({
      ok: true,
      data: { assigned: 2, failed: [{ orderId: O2, message: "Already out for delivery." }] },
    });
  });

  it("bulkAssign rejects 0 and 101 ids", async () => {
    const none = await bulkAssign({ orderIds: [], partnerId: P1 });
    const ids = Array.from({ length: 101 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    const many = await bulkAssign({ orderIds: ids, partnerId: P1 });
    expect(none).toMatchObject({ ok: false, error: { code: "validation_error" } });
    expect(many).toMatchObject({ ok: false, error: { code: "validation_error" } });
    expect(adminWrite).not.toHaveBeenCalled();
  });

  it("no action sends a tenant id in path or body", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { order, notified: true, result: "refunded", results: [] } });
    // extra tenant keys are rejected rather than forwarded
    const leaked = await assignOrder({ orderId: O1, partnerId: P1, tenantId: "other" } as never);
    expect(leaked).toMatchObject({ ok: false, error: { code: "validation_error" } });
    await assignOrder({ orderId: O1, partnerId: P1 });
    await markOutForDelivery(O1);
    await markDelivered(O1);
    await cancelOrder(O1);
    await refundOrder(O1);
    await bulkAssign({ orderIds: [O1], partnerId: P1 });
    expect(adminWrite).toHaveBeenCalledTimes(6);
    for (const [path, init] of adminWrite.mock.calls) {
      expect(path).not.toMatch(/tenant/i);
      expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    }
  });
});
