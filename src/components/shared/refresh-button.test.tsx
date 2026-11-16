// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { RefreshButton } from "./refresh-button";

describe("RefreshButton", () => {
  afterEach(() => {
    cleanup();
    refresh.mockClear();
  });

  it("does not refresh on its own", () => {
    render(<RefreshButton />);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes the route when clicked", () => {
    render(<RefreshButton />);
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
