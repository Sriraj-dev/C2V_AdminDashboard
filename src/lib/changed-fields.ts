/** Only the fields whose value differs from the saved record. */
export function changedFields<T extends Record<string, unknown>>(
  saved: T,
  values: T,
): Partial<T> {
  const changed: Partial<T> = {};
  for (const key of Object.keys(values) as (keyof T)[]) {
    if (values[key] !== saved[key]) changed[key] = values[key];
  }
  return changed;
}
