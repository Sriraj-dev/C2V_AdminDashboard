"use server";

import { z } from "zod";
import { fromApiError, type ActionResult } from "@/lib/action-result";
import { partnerWrite } from "@/lib/api/partner";
import type { PartnerOrderView } from "@/lib/api/types";
import { NOT_ACTIVE_MESSAGE, NO_LONGER_ASSIGNED_MESSAGE, TOKEN_RE } from "../utils";

const orderIdSchema = z.uuid();

/** Validates input, then posts. The token is never logged and only ever goes in the request path. */
async function run<T>(token: string, orderId: string, suffix: string): Promise<ActionResult<T>> {
  if (!TOKEN_RE.test(token)) return { ok: false, error: { code: "not_found", message: NOT_ACTIVE_MESSAGE } };
  const id = orderIdSchema.safeParse(orderId);
  if (!id.success) return { ok: false, error: { code: "validation_error", message: NO_LONGER_ASSIGNED_MESSAGE } };
  const result = await partnerWrite<T>(token, `/orders/${id.data}/${suffix}`);
  if (result.ok) return { ok: true, data: result.data };
  if (result.error.status === 404) {
    return { ok: false, error: { code: "not_found", message: NO_LONGER_ASSIGNED_MESSAGE } };
  }
  return { ok: false, error: fromApiError(result.error) };
}

export async function partnerOutForDelivery(
  token: string,
  orderId: string,
): Promise<ActionResult<{ order: PartnerOrderView }>> {
  return run(token, orderId, "out-for-delivery");
}

export async function partnerDelivered(
  token: string,
  orderId: string,
): Promise<ActionResult<{ order: PartnerOrderView; notified: boolean }>> {
  return run(token, orderId, "delivered");
}
