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
  it("getRefundsNeeded reads /admin/refunds/needed and unwraps items", async () => {
    result = { items: [{ id: "r1", refundReason: "paid_after_expiry" }] };
    const { getRefundsNeeded } = await load();
    expect(await getRefundsNeeded()).toEqual([{ id: "r1", refundReason: "paid_after_expiry" }]);
    expect(calls[0]?.path).toBe("/admin/refunds/needed");
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
  it("getPartnerLinks builds links and omits partners without a token", async () => {
    vi.stubEnv("C2V_API_URL", "http://localhost:8080");
    vi.stubEnv("PUBLIC_APP_URL", "https://app.example.com/");
    result = {
      items: [
        { id: "p1", name: "A", phone: "1", active: true, accessToken: "tok1" },
        { id: "p2", name: "B", phone: "2", active: true, accessToken: null },
      ],
    };
    const { getPartnerLinks } = await load();
    expect(await getPartnerLinks()).toEqual({ p1: "https://app.example.com/p/tok1" });
    vi.unstubAllEnvs();
  });
  it("shares one partners request between getPartnersForAssign and getPartnerLinks", async () => {
    vi.stubEnv("C2V_API_URL", "http://localhost:8080");
    vi.stubEnv("PUBLIC_APP_URL", "http://localhost:3000");
    result = { items: [{ id: "p1", name: "A", phone: "1", active: true, accessToken: "tok1" }] };
    vi.resetModules();
    mockNextHeaders();
    vi.doMock("@/lib/api/admin", () => ({ adminRead }));
    // React cache only dedupes inside a render; emulate one render scope with a memoiser.
    vi.doMock("react", async (orig) => ({
      ...(await orig<typeof import("react")>()),
      cache: <T extends () => unknown>(fn: T) => {
        let v: unknown;
        let done = false;
        return (() => (done ? v : ((done = true), (v = fn())))) as T;
      },
    }));
    const { getPartnersForAssign, getPartnerLinks } = await import("./queries");
    const partners = await getPartnersForAssign();
    await getPartnerLinks();
    expect(calls.filter((c) => c.path === "/admin/partners")).toHaveLength(1);
    expect(partners[0]).not.toHaveProperty("accessToken");
    vi.doUnmock("react");
    vi.unstubAllEnvs();
  });
});
