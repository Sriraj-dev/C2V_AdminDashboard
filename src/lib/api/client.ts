import "server-only";
import { unstable_rethrow } from "next/navigation";
import { serverEnv } from "@/lib/env";

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: { path: string; message: string }[];
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export class ApiRequestError extends Error {
  error: ApiError;
  constructor(error: ApiError) {
    super(`${error.code}: ${error.message}`);
    this.name = "ApiRequestError";
    this.error = error;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string;
  query?: Record<string, string | number | undefined>;
};

const NETWORK_ERROR: ApiError = {
  status: 0,
  code: "network_error",
  message: "Couldn't reach the server. Try again.",
};

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<ApiResult<T>> {
  const url = new URL(serverEnv().C2V_API_URL + path);
  for (const [key, value] of Object.entries(opts.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const hasBody = opts.body !== undefined;
  if (hasBody) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers,
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    unstable_rethrow(e);
    return { ok: false, error: { ...NETWORK_ERROR } };
  }

  if (res.status === 204) return { ok: true, data: undefined as T };

  if (res.ok) {
    try {
      return { ok: true, data: (await res.json()) as T };
    } catch {
      return { ok: false, error: { status: res.status, code: "internal", message: "Something went wrong. Try again." } };
    }
  }

  try {
    const body = (await res.json()) as { error?: { code?: unknown; message?: unknown; details?: ApiError["details"] } };
    const e = body.error;
    if (e && typeof e.code === "string" && typeof e.message === "string") {
      const error: ApiError = { status: res.status, code: e.code, message: e.message };
      if (e.details) error.details = e.details;
      return { ok: false, error };
    }
  } catch {
    // fall through to the generic error
  }
  return { ok: false, error: { status: res.status, code: "internal", message: "Something went wrong. Try again." } };
}
