// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const updateProduct = vi.fn();
const createProduct = vi.fn();
vi.mock("../server/actions", () => ({
  createProduct: (...a: unknown[]) => createProduct(...a),
  updateProduct: (...a: unknown[]) => updateProduct(...a),
  setProductActive: vi.fn(),
}));

import type { Product } from "@/lib/api/types";
import { ProductFormDialog } from "./product-form-dialog";

// jsdom lacks these; Radix Switch/Select need them.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

afterEach(() => {
  cleanup();
  updateProduct.mockReset();
  createProduct.mockReset();
});

const saved: Product = {
  id: "p1",
  sku: "EGG6",
  name: "Eggs",
  pricePaise: 1000,
  active: true,
  sortOrder: 2,
  createdAt: "2026-11-01T00:00:00.000Z",
};

describe("ProductFormDialog", () => {
  it("passes the price text '12.5' to the action", async () => {
    createProduct.mockResolvedValue({ ok: true, data: { product: saved } });
    render(<ProductFormDialog trigger={<button>Add</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.type(screen.getByLabelText("SKU"), "EGG6");
    await userEvent.type(screen.getByLabelText("Name"), "Eggs");
    await userEvent.type(screen.getByLabelText(/Price/), "12.5");
    await userEvent.click(screen.getByRole("button", { name: "Add product" }));
    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1));
    expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({ price: "12.5" }));
  });

  it("edit sends only the changed field", async () => {
    updateProduct.mockResolvedValue({ ok: true, data: { product: saved } });
    render(<ProductFormDialog product={saved} trigger={<button>Edit</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const price = screen.getByLabelText(/Price/);
    await userEvent.clear(price);
    await userEvent.type(price, "12.5");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateProduct).toHaveBeenCalledTimes(1));
    expect(updateProduct).toHaveBeenCalledWith("p1", { price: "12.50" });
  });

  it("a no-op edit closes without calling the action", async () => {
    render(<ProductFormDialog product={saved} trigger={<button>Edit</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(updateProduct).not.toHaveBeenCalled();
  });
});
