import { describe, expect, it, vi } from "vitest";

describe("getPincodes", () => {
  it("reads /admin/pincodes and returns the items", async () => {
    vi.resetModules();
    const adminRead = vi.fn().mockResolvedValue({ items: [{ id: "1" }] });
    vi.doMock("@/lib/api/admin", () => ({ adminRead }));
    const { getPincodes } = await import("./queries");
    expect(await getPincodes()).toEqual([{ id: "1" }]);
    expect(adminRead).toHaveBeenCalledWith("/admin/pincodes");
  });
});
