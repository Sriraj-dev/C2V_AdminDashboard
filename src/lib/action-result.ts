import type { z } from "zod";
import type { ApiError } from "./api/client";

export type ActionError = { code: string; message: string; fieldErrors?: Record<string, string> };
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function fromApiError(e: ApiError): ActionError {
  const error: ActionError = { code: e.code, message: e.message };
  if (e.details?.length) {
    const fieldErrors: Record<string, string> = {};
    for (const d of e.details) fieldErrors[d.path] ??= d.message;
    error.fieldErrors = fieldErrors;
  }
  return error;
}

export function validationFailed(e: z.ZodError): ActionError {
  const fieldErrors: Record<string, string> = {};
  for (const issue of e.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
  return { code: "validation_error", message: "Check the highlighted fields.", fieldErrors };
}
