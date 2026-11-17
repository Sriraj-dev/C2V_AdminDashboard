// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUrlSyncedText } from "./use-url-synced-text";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(initial = "") {
  const commit = vi.fn();
  const hook = renderHook(({ value }) => useUrlSyncedText(value, commit), { initialProps: { value: initial } });
  const type = (t: string) => act(() => hook.result.current[1](t));
  const wait = () => act(() => vi.advanceTimersByTime(300));
  return { ...hook, commit, type, wait, text: () => hook.result.current[0] };
}

describe("useUrlSyncedText", () => {
  it("commits trimmed text after the debounce", () => {
    const h = setup();
    h.type(" asha ");
    expect(h.commit).not.toHaveBeenCalled();
    h.wait();
    expect(h.commit).toHaveBeenCalledWith("asha");
  });

  it("keeps typing when the URL echoes an earlier push", () => {
    const h = setup();
    h.type("a");
    h.wait();
    h.type("ab");
    h.rerender({ value: "a" });
    expect(h.text()).toBe("ab");
  });

  it("ignores a stale echo that arrives after a second push", () => {
    const h = setup();
    h.type("a");
    h.wait();
    h.type("ab");
    h.wait();
    expect(h.commit).toHaveBeenLastCalledWith("ab");
    h.rerender({ value: "a" }); // late echo of the first push
    expect(h.text()).toBe("ab");
    h.wait();
    expect(h.commit).toHaveBeenCalledTimes(2); // no re-push
    h.rerender({ value: "ab" });
    expect(h.text()).toBe("ab");
  });

  it("adopts an external URL change", () => {
    const h = setup("a");
    h.rerender({ value: "zed" });
    expect(h.text()).toBe("zed");
    h.wait();
    expect(h.commit).not.toHaveBeenCalled();
  });
});
