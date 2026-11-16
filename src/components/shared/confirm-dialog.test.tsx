// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a) } }));

import { ConfirmDialog } from "./confirm-dialog";

function setup(onConfirm: () => Promise<void>) {
  render(
    <ConfirmDialog
      trigger={<button>Open</button>}
      title="Sure?"
      description="Really"
      confirmLabel="Do it"
      onConfirm={onConfirm}
    />,
  );
}

describe("ConfirmDialog", () => {
  afterEach(() => {
    cleanup();
    toastError.mockClear();
  });

  it("closes on success", async () => {
    const user = userEvent.setup();
    setup(async () => {});
    await user.click(screen.getByText("Open"));
    await user.click(screen.getByRole("button", { name: "Do it" }));
    expect(screen.queryByText("Sure?")).toBeNull();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("stays open and shows an error toast when onConfirm rejects", async () => {
    const user = userEvent.setup();
    setup(async () => {
      throw new Error("x");
    });
    await user.click(screen.getByText("Open"));
    await user.click(screen.getByRole("button", { name: "Do it" }));
    expect(screen.getByText("Sure?")).toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith("Something went wrong. Try again.");
    expect(screen.getByRole("button", { name: "Do it" })).toBeEnabled();
  });
});
