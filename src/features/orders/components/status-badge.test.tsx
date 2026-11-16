// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

afterEach(cleanup);

describe("StatusBadge", () => {
  it("shows the label with its tone classes", () => {
    render(<StatusBadge status="assigned" />);
    const el = screen.getByText("Assigned");
    expect(el.className).toContain("bg-status-accent-bg");
    expect(el.className).toContain("text-status-accent-fg");
  });
  it("uses danger for cancelled", () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText("Cancelled").className).toContain("bg-status-danger-bg");
  });
});
