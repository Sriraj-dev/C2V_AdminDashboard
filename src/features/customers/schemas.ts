import { z } from "zod";

/** URL search params: invalid values are dropped (never fail), unknown keys are ignored. */
export const customerParamsSchema = z.object({
  q: z.preprocess((v) => {
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t.length > 0 && t.length <= 100 ? t : undefined;
  }, z.string().optional()),
  page: z.preprocess((v) => {
    const n = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : 1;
    return Number.isSafeInteger(n) && n >= 1 ? n : 1;
  }, z.number().int().min(1)),
});
export type CustomerParams = z.infer<typeof customerParamsSchema>;
