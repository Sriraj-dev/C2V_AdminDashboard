"use server";

import { redirect } from "next/navigation";
import { fromApiError, validationFailed, type ActionResult } from "@/lib/action-result";
import { apiRequest } from "@/lib/api/client";
import type { LoginResponse } from "@/lib/api/types";
import { clearSession, getSessionToken, setSession } from "@/lib/auth";
import { loginSchema } from "../schemas";

export async function loginAction(input: unknown): Promise<ActionResult<never>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };

  const result = await apiRequest<LoginResponse>("/admin/auth/login", { method: "POST", body: parsed.data });
  if (!result.ok) return { ok: false, error: fromApiError(result.error) };

  await setSession(result.data.token, result.data.expiresAt);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    // Best effort: a failure here (even a 401) must not stop the local sign-out.
    await apiRequest("/admin/auth/logout", { method: "POST", token });
  }
  await clearSession();
  redirect("/login");
}
