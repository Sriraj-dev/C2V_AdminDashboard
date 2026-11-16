// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
