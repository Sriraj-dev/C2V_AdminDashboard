// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrderView } from "@/lib/api/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../server/actions", () => ({}));

import { OrderDetail } from "./order-detail";

afterEach(cleanup);

const order: OrderView = {
  id: "o1",
  orderCode: "NF-7K3QX9",
  status: "delivered",
  source: "one_time",
  deliveryDate: "2026-11-18",
  pincode: "560034",
  address: { name: "Asha", line1: "14, 5th Cross", pincode: "560034" },
  location: null,
  mapUrl: null,
  subtotalPaise: 9000,
  deliveryFeePaise: 0,
  totalPaise: 9000,
  customer: { id: "c1", profileName: "Asha", phone: "919800000001" },
  partner: null,
  paymentStatus: "paid",
  items: [],
  createdAt: "2026-11-16T05:00:00Z",
  updatedAt: "2026-11-16T05:00:00Z",
  paidAt: null,
  deliveredAt: null,
};

describe("OrderDetail", () => {
  it("has a Refresh button in the page header, next to the order code", () => {
    render(<OrderDetail order={order} partners={[]} />);
    const heading = screen.getByRole("heading", { level: 1, name: "NF-7K3QX9" });
    const header = heading.parentElement!.parentElement!;
    expect(within(header).getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
