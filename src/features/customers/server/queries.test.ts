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

describe("customers queries", () => {
  it("getCustomers passes q, page and pageSize 25", async () => {
    result = { items: [], page: 2, pageSize: 25, total: 0 };
    const { getCustomers } = await load();
    await getCustomers({ q: "asha", page: 2 });
    expect(calls[0]).toEqual({ path: "/admin/customers", query: { q: "asha", page: 2, pageSize: 25 } });
  });
  it("getCustomers omits an empty q and never sends a tenant id", async () => {
    const { getCustomers } = await load();
    await getCustomers({ page: 1 });
    expect(calls[0]?.query).toEqual({ q: undefined, page: 1, pageSize: 25 });
  });
  it("getCustomer reads the encoded id and returns customer + orders", async () => {
    result = { customer: { id: "c1" }, orders: [] };
    const { getCustomer } = await load();
    expect(await getCustomer("c 1")).toEqual({ customer: { id: "c1" }, orders: [] });
    expect(calls[0]?.path).toBe("/admin/customers/c%201");
  });
  it("getCustomer calls notFound when the API returns 404", async () => {
    vi.resetModules();
    vi.doUnmock("@/lib/api/admin");
    const { notFound } = mockNextHeaders({ c2v_session: "tok" });
    vi.doMock("@/lib/api/client", () => ({
      ApiRequestError: class extends Error {},
      apiRequest: async () => ({ ok: false, error: { status: 404, code: "not_found", message: "no" } }),
    }));
    const { getCustomer } = await import("./queries");
    await expect(getCustomer("x")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
    vi.doUnmock("@/lib/api/client");
  });
});
