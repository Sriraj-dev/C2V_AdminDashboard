import { describe, expect, it, vi } from "vitest";

describe("getProducts", () => {
  it("reads /admin/products and returns the items", async () => {
    vi.resetModules();
    const adminRead = vi.fn().mockResolvedValue({ items: [{ id: "1" }] });
    vi.doMock("@/lib/api/admin", () => ({ adminRead }));
    const { getProducts } = await import("./queries");
    expect(await getProducts()).toEqual([{ id: "1" }]);
    expect(adminRead).toHaveBeenCalledWith("/admin/products");
  });
});
