import { z } from "zod";

const phoneField = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+?91)?[6-9]\d{9}$/, "Enter a 10-digit mobile number"));

export const partnerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name").max(60, "Use 60 characters or fewer"),
    phone: phoneField,
  })
  .strict();

export type PartnerForm = z.infer<typeof partnerFormSchema>;

/** Changed fields only. At least one is required. */
export const partnerPatchSchema = partnerFormSchema
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to change" });

export const partnerIdSchema = z.uuid();
