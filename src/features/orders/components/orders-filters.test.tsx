// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/orders",
  useSearchParams: () => new URLSearchParams("view=history&deliveryFrom=nope"),
}));

import { OrdersFilters } from "./orders-filters";

afterEach(() => {
  cleanup();
  replace.mockClear();
  vi.useRealTimers();
});

describe("OrdersFilters", () => {
  it("renders inputs from the validated values it is given", () => {
    render(<OrdersFilters view="history" partners={[]} values={{ deliveryFrom: "2026-11-01", pincode: "560001" }} />);
    expect((screen.getByLabelText("Delivery from") as HTMLInputElement).value).toBe("2026-11-01");
    expect((screen.getByLabelText("Delivery to") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Pincode") as HTMLInputElement).value).toBe("560001");
  });
  it("keeps typing in Search while the URL round trip is in flight", () => {
    vi.useFakeTimers();
    const { rerender } = render(<OrdersFilters view="active" partners={[]} values={{}} />);
    const q = () => screen.getByLabelText("Search") as HTMLInputElement;
    fireEvent.change(q(), { target: { value: "NF" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(replace).toHaveBeenLastCalledWith(expect.stringContaining("q=NF"));
    fireEvent.change(q(), { target: { value: "NF-7K" } });
    rerender(<OrdersFilters view="active" partners={[]} values={{ q: "NF" }} />);
    expect(q().value).toBe("NF-7K");
  });
});
