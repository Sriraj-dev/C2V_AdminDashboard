import { beforeEach, describe, expect, it, vi } from "vitest";

const adminWrite = vi.fn();
vi.mock("@/lib/api/admin", () => ({
  adminWrite: (...a: unknown[]) => adminWrite(...a),
}));

import { createProduct, setProductActive, updateProduct } from "./actions";

const ID = "11111111-1111-4111-8111-111111111111";
const product = { id: ID, sku: "EGG6", name: "Eggs", pricePaise: 1250, active: true, sortOrder: 1 };
const base = { sku: "EGG6", name: "Eggs", price: "12.5", sortOrder: "", active: true };

beforeEach(() => adminWrite.mockReset());

describe("product actions", () => {
  it("createProduct converts rupees to paise and omits a blank sort order", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { product } });
    const r = await createProduct(base);
    expect(adminWrite).toHaveBeenCalledWith("/admin/products", {
      method: "POST",
      body: { sku: "EGG6", name: "Eggs", pricePaise: 1250, active: true },
    });
    expect(r).toMatchObject({ ok: true, data: { product: { id: ID } } });
  });

  it("createProduct rejects a price with 3 decimals without calling the API", async () => {
    const r = await createProduct({ ...base, price: "1.234" });
    expect(r).toMatchObject({
      ok: false,
      error: { code: "validation_error", fieldErrors: { price: "Enter a price like 90 or 12.50" } },
    });
    expect(adminWrite).not.toHaveBeenCalled();
  });

  it("rejects bad SKU, zero price and out-of-range sort order", async () => {
    for (const bad of [{ sku: "a b" }, { price: "0" }, { sortOrder: "2000000" }, { name: "  " }]) {
      const r = await createProduct({ ...base, ...bad });
      expect(r.ok).toBe(false);
    }
    expect(adminWrite).not.toHaveBeenCalled();
  });

  it("shows the API message for too_many_active_products and conflict", async () => {
    for (const code of ["too_many_active_products", "conflict"]) {
      adminWrite.mockResolvedValueOnce({ ok: false, error: { status: 409, code, message: `msg ${code}` } });
      const r = await createProduct(base);
      expect(r).toEqual({ ok: false, error: { code, message: `msg ${code}` } });
    }
  });

  it("maps an API pricePaise field error back to price", async () => {
    adminWrite.mockResolvedValue({
      ok: false,
      error: { status: 400, code: "validation_error", message: "bad", details: [{ path: "pricePaise", message: "too big" }] },
    });
    const r = await createProduct(base);
    expect(r).toMatchObject({ ok: false, error: { fieldErrors: { price: "too big" } } });
    expect(r.ok === false && r.error.fieldErrors).not.toHaveProperty("pricePaise");
  });

  it("updateProduct PATCHes only the changed fields", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { product } });
    await updateProduct(ID, { price: "90" });
    expect(adminWrite).toHaveBeenCalledWith(`/admin/products/${ID}`, {
      method: "PATCH",
      body: { pricePaise: 9000 },
    });
  });

  it("updateProduct rejects an empty patch and a bad id", async () => {
    expect((await updateProduct(ID, {})).ok).toBe(false);
    expect((await updateProduct(ID, { sortOrder: "" })).ok).toBe(false);
    expect((await updateProduct("nope", { name: "x" })).ok).toBe(false);
    expect(adminWrite).not.toHaveBeenCalled();
  });

  it("setProductActive sends only active", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { product } });
    await setProductActive(ID, false);
    expect(adminWrite).toHaveBeenCalledWith(`/admin/products/${ID}`, {
      method: "PATCH",
      body: { active: false },
    });
  });
});
