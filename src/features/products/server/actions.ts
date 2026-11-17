"use server";

import { z } from "zod";
import { fromApiError, validationFailed, type ActionResult } from "@/lib/action-result";
import { adminWrite } from "@/lib/api/admin";
import type { Product } from "@/lib/api/types";
import {
  productFormSchema,
  productIdSchema,
  productPatchSchema,
  type ProductFormInput,
} from "../schemas";

type ProductResult = ActionResult<{ product: Product }>;

/** Form field `price` is sent to the API as `pricePaise`. */
function toBody(v: {
  sku?: string;
  name?: string;
  price?: number;
  sortOrder?: number;
  active?: boolean;
}) {
  const { price, ...rest } = v;
  return price === undefined ? rest : { ...rest, pricePaise: price };
}

async function write(method: "POST" | "PATCH", path: string, body: unknown): Promise<ProductResult> {
  const result = await adminWrite<{ product: Product }>(path, { method, body });
  if (!result.ok) {
    const error = fromApiError(result.error);
    if (error.fieldErrors?.pricePaise) {
      const { pricePaise, ...rest } = error.fieldErrors;
      error.fieldErrors = { ...rest, price: pricePaise };
    }
    return { ok: false, error };
  }
  return { ok: true, data: { product: result.data.product } };
}

export async function createProduct(input: ProductFormInput): Promise<ProductResult> {
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };
  return write("POST", "/admin/products", toBody(parsed.data));
}

export async function updateProduct(
  id: string,
  input: Partial<ProductFormInput>,
): Promise<ProductResult> {
  const pid = productIdSchema.safeParse(id);
  if (!pid.success) return { ok: false, error: validationFailed(pid.error) };
  const parsed = productPatchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationFailed(parsed.error) };
  return write("PATCH", `/admin/products/${pid.data}`, toBody(parsed.data));
}

export async function setProductActive(id: string, active: boolean): Promise<ProductResult> {
  const pid = productIdSchema.safeParse(id);
  if (!pid.success) return { ok: false, error: validationFailed(pid.error) };
  const act = z.boolean().safeParse(active);
  if (!act.success) return { ok: false, error: validationFailed(act.error) };
  return write("PATCH", `/admin/products/${pid.data}`, { active: act.data });
}
