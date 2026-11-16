import type { Metadata } from "next";
import { getPartnerOrders, PartnerOrders } from "@/features/partner-portal";

export const metadata: Metadata = { title: "Deliveries", robots: { index: false, follow: false } };

export default async function PartnerPage({ params }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const { partner, items } = await getPartnerOrders(token);
  return <PartnerOrders token={token} partnerName={partner.name} orders={items} />;
}
