import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockNextHeaders } from "@/test/next-mocks";

let calls: { path: string; query?: Record<string, unknown> }[] = [];
let result: unknown = {};
const adminRead = async (path: string, query?: Record<string, unknown>) => {
  calls.push({ path, query });
  return result;
};

async function load() {
  vi.resetModules();
  mockNextHeaders();
  vi.doMock("@/lib/api/admin", () => ({ adminRead }));
  return import("./queries");
}

beforeEach(() => {
  calls = [];
  result = {};
});

describe("orders queries", () => {
  it("getActiveOrders unwraps items", async () => {
    result = { items: [{ id: "1" }] };
    const { getActiveOrders } = await load();
    expect(await getActiveOrders()).toEqual([{ id: "1" }]);
    expect(calls[0]?.path).toBe("/admin/orders/active");
  });
  it("getOrderHistory defaults to real statuses", async () => {
    result = { items: [], page: 1, pageSize: 25, total: 0 };
    const { getOrderHistory } = await load();
    await getOrderHistory({ page: 1, includeUnpaid: false });
    expect(calls[0]?.path).toBe("/admin/orders");
    expect(calls[0]?.query).toMatchObject({
      status: "confirmed,assigned,out_for_delivery,delivered,cancelled",
      page: 1,
      pageSize: 25,
    });
  });
  it("includeUnpaid adds unpaid statuses", async () => {
    const { getOrderHistory } = await load();
    await getOrderHistory({ page: 2, includeUnpaid: true });
    expect(calls[0]?.query?.status).toBe(
      "confirmed,assigned,out_for_delivery,delivered,cancelled,payment_pending,payment_failed,expired",
    );
  });
  it("explicit statuses and filters pass through", async () => {
    const { getOrderHistory } = await load();
    await getOrderHistory({ page: 1, includeUnpaid: false, status: ["delivered"], pincode: "560001", q: "x" });
    expect(calls[0]?.query).toMatchObject({ status: "delivered", pincode: "560001", q: "x" });
  });
  it("getOrder unwraps order", async () => {
    result = { order: { id: "9" } };
    const { getOrder } = await load();
    expect(await getOrder("9")).toEqual({ id: "9" });
    expect(calls[0]?.path).toBe("/admin/orders/9");
  });
  it("getPartnersForAssign picks fields and never returns the access token", async () => {
    result = { items: [{ id: "p", name: "N", phone: "1", active: false, accessToken: "t", openOrderCount: 3, createdAt: "z" }] };
    const { getPartnersForAssign } = await load();
    expect(await getPartnersForAssign()).toEqual([{ id: "p", name: "N", phone: "1", active: false }]);
    expect(calls[0]?.path).toBe("/admin/partners");
  });
});
