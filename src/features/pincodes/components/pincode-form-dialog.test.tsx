// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const updatePincode = vi.fn();
vi.mock("../server/actions", () => ({
  createPincode: vi.fn(),
  updatePincode: (...a: unknown[]) => updatePincode(...a),
  setPincodeActive: vi.fn(),
}));

import type { Pincode } from "@/lib/api/types";
import { PincodeFormDialog } from "./pincode-form-dialog";

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
  updatePincode.mockReset();
});

const saved: Pincode = {
  id: "p1",
  pincode: "560034",
  deliveryWeekday: 3,
  note: null,
  active: true,
  createdAt: "2026-11-01T00:00:00.000Z",
};

describe("PincodeFormDialog edit", () => {
  it("sends only the changed weekday, never the pincode", async () => {
    updatePincode.mockResolvedValue({ ok: true, data: { pincode: saved } });
    render(<PincodeFormDialog pincode={saved} trigger={<button>Edit</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Friday" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updatePincode).toHaveBeenCalledTimes(1));
    expect(updatePincode).toHaveBeenCalledWith("p1", { deliveryWeekday: 5 });
  });

  it("shows the pincode read-only and calls nothing when unchanged", async () => {
    render(<PincodeFormDialog pincode={saved} trigger={<button>Edit</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect((screen.getByLabelText("Pincode") as HTMLInputElement).readOnly).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(updatePincode).not.toHaveBeenCalled();
  });
});
