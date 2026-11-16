import "server-only";
import { notFound } from "next/navigation";
import { ApiRequestError, apiRequest, type ApiResult } from "./client";

// The partner token is the only credential: never send it as a header, never log it.
function partnerPath(token: string, path: string): string {
  return `/partner/${encodeURIComponent(token)}${path}`;
}

export async function partnerRead<T>(token: string, path: string): Promise<T> {
  const result = await apiRequest<T>(partnerPath(token, path));
  if (result.ok) return result.data;
  if (result.error.status === 404) notFound();
  throw new ApiRequestError(result.error);
}

export async function partnerWrite<T>(token: string, path: string): Promise<ApiResult<T>> {
  return apiRequest<T>(partnerPath(token, path), { method: "POST" });
}
