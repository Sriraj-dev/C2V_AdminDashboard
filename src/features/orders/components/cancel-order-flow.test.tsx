// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { refresh, toast, cancelOrder, refundOrder } = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn() }),
  cancelOrder: vi.fn(),
  refundOrder: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("../server/actions", () => ({
  cancelOrder: cancelOrder,
  refundOrder: refundOrder,
}));

import { CancelOrderFlow } from "./cancel-order-flow";

const order = { id: "o1", orderCode: "NF-7K3QX9", totalPaise: 12000, source: "one_time" as const };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function confirmCancel() {
  const user = userEvent.setup();
  render(<CancelOrderFlow order={order} canCancel />);
  await user.click(screen.getByRole("button", { name: "Cancel order" }));
  expect(screen.getByText("Cancel order NF-7K3QX9?")).toBeTruthy();
  expect(
    screen.getByText("This only changes the status. No money is returned and the customer is not notified."),
  ).toBeTruthy();
  await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel order" }));
  return user;
}

describe("CancelOrderFlow", () => {
  it("offers a refund after cancelling a paid order", async () => {
    cancelOrder.mockResolvedValue({ ok: true, data: { order: { paymentStatus: "paid" } } });
    refundOrder.mockResolvedValue({ ok: true, data: { result: "refunded", order: {} } });
    const user = await confirmCancel();
    expect(cancelOrder).toHaveBeenCalledWith("o1");
    expect(toast.success).toHaveBeenCalledWith("Order cancelled.");
    expect(await screen.findByText("Refund ₹120 now?")).toBeTruthy();
    expect(screen.getByText("The full amount goes back through Cashfree. The customer is not notified.")).toBeTruthy();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Refund" }));
    expect(refundOrder).toHaveBeenCalledWith("o1");
    expect(toast.success).toHaveBeenCalledWith("Refund issued.");
  });

  it("does not offer a refund for an unpaid order", async () => {
    cancelOrder.mockResolvedValue({ ok: true, data: { order: { paymentStatus: null } } });
    await confirmCancel();
    expect(toast.success).toHaveBeenCalledWith("Order cancelled.");
    expect(screen.queryByText(/Refund ₹120 now\?/)).toBeNull();
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the API message and refreshes when the cancel fails", async () => {
    cancelOrder.mockResolvedValue({
      ok: false,
      error: { code: "invalid_transition", message: "This order changed. Refresh and try again." },
    });
    await confirmCancel();
    expect(toast.error).toHaveBeenCalledWith("This order changed. Refresh and try again.");
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByText(/now\?/)).toBeNull();
  });
});
