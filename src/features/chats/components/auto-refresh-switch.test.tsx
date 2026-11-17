// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mounted = vi.fn();
vi.mock("@/components/shared/auto-refresh", () => ({
  AutoRefresh: ({ intervalMs }: { intervalMs: number }) => {
    mounted(intervalMs);
    return <span data-testid="auto-refresh" />;
  },
}));

import { AutoRefreshSwitch } from "./auto-refresh-switch";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AutoRefreshSwitch", () => {
  it("does not mount AutoRefresh by default", () => {
    render(<AutoRefreshSwitch intervalMs={10000} />);
    expect(screen.queryByTestId("auto-refresh")).toBeNull();
    expect(screen.getByRole("switch", { name: "Auto-refresh" })).not.toBeChecked();
  });
  it("mounts it with the interval once on, and unmounts when off", async () => {
    render(<AutoRefreshSwitch intervalMs={10000} />);
    await userEvent.click(screen.getByRole("switch", { name: "Auto-refresh" }));
    expect(screen.getByTestId("auto-refresh")).toBeInTheDocument();
    expect(mounted).toHaveBeenCalledWith(10000);
    await userEvent.click(screen.getByRole("switch", { name: "Auto-refresh" }));
    expect(screen.queryByTestId("auto-refresh")).toBeNull();
  });
});
