// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/orders",
  useSearchParams: () => new URLSearchParams("view=history&deliveryFrom=nope"),
}));

import { OrdersFilters } from "./orders-filters";

afterEach(cleanup);

describe("OrdersFilters", () => {
  it("renders inputs from the validated values it is given", () => {
    render(<OrdersFilters view="history" partners={[]} values={{ deliveryFrom: "2026-11-01", pincode: "560001" }} />);
    expect((screen.getByLabelText("Delivery from") as HTMLInputElement).value).toBe("2026-11-01");
    expect((screen.getByLabelText("Delivery to") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Pincode") as HTMLInputElement).value).toBe("560001");
  });
});
