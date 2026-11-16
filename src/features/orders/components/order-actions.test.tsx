// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OrderView } from "@/lib/api/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../server/actions", () => ({}));

import { OrderActions } from "./order-actions";

afterEach(cleanup);

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
});
