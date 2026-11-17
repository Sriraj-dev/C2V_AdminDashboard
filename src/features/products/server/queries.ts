import "server-only";
import { adminRead } from "@/lib/api/admin";
import type { Product } from "@/lib/api/types";

export async function getProducts(): Promise<Product[]> {
  const { items } = await adminRead<{ items: Product[] }>("/admin/products");
  return items;
}
