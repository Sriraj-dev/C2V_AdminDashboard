import "server-only";
import { notFound, redirect } from "next/navigation";
import { clearSession, getSessionToken } from "@/lib/auth";
import { ApiRequestError, apiRequest, type ApiResult } from "./client";

type Query = Record<string, string | number | undefined>;

/** For Server Components and queries. Cannot modify cookies, so an expired session goes to /session-expired. */
export async function adminRead<T>(path: string, query?: Query): Promise<T> {
  const token = await getSessionToken();
  if (!token) redirect("/session-expired");
  const result = await apiRequest<T>(path, { token, query });
  if (result.ok) return result.data;
  if (result.error.status === 401) redirect("/session-expired");
  if (result.error.status === 404) notFound();
  throw new ApiRequestError(result.error);
}

/** For Server Actions. An expired session clears the cookie and goes to /login. */
export async function adminWrite<T>(
  path: string,
  init: { method?: "POST" | "PATCH"; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const token = await getSessionToken();
  if (!token) {
    await clearSession();
    redirect("/login?expired=1");
  }
  const result = await apiRequest<T>(path, { method: init.method ?? "POST", body: init.body, token });
  if (!result.ok && result.error.status === 401) {
    await clearSession();
    redirect("/login?expired=1");
  }
  return result;
}
