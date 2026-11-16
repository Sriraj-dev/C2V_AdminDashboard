// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { AutoRefresh } from "./auto-refresh";

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
}

describe("AutoRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockClear();
    setVisibility("visible");
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("refreshes on the interval while visible", () => {
    render(<AutoRefresh intervalMs={1000} />);
    vi.advanceTimersByTime(3000);
    expect(refresh).toHaveBeenCalledTimes(3);
  });
  it("does not refresh while hidden", () => {
    setVisibility("hidden");
    render(<AutoRefresh intervalMs={1000} />);
    vi.advanceTimersByTime(3000);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("refreshes once when the tab becomes visible", () => {
    setVisibility("hidden");
    render(<AutoRefresh intervalMs={60000} />);
    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("stops after unmount and removes the listener", () => {
    const remove = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<AutoRefresh intervalMs={1000} />);
    unmount();
    expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    vi.advanceTimersByTime(3000);
    expect(refresh).not.toHaveBeenCalled();
  });
});
