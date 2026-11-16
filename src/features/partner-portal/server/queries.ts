import "server-only";
import { notFound } from "next/navigation";
import { partnerRead } from "@/lib/api/partner";
import type { PartnerOrderView } from "@/lib/api/types";
import { TOKEN_RE } from "../utils";

export async function getPartnerOrders(
  token: string,
): Promise<{ partner: { name: string }; items: PartnerOrderView[] }> {
  if (!TOKEN_RE.test(token)) notFound();
  return partnerRead(token, "/orders");
}
