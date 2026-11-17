import { changedFields } from "@/lib/changed-fields";
import { paiseToRupeesInput, rupeesToPaise } from "@/lib/money";
import type { Product } from "@/lib/api/types";
import type { ProductFormInput } from "./schemas";

export function productToFormInput(p: Product): ProductFormInput {
  return {
    sku: p.sku,
    name: p.name,
    price: paiseToRupeesInput(p.pricePaise),
    sortOrder: String(p.sortOrder),
    active: p.active,
  };
}

/** Only the fields that differ from the saved product (SKUs are stored upper-case; a blank sort order means unchanged). */
export function productChanges(product: Product, values: ProductFormInput): Partial<ProductFormInput> {
  const saved = productToFormInput(product);
  const paise = rupeesToPaise(values.price);
  const normalized: ProductFormInput = {
    sku: values.sku.trim().toUpperCase(),
    name: values.name.trim(),
    price: paise === null ? values.price : paiseToRupeesInput(paise),
    sortOrder: values.sortOrder.trim() === "" ? saved.sortOrder : values.sortOrder.trim(),
    active: values.active,
  };
  return changedFields(saved, normalized);
}
