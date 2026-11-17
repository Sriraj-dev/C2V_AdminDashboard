import { z } from "zod";

const pincodeField = z
  .string()
  .transform((s) => s.replace(/\s/g, ""))
  .pipe(z.string().regex(/^[1-9]\d{5}$/, "Enter a 6-digit pincode"));

const weekdayField = z
  .number("Choose a weekday")
  .int("Choose a weekday")
  .min(0, "Choose a weekday")
  .max(6, "Choose a weekday");

const noteField = z
  .string()
  .trim()
  .max(120, "Use 120 characters or fewer")
  .transform((s) => (s === "" ? null : s));

export const pincodeFormSchema = z
  .object({
    pincode: pincodeField,
    deliveryWeekday: weekdayField,
    note: noteField,
    active: z.boolean(),
  })
  .strict();

/** The pincode itself can't change; add a new one. */
export const pincodeEditSchema = pincodeFormSchema.omit({ pincode: true }).strict();

export type PincodeFormInput = z.input<typeof pincodeFormSchema>;
export type PincodeFormValues = z.output<typeof pincodeFormSchema>;
export type PincodeEditInput = z.input<typeof pincodeEditSchema>;

/** Changed fields only. At least one is required. */
export const pincodePatchSchema = pincodeEditSchema
  .partial()
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Nothing to change" });

export const pincodeIdSchema = z.uuid();
