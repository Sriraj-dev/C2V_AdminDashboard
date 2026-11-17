import { z } from "zod";
import { rupeesToPaise } from "@/lib/money";

const MONEY_ERROR = "Enter an amount like 40 or 40.50 (up to 1,00,000)";

const moneyField = z
  .string()
  .trim()
  .transform((s, ctx) => {
    const paise = rupeesToPaise(s);
    if (paise === null || paise > 10_000_000) {
      ctx.addIssue({ code: "custom", message: MONEY_ERROR });
      return z.NEVER;
    }
    return paise;
  });

/** Empty clears the phone. Otherwise an Indian mobile, saved as 91XXXXXXXXXX. */
const phoneField = z
  .string()
  .trim()
  .transform((s, ctx) => {
    if (s === "") return null;
    const stripped = s.replace(/[\s-]/g, "");
    if (!/^(\+?91)?[6-9]\d{9}$/.test(stripped)) {
      ctx.addIssue({ code: "custom", message: "Enter a 10-digit mobile number" });
      return z.NEVER;
    }
    return `91${stripped.slice(-10)}`;
  });

/** Empty clears the image. Otherwise an https URL up to 2000 characters. */
const imageField = z
  .string()
  .trim()
  .transform((s, ctx) => {
    if (s === "") return null;
    let ok = s.length <= 2000;
    if (ok) {
      try {
        ok = new URL(s).protocol === "https:";
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      ctx.addIssue({ code: "custom", message: "Enter an https link up to 2000 characters" });
      return z.NEVER;
    }
    return s;
  });

export const settingsFormSchema = z
  .object({
    supportPhone: phoneField,
    welcomeImageUrl: imageField,
    deliveryFee: moneyField,
    minOrder: moneyField,
  })
  .strict();

/** What the form holds: all text (fees in rupees). */
export type SettingsFormInput = z.input<typeof settingsFormSchema>;
export type SettingsFormValues = z.output<typeof settingsFormSchema>;

/** Changed fields only. At least one is required. */
export const settingsPatchSchema = settingsFormSchema
  .partial()
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Nothing to change" });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(1000, "Too long"),
    newPassword: z
      .string()
      .min(10, "Use at least 10 characters")
      .max(128, "Use 128 characters or fewer"),
    confirmPassword: z.string(),
  })
  .strict()
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
