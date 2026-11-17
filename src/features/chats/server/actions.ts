"use server";

import { fromApiError, validationFailed, type ActionResult } from "@/lib/action-result";
import { adminWrite } from "@/lib/api/admin";
import type { ChatMessage } from "@/lib/api/types";
import { customerIdSchema, replySchema } from "../schemas";

export async function sendReply(
  customerId: string,
  input: { text: string },
): Promise<ActionResult<{ message: ChatMessage }>> {
  const id = customerIdSchema.safeParse(customerId);
  if (!id.success) return { ok: false, error: { code: "not_found", message: "Customer not found." } };
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };
  const result = await adminWrite<{ message: ChatMessage }>(`/admin/chats/${id.data}/reply`, {
    method: "POST",
    body: parsed.data,
  });
  if (!result.ok) return { ok: false, error: fromApiError(result.error) };
  return { ok: true, data: { message: result.data.message } };
}
