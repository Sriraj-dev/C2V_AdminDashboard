"use server";

import { revalidatePath } from "next/cache";
import { fromApiError, validationFailed, type ActionResult } from "@/lib/action-result";
import { adminWrite } from "@/lib/api/admin";
import type { BulkResult, OrderView } from "@/lib/api/types";
import { assignInputSchema, bulkAssignInputSchema, orderIdSchema } from "../schemas";

/** Runs one validated write; revalidates the whole dashboard (nav counts, lists) on success. */
async function write<T>(path: string, body?: unknown): Promise<ActionResult<T>> {
  const result = await adminWrite<T>(path, body === undefined ? {} : { body });
  if (!result.ok) return { ok: false, error: fromApiError(result.error) };
  revalidatePath("/", "layout");
  return { ok: true, data: result.data };
}

export async function assignOrder(input: {
  orderId: string;
  partnerId: string;
}): Promise<ActionResult<{ order: OrderView }>> {
  const parsed = assignInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };
  const { orderId, partnerId } = parsed.data;
  return write(`/admin/orders/${orderId}/assign`, { partnerId });
}

async function simpleAction<T>(orderId: string, suffix: string): Promise<ActionResult<T>> {
  const parsed = orderIdSchema.safeParse(orderId);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };
  return write(`/admin/orders/${parsed.data}/${suffix}`);
}

export async function markOutForDelivery(orderId: string): Promise<ActionResult<{ order: OrderView }>> {
  return simpleAction(orderId, "out-for-delivery");
}

export async function markDelivered(orderId: string): Promise<ActionResult<{ order: OrderView; notified: boolean }>> {
  return simpleAction(orderId, "delivered");
}

export async function cancelOrder(orderId: string): Promise<ActionResult<{ order: OrderView }>> {
  return simpleAction(orderId, "cancel");
}

export async function refundOrder(
  orderId: string,
): Promise<ActionResult<{ result: "refunded" | "already_refunded"; order: OrderView }>> {
  return simpleAction(orderId, "refund");
}

export async function bulkAssign(input: {
  orderIds: string[];
  partnerId: string;
}): Promise<ActionResult<{ assigned: number; failed: { orderId: string; message: string }[] }>> {
  const parsed = bulkAssignInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };
  const res = await write<{ results: BulkResult[] }>("/admin/orders/bulk-assign", parsed.data);
  if (!res.ok) return res;
  const failed: { orderId: string; message: string }[] = [];
  let assigned = 0;
  for (const r of res.data.results) {
    if (r.ok) assigned += 1;
    else failed.push({ orderId: r.orderId, message: r.error.message });
  }
  return { ok: true, data: { assigned, failed } };
}
