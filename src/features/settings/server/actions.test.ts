import { beforeEach, describe, expect, it, vi } from "vitest";

const adminWrite = vi.fn();
const apiRequest = vi.fn();
const getSessionToken = vi.fn();
const setSession = vi.fn();
const clearSession = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("@/lib/api/admin", () => ({ adminWrite: (...a: unknown[]) => adminWrite(...a) }));
vi.mock("@/lib/api/client", () => ({ apiRequest: (...a: unknown[]) => apiRequest(...a) }));
vi.mock("@/lib/auth", () => ({
  getSessionToken: () => getSessionToken(),
  setSession: (...a: unknown[]) => setSession(...a),
  clearSession: () => clearSession(),
}));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));

import { changePassword, updateSettings } from "./actions";

const settings = { supportPhone: null, welcomeImageUrl: null, deliveryFeePaise: 0, minOrderPaise: 0 };
const pw = { currentPassword: "old-pass", newPassword: "brand-new-pass", confirmPassword: "brand-new-pass" };

beforeEach(() => {
  for (const m of [adminWrite, apiRequest, getSessionToken, setSession, clearSession, redirect]) m.mockClear();
  getSessionToken.mockResolvedValue("tok");
});

describe("updateSettings", () => {
  it("sends paise keys, null for empty, and fee '0' as 0", async () => {
    adminWrite.mockResolvedValue({ ok: true, data: { settings } });
    const r = await updateSettings({ supportPhone: "", deliveryFee: "0" });
    expect(adminWrite).toHaveBeenCalledWith("/admin/settings", {
      method: "PATCH",
      body: { supportPhone: null, deliveryFeePaise: 0 },
    });
    expect(r.ok).toBe(true);
  });
  it("rejects http image without calling the API", async () => {
    const r = await updateSettings({ welcomeImageUrl: "http://a.com/x.png" });
    expect(r).toMatchObject({ ok: false, error: { fieldErrors: { welcomeImageUrl: expect.any(String) } } });
    expect(adminWrite).not.toHaveBeenCalled();
  });
  it("rejects an empty patch", async () => {
    expect((await updateSettings({})).ok).toBe(false);
    expect(adminWrite).not.toHaveBeenCalled();
  });
  it("maps API paise field errors back to form fields", async () => {
    adminWrite.mockResolvedValue({
      ok: false,
      error: { status: 400, code: "validation_error", message: "bad", details: [{ path: "minOrderPaise", message: "too big" }] },
    });
    const r = await updateSettings({ minOrder: "5" });
    expect(r).toMatchObject({ ok: false, error: { fieldErrors: { minOrder: "too big" } } });
  });
});

describe("changePassword", () => {
  it("sends only current and new password and stores the new session", async () => {
    apiRequest.mockResolvedValue({ ok: true, data: { token: "new-tok", expiresAt: "2026-12-17T00:00:00.000Z", user: {} } });
    const r = await changePassword(pw);
    expect(apiRequest).toHaveBeenCalledWith("/admin/auth/change-password", {
      method: "POST",
      token: "tok",
      body: { currentPassword: "old-pass", newPassword: "brand-new-pass" },
    });
    expect(setSession).toHaveBeenCalledWith("new-tok", "2026-12-17T00:00:00.000Z");
    expect(r).toEqual({ ok: true, data: null });
    expect(JSON.stringify(r)).not.toContain("brand-new-pass");
  });
  it("mismatch gives confirmPassword error and makes no call", async () => {
    const r = await changePassword({ ...pw, confirmPassword: "other-other" });
    expect(r).toMatchObject({ ok: false, error: { fieldErrors: { confirmPassword: "Passwords don't match" } } });
    expect(apiRequest).not.toHaveBeenCalled();
  });
  it("wrong current password shows the message, keeps the cookie, no redirect", async () => {
    apiRequest.mockResolvedValue({ ok: false, error: { status: 401, code: "invalid_credentials", message: "Current password is wrong." } });
    const r = await changePassword(pw);
    expect(r).toMatchObject({
      ok: false,
      error: { code: "invalid_credentials", message: "Current password is wrong.", fieldErrors: { currentPassword: "Current password is wrong." } },
    });
    expect(clearSession).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
  it("an expired session (401 unauthorized) clears the cookie and redirects", async () => {
    apiRequest.mockResolvedValue({ ok: false, error: { status: 401, code: "unauthorized", message: "Sign in again." } });
    await expect(changePassword(pw)).rejects.toThrow("REDIRECT:/login?expired=1");
    expect(clearSession).toHaveBeenCalled();
  });
  it("no session token clears and redirects without calling the API", async () => {
    getSessionToken.mockResolvedValue(null);
    await expect(changePassword(pw)).rejects.toThrow("REDIRECT:/login?expired=1");
    expect(clearSession).toHaveBeenCalled();
    expect(apiRequest).not.toHaveBeenCalled();
  });
  it("other API errors are returned with their message", async () => {
    apiRequest.mockResolvedValue({ ok: false, error: { status: 0, code: "network_error", message: "Couldn't reach the server. Try again." } });
    expect(await changePassword(pw)).toMatchObject({ ok: false, error: { code: "network_error" } });
    expect(clearSession).not.toHaveBeenCalled();
  });
});
