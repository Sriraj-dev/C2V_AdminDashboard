import "server-only";
import { adminRead } from "@/lib/api/admin";
import type { Partner } from "@/lib/api/types";
import type { PartnerRow } from "../types";
import { toPartnerRow } from "./row";

export async function getPartners(): Promise<PartnerRow[]> {
  const { items } = await adminRead<{ items: Partner[] }>("/admin/partners");
  return items.map(toPartnerRow);
}
