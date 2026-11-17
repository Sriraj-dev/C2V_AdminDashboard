"use server";

import { z } from "zod";
import { fromApiError, validationFailed, type ActionResult } from "@/lib/action-result";
import { adminWrite } from "@/lib/api/admin";
import type { Pincode } from "@/lib/api/types";
import {
  pincodeFormSchema,
  pincodeIdSchema,
  pincodePatchSchema,
  type PincodeEditInput,
  type PincodeFormInput,
} from "../schemas";

type PincodeResult = ActionResult<{ pincode: Pincode }>;

async function write(method: "POST" | "PATCH", path: string, body: unknown): Promise<PincodeResult> {
  const result = await adminWrite<{ pincode: Pincode }>(path, { method, body });
  if (!result.ok) return { ok: false, error: fromApiError(result.error) };
  return { ok: true, data: { pincode: result.data.pincode } };
}

export async function createPincode(input: PincodeFormInput): Promise<PincodeResult> {
  const parsed = pincodeFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };
  return write("POST", "/admin/pincodes", parsed.data);
}

/** Never sends `pincode`: the schema is strict, so a stray key is rejected. */
export async function updatePincode(
  id: string,
  input: Partial<PincodeEditInput>,
): Promise<PincodeResult> {
  const pid = pincodeIdSchema.safeParse(id);
  if (!pid.success) return { ok: false, error: validationFailed(pid.error) };
  const parsed = pincodePatchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };
  return write("PATCH", `/admin/pincodes/${pid.data}`, parsed.data);
}

export async function setPincodeActive(id: string, active: boolean): Promise<PincodeResult> {
  const pid = pincodeIdSchema.safeParse(id);
  if (!pid.success) return { ok: false, error: validationFailed(pid.error) };
  const act = z.boolean().safeParse(active);
  if (!act.success) return { ok: false, error: validationFailed(act.error) };
  return write("PATCH", `/admin/pincodes/${pid.data}`, { active: act.data });
}
