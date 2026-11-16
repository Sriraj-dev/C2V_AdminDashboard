// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../server/actions", () => ({ bulkAssign: vi.fn() }));
import type { OrderView } from "@/lib/api/types";
import { OrderList } from "./order-list";

afterEach(cleanup);

function order(name: string, profileName: string | null): OrderView {
  return {
    id: "o1",
    orderCode: "NF-7K3QX9",
    status: "confirmed",
    source: "one_time",
    deliveryDate: "2026-11-20",
    pincode: "560001",
    address: { name, line1: "x", pincode: "560001" },
    customer: { id: "c", profileName, phone: null },
    partner: null,
    totalPaise: 12000,
  } as OrderView;
}

describe("OrderList", () => {
  it("falls back from address name to profile name to Unknown", () => {
    render(<OrderList orders={[order("", "Prof Name"), { ...order("", null), id: "o2" }]} />);
    const cards = within(screen.getAllByRole("list")[0]!);
    expect(cards.getByText("Prof Name")).toBeTruthy();
    expect(cards.getByText("Unknown")).toBeTruthy();
  });
  it("links each card to the order and shows Unassigned and total", () => {
    render(<OrderList orders={[order("Asha", null)]} />);
    const card = within(screen.getByRole("list"));
    expect(card.getByRole("link").getAttribute("href")).toBe("/orders/o1");
    expect(card.getByText("Unassigned")).toBeTruthy();
    expect(card.getByText("₹120")).toBeTruthy();
  });
});

describe("OrderList selection", () => {
  const confirmed = { ...order("Asha", null), id: "a", orderCode: "NF-AAAAAA" };
  const delivered = { ...order("Bina", null), id: "b", orderCode: "NF-BBBBBB", status: "delivered" } as OrderView;
  const outFor = { ...order("Cara", null), id: "c", orderCode: "NF-CCCCCC", status: "out_for_delivery" } as OrderView;

  it("shows no checkboxes unless selectable", () => {
    render(<OrderList orders={[confirmed]} />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("offers a checkbox only on orders that can be assigned", () => {
    render(<OrderList orders={[confirmed, delivered, outFor]} selectable partners={[]} />);
    expect(screen.getAllByLabelText("Select NF-AAAAAA").length).toBeGreaterThan(0);
    expect(screen.queryAllByLabelText("Select NF-BBBBBB")).toHaveLength(0);
    expect(screen.queryAllByLabelText("Select NF-CCCCCC")).toHaveLength(0);
  });

  it("shows the bulk bar with the count once an order is selected", async () => {
    const user = userEvent.setup();
    render(<OrderList orders={[confirmed]} selectable partners={[{ id: "p", name: "Ravi", phone: "919999999999", active: true }]} />);
    expect(screen.queryByRole("region", { name: "Bulk assign" })).toBeNull();
    await user.click(screen.getAllByLabelText("Select NF-AAAAAA")[0]!);
    expect(screen.getByRole("button", { name: "Assign 1" })).toBeTruthy();
  });
});

describe("OrderList bulk limit", () => {
  it("disables Assign and explains when more than 100 are selected", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 101 }, (_, i) => ({ ...order("X", null), id: `id${i}`, orderCode: `NF-${i}` }));
    render(<OrderList orders={many} selectable partners={[]} />);
    await user.click(screen.getByRole("checkbox", { name: "Select all" }));
    expect(screen.getByText("Select up to 100 orders at a time.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Assign 101" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
