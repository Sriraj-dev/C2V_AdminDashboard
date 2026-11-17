// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrderView } from "@/lib/api/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const markDelivered = vi.fn();
vi.mock("../server/actions", () => ({ markDelivered: (...a: unknown[]) => markDelivered(...a) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), warning: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { OrderActions } from "./order-actions";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const base = { id: "o", orderCode: "NF-1", source: "one_time", totalPaise: 100, partner: null } as unknown as OrderView;

describe("OrderActions", () => {
  it("renders no visible bar for a cancelled, refunded order", () => {
    const { container } = render(<OrderActions order={{ ...base, status: "cancelled", paymentStatus: "refunded" }} partners={[]} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect((container.firstElementChild as HTMLElement).hidden).toBe(true);
  });
  it("shows Assign and Cancel for a confirmed order", () => {
    render(<OrderActions order={{ ...base, status: "confirmed", paymentStatus: "paid" }} partners={[]} />);
    expect(screen.getByRole("button", { name: "Assign" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeTruthy();
  });
  it("asks before marking delivered and only then calls the action", async () => {
    markDelivered.mockResolvedValue({ ok: true, data: { order: {}, notified: false } });
    render(<OrderActions order={{ ...base, status: "out_for_delivery", paymentStatus: "paid" }} partners={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Delivered" }));
    const dialog = screen.getByRole("alertdialog", { name: "Mark NF-1 delivered?" });
    expect(dialog).toHaveTextContent("The customer gets a WhatsApp message.");
    expect(markDelivered).not.toHaveBeenCalled();
    await userEvent.click(screen.getAllByRole("button", { name: "Delivered" }).at(-1)!);
    await waitFor(() => expect(markDelivered).toHaveBeenCalledWith("o"));
    expect(toast.warning).toHaveBeenCalled();
  });
  it("does nothing when the delivered confirm is cancelled", async () => {
    render(<OrderActions order={{ ...base, status: "out_for_delivery", paymentStatus: "paid" }} partners={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Delivered" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(markDelivered).not.toHaveBeenCalled();
  });
});
