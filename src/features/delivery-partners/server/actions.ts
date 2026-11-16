"use server";

import { z } from "zod";
import {
  fromApiError,
  validationFailed,
  type ActionResult,
} from "@/lib/action-result";
import { adminWrite } from "@/lib/api/admin";
import type { Partner } from "@/lib/api/types";
import type { PartnerRow } from "../types";
import { toPartnerRow } from "./row";
import {
  partnerFormSchema,
  partnerIdSchema,
  partnerPatchSchema,
  type PartnerForm,
} from "../schemas";

type PartnerResult = ActionResult<{ partner: PartnerRow }>;

async function write(
  method: "POST" | "PATCH",
  path: string,
  body?: unknown,
): Promise<PartnerResult> {
  const init =
    method === "PATCH" ? { method, body } : body === undefined ? {} : { body };
  const result = await adminWrite<{ partner: Partner }>(path, init);
  if (!result.ok) return { ok: false, error: fromApiError(result.error) };
  return { ok: true, data: { partner: toPartnerRow(result.data.partner) } };
}

export async function createPartner(
  input: PartnerForm,
): Promise<PartnerResult> {
  const parsed = partnerFormSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: validationFailed(parsed.error) };
  return write("POST", "/admin/partners", parsed.data);
}

export async function updatePartner(
  id: string,
  input: Partial<PartnerForm>,
): Promise<PartnerResult> {
  const pid = partnerIdSchema.safeParse(id);
  if (!pid.success) return { ok: false, error: validationFailed(pid.error) };
  const parsed = partnerPatchSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: validationFailed(parsed.error) };
  return write("PATCH", `/admin/partners/${pid.data}`, parsed.data);
}

export async function setPartnerActive(
  id: string,
  active: boolean,
): Promise<PartnerResult> {
  const pid = partnerIdSchema.safeParse(id);
  if (!pid.success) return { ok: false, error: validationFailed(pid.error) };
  const act = z.boolean().safeParse(active);
  if (!act.success) return { ok: false, error: validationFailed(act.error) };
  return write("PATCH", `/admin/partners/${pid.data}`, { active: act.data });
}

export async function resetPartnerLink(id: string): Promise<PartnerResult> {
  const pid = partnerIdSchema.safeParse(id);
  if (!pid.success) return { ok: false, error: validationFailed(pid.error) };
  return write("POST", `/admin/partners/${pid.data}/reset-link`);
}
