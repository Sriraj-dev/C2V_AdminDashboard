// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const updateSettings = vi.fn();
const changePassword = vi.fn();
vi.mock("../server/actions", () => ({
  updateSettings: (...a: unknown[]) => updateSettings(...a),
  changePassword: (...a: unknown[]) => changePassword(...a),
}));

import { ChangePasswordForm } from "./change-password-form";
import { SettingsForm } from "./settings-form";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const settings = { supportPhone: "919876543210", welcomeImageUrl: null, deliveryFeePaise: 4000, minOrderPaise: 19950 };

describe("SettingsForm", () => {
  it("pre-fills and says Nothing to save without calling the action", async () => {
    render(<SettingsForm settings={settings} />);
    expect(screen.getByLabelText("Delivery fee")).toHaveValue("40");
    expect(screen.getByLabelText("Minimum order")).toHaveValue("199.50");
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("Nothing to save."));
    expect(updateSettings).not.toHaveBeenCalled();
  });
  it("sends only the changed field and toasts", async () => {
    updateSettings.mockResolvedValue({ ok: true, data: { settings } });
    render(<SettingsForm settings={settings} />);
    const fee = screen.getByLabelText("Delivery fee");
    await userEvent.clear(fee);
    await userEvent.type(fee, "50");
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() => expect(updateSettings).toHaveBeenCalledWith({ deliveryFee: "50" }));
    expect(toast.success).toHaveBeenCalledWith("Saved. Applies to the next order form.");
  });
  it("shows server field errors inline", async () => {
    updateSettings.mockResolvedValue({
      ok: false,
      error: { code: "validation_error", message: "Check", fieldErrors: { welcomeImageUrl: "Bad link" } },
    });
    render(<SettingsForm settings={settings} />);
    await userEvent.type(screen.getByLabelText("Welcome image link"), "https://a.com/x.png");
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(await screen.findByText("Bad link")).toBeTruthy();
  });
  it("still shows a server error that matches no field next to field errors", async () => {
    updateSettings.mockResolvedValue({
      ok: false,
      error: {
        code: "validation_error",
        message: "Check",
        fieldErrors: { welcomeImageUrl: "Bad link", tenant: "Settings are locked" },
      },
    });
    render(<SettingsForm settings={settings} />);
    await userEvent.type(screen.getByLabelText("Welcome image link"), "https://a.com/x.png");
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(await screen.findByText("Bad link")).toBeTruthy();
    expect(screen.getByText("Settings are locked")).toHaveAttribute("role", "alert");
  });
});

describe("ChangePasswordForm stale errors", () => {
  it("clears an old server banner when the next submit fails client validation", async () => {
    changePassword.mockResolvedValue({ ok: false, error: { code: "server_error", message: "Try again later." } });
    render(<ChangePasswordForm />);
    await userEvent.type(screen.getByLabelText("Current password"), "old-pass");
    await userEvent.type(screen.getByLabelText(/^New password/), "brand-new-pass");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "brand-new-pass");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText("Try again later.")).toBeTruthy();
    await userEvent.clear(screen.getByLabelText("Current password"));
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText("Enter your current password")).toBeTruthy();
    expect(screen.queryByText("Try again later.")).toBeNull();
  });
});

describe("ChangePasswordForm", () => {
  it("uses password inputs with the right autocomplete", () => {
    render(<ChangePasswordForm />);
    expect(screen.getByLabelText("Current password")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Current password")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute("autocomplete", "new-password");
  });
  it("shows the wrong-current-password message inline", async () => {
    changePassword.mockResolvedValue({
      ok: false,
      error: {
        code: "invalid_credentials",
        message: "Current password is wrong.",
        fieldErrors: { currentPassword: "Current password is wrong." },
      },
    });
    render(<ChangePasswordForm />);
    await userEvent.type(screen.getByLabelText("Current password"), "nope");
    await userEvent.type(screen.getByLabelText(/^New password/), "brand-new-pass");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "brand-new-pass");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));
    const msg = await screen.findByText("Current password is wrong.");
    expect(msg).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText("Current password")).toHaveAttribute("aria-describedby", msg.id);
    expect(screen.getAllByText("Current password is wrong.")).toHaveLength(1);
  });
  it("resets the fields and toasts on success", async () => {
    changePassword.mockResolvedValue({ ok: true, data: null });
    render(<ChangePasswordForm />);
    await userEvent.type(screen.getByLabelText("Current password"), "old-pass");
    await userEvent.type(screen.getByLabelText(/^New password/), "brand-new-pass");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "brand-new-pass");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Password changed. Other devices are signed out."));
    expect(screen.getByLabelText("Current password")).toHaveValue("");
  });
});
