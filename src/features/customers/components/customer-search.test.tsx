// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/customers",
  useSearchParams: () => new URLSearchParams("page=3"),
}));

import { CustomerSearch } from "./customer-search";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  replace.mockClear();
  vi.useRealTimers();
});

const input = () => screen.getByLabelText("Search customers") as HTMLInputElement;

describe("CustomerSearch", () => {
  it("debounces, writes q and resets page", () => {
    render(<CustomerSearch value="" />);
    fireEvent.change(input(), { target: { value: "asha" } });
    expect(replace).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(replace).toHaveBeenCalledWith("/customers?q=asha");
  });

  it("keeps typing when the URL echoes an earlier q", () => {
    const { rerender } = render(<CustomerSearch value="" />);
    fireEvent.change(input(), { target: { value: "a" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.change(input(), { target: { value: "ab" } });
    rerender(<CustomerSearch value="a" />);
    expect(input().value).toBe("ab");
  });

  it("adopts an external URL change", () => {
    const { rerender } = render(<CustomerSearch value="a" />);
    rerender(<CustomerSearch value="zed" />);
    expect(input().value).toBe("zed");
  });
});

describe("CustomerSearch stale echoes", () => {
  it("does not reset the text when an older echo arrives after a second push", () => {
    const { rerender } = render(<CustomerSearch value="" />);
    fireEvent.change(input(), { target: { value: "a" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.change(input(), { target: { value: "ab" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender(<CustomerSearch value="a" />);
    expect(input().value).toBe("ab");
  });
});
