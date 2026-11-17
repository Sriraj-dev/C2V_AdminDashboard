import type { ActionError } from "./action-result";

/**
 * Puts an action's field errors on the matching form fields (react-hook-form `setError`).
 * Returns the message to show above the form: the error's message when there are no field errors,
 * the first field error that matches no field, or null when every field error landed on a field.
 */
export function applyFieldErrors<F extends string>(
  error: ActionError,
  fields: readonly F[],
  setError: (field: F, error: { type: string; message: string }) => void,
): string | null {
  const entries = Object.entries(error.fieldErrors ?? {});
  if (entries.length === 0) return error.message;
  let unmatched: string | null = null;
  for (const [field, message] of entries) {
    if ((fields as readonly string[]).includes(field)) setError(field as F, { type: "server", message });
    else unmatched ??= message;
  }
  return unmatched;
}
