import { z } from "zod";
import type { OrderStatus } from "@/lib/api/types";
import { ALL_STATUSES } from "./constants";

/** URL search param schemas: invalid values are dropped (never fail), unknown keys are ignored. */

function lenient<T extends z.ZodType>(schema: T) {
  return z.preprocess((v) => (schema.safeParse(v).success ? v : undefined), schema.optional());
}

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const pincode = z.string().regex(/^\d{6}$/);
const query = z.string().max(100);

export const activeFiltersSchema = z.object({
  date: lenient(ymd),
  pincode: lenient(pincode),
  partnerId: lenient(z.union([z.uuid(), z.literal("unassigned")])),
  q: lenient(query),
});
export type ActiveFilters = z.infer<typeof activeFiltersSchema>;

const statusList = z.preprocess(
  (v) => {
    if (typeof v !== "string") return undefined;
    const valid = v.split(",").filter((s): s is OrderStatus => (ALL_STATUSES as readonly string[]).includes(s));
    return valid.length > 0 ? valid : undefined;
  },
  z.array(z.custom<OrderStatus>()).optional(),
);

export const historyParamsSchema = z.object({
  status: statusList,
  deliveryFrom: lenient(ymd),
  deliveryTo: lenient(ymd),
  pincode: lenient(pincode),
  partnerId: lenient(z.uuid()),
  q: lenient(query),
  includeUnpaid: z.preprocess((v) => v === "1", z.boolean()),
  page: z.preprocess((v) => {
    const n = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : 1;
    return Number.isSafeInteger(n) && n >= 1 ? n : 1;
  }, z.number().int().min(1)),
});
export type HistoryParams = z.infer<typeof historyParamsSchema>;

/** Server Action inputs. Strict so unexpected keys (e.g. a tenant id) are rejected. */
export const orderIdSchema = z.uuid();
export const assignInputSchema = z.strictObject({ orderId: z.uuid(), partnerId: z.uuid() });
export const bulkAssignInputSchema = z.strictObject({
  orderIds: z.array(z.uuid()).min(1).max(100),
  partnerId: z.uuid(),
});
