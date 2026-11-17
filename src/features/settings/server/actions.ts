"use server";

import { redirect } from "next/navigation";
import { fromApiError, validationFailed, type ActionResult } from "@/lib/action-result";
import { adminWrite } from "@/lib/api/admin";
import { apiRequest } from "@/lib/api/client";
import type { Settings } from "@/lib/api/types";
import { clearSession, getSessionToken, setSession } from "@/lib/auth";
import {
  changePasswordSchema,
  settingsPatchSchema,
  type ChangePasswordInput,
  type SettingsFormInput,
} from "../schemas";

/** Form fields `deliveryFee` / `minOrder` are sent as `deliveryFeePaise` / `minOrderPaise`. */
const TO_API: Record<string, string> = { deliveryFee: "deliveryFeePaise", minOrder: "minOrderPaise" };
const FROM_API = Object.fromEntries(Object.entries(TO_API).map(([k, v]) => [v, k]));

export async function updateSettings(
  input: Partial<SettingsFormInput>,
): Promise<ActionResult<{ settings: Settings }>> {
  const parsed = settingsPatchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) body[TO_API[k] ?? k] = v;
  }
  const result = await adminWrite<{ settings: Settings }>("/admin/settings", {
    method: "PATCH",
    body,
  });
  if (!result.ok) {
    const error = fromApiError(result.error);
    if (error.fieldErrors) {
      error.fieldErrors = Object.fromEntries(
        Object.entries(error.fieldErrors).map(([k, v]) => [FROM_API[k] ?? k, v]),
      );
    }
    return { ok: false, error };
  }
  return { ok: true, data: { settings: result.data.settings } };
}

const WRONG_CURRENT_PASSWORD = "Current password is wrong.";

/**
 * Calls apiRequest directly (not adminWrite): a wrong current password is a 401
 * `invalid_credentials` that must show a message, not end the session.
 */
export async function changePassword(input: ChangePasswordInput): Promise<ActionResult<null>> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };

  const token = await getSessionToken();
  if (!token) {
    await clearSession();
    redirect("/login?expired=1");
  }
  const { currentPassword, newPassword } = parsed.data;
  const result = await apiRequest<{ token: string; expiresAt: string }>(
    "/admin/auth/change-password",
    { method: "POST", token, body: { currentPassword, newPassword } },
  );
  if (!result.ok) {
    if (result.error.status === 401 && result.error.code !== "invalid_credentials") {
      await clearSession();
      redirect("/login?expired=1");
    }
    const error = fromApiError(result.error);
    if (result.error.code === "invalid_credentials") {
      // The API's message says "username or password"; here only the current password can be wrong.
      error.message = WRONG_CURRENT_PASSWORD;
      error.fieldErrors = { currentPassword: WRONG_CURRENT_PASSWORD };
    }
    return { ok: false, error };
  }
  await setSession(result.data.token, result.data.expiresAt);
  return { ok: true, data: null };
}
