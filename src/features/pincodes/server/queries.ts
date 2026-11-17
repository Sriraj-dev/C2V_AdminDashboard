import "server-only";
import { adminRead } from "@/lib/api/admin";
import type { Pincode } from "@/lib/api/types";

export async function getPincodes(): Promise<Pincode[]> {
  const { items } = await adminRead<{ items: Pincode[] }>("/admin/pincodes");
  return items;
}
