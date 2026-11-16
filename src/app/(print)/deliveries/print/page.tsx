import type { Metadata } from "next";
import { z } from "zod";
import { isValidYmd } from "@/lib/dates";
import { getCurrentUser } from "@/features/auth";
import { PrintSheet, byCode, getActiveOrders } from "@/features/orders";

export const metadata: Metadata = { title: "Print deliveries", robots: { index: false } };

const paramsSchema = z.object({
  date: z.string().refine(isValidYmd),
  partnerId: z.uuid(),
});

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parsed = paramsSchema.safeParse(await searchParams);
  const [user, orders] = await Promise.all([getCurrentUser(), getActiveOrders()]);
  const list = parsed.success
    ? orders
        .filter((o) => o.deliveryDate === parsed.data.date && o.partner?.id === parsed.data.partnerId)
        .sort((a, b) => a.pincode.localeCompare(b.pincode) || byCode(a, b))
    : [];
  const partner = list[0]?.partner;
  if (!parsed.success || !partner) {
    return <p className="p-6 text-sm">No deliveries for this partner on this date.</p>;
  }
  return <PrintSheet tenantName={user.tenantName} partnerName={partner.name} date={parsed.data.date} orders={list} />;
}
