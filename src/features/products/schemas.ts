import { z } from "zod";
import { rupeesToPaise } from "@/lib/money";

export const MAX_ACTIVE_PRODUCTS = 8;

const PRICE_ERROR = "Enter a price like 90 or 12.50";

const priceField = z
  .string()
  .trim()
  .transform((s, ctx) => {
    const paise = rupeesToPaise(s);
    if (paise === null || paise < 1 || paise > 10_000_000) {
      ctx.addIssue({ code: "custom", message: PRICE_ERROR });
      return z.NEVER;
    }
    return paise;
  });

/** Blank means "let the server put it last". */
const sortOrderField = z
  .string()
  .trim()
  .transform((s, ctx) => {
    if (s === "") return undefined;
    const n = Number(s);
    if (!/^-?\d+$/.test(s) || Math.abs(n) > 1_000_000) {
      ctx.addIssue({ code: "custom", message: "Enter a whole number up to 1,000,000" });
      return z.NEVER;
    }
    return n;
  });

export const productFormSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{1,40}$/, "Use up to 40 letters, numbers, - or _"),
    name: z.string().trim().min(1, "Enter a name").max(60, "Use 60 characters or fewer"),
    price: priceField,
    sortOrder: sortOrderField,
    active: z.boolean(),
  })
  .strict();

/** What the form holds (price and sort order are text). */
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

/** Changed fields only. At least one is required. */
export const productPatchSchema = productFormSchema
  .partial()
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Nothing to change" });

export const productIdSchema = z.uuid();
