import { changedFields } from "@/lib/changed-fields";
import type { Pincode } from "@/lib/api/types";
import type { PincodeEditInput } from "./schemas";

/** Only the editable fields that differ from the saved pincode. Never includes `pincode`, whatever `values` holds. */
export function pincodeChanges(
  saved: Pincode,
  values: PincodeEditInput,
): Partial<PincodeEditInput> {
  const before: PincodeEditInput = {
    deliveryWeekday: saved.deliveryWeekday,
    note: saved.note ?? "",
    active: saved.active,
  };
  const after: PincodeEditInput = {
    deliveryWeekday: values.deliveryWeekday,
    note: values.note.trim(),
    active: values.active,
  };
  return changedFields(before, after);
}
