// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../server/actions", () => ({ setPartnerActive: vi.fn(), resetPartnerLink: vi.fn() }));

import type { PartnerRow } from "../types";
import { PartnerLinkActions } from "./partner-link-actions";
import { PartnerStatusToggle } from "./partner-status-toggle";

afterEach(cleanup);

const base: PartnerRow = {
  id: "p",
  name: "Ravi",
  phone: "919800000002",
  active: true,
  accessTokenCreatedAt: null,
  openOrderCount: 0,
  createdAt: "2026-11-01T00:00:00.000Z",
  link: null,
};

describe("PartnerLinkActions", () => {
  it("shows Generate link when there is no link", () => {
    render(<PartnerLinkActions partner={base} />);
    expect(screen.getByRole("button", { name: /Generate link/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Reset link/ })).toBeNull();
  });
  it("shows Copy, Share and Reset when there is a link", () => {
    render(<PartnerLinkActions partner={{ ...base, link: "https://x/p/t" }} />);
    expect(screen.getByRole("button", { name: /Reset link/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Copy link/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Share on WhatsApp/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Generate link/ })).toBeNull();
  });
  it("hides Share for an inactive partner and explains", () => {
    render(<PartnerLinkActions partner={{ ...base, active: false, link: "https://x/p/t" }} />);
    expect(screen.queryByRole("link", { name: /Share on WhatsApp/ })).toBeNull();
    expect(screen.getByText("Link works again when reactivated.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Copy link/ })).toBeTruthy();
  });
});

describe("PartnerStatusToggle", () => {
  it("confirms deactivation only when there are open orders", async () => {
    const { setPartnerActive } = await import("../server/actions");
    vi.mocked(setPartnerActive).mockResolvedValue({ ok: true, data: { partner: base } });
    render(<PartnerStatusToggle partner={{ ...base, openOrderCount: 3 }} />);
    screen.getByRole("button", { name: "Deactivate" }).click();
    expect(await screen.findByText(/still has 3 open orders/)).toBeTruthy();
    expect(setPartnerActive).not.toHaveBeenCalled();
  });
  it("deactivates straight away with no open orders", async () => {
    const { setPartnerActive } = await import("../server/actions");
    vi.mocked(setPartnerActive).mockResolvedValue({ ok: true, data: { partner: base } });
    render(<PartnerStatusToggle partner={base} />);
    screen.getByRole("button", { name: "Deactivate" }).click();
    await vi.waitFor(() => expect(setPartnerActive).toHaveBeenCalledWith("p", false));
    expect(screen.queryByText(/still has/)).toBeNull();
  });
});
