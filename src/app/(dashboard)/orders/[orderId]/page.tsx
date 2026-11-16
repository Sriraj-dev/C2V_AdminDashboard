import type { Metadata } from "next";
import { OrderDetail, getOrder, getPartnersForAssign } from "@/features/orders";

export const metadata: Metadata = { title: "Order" };

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const partnersP = getPartnersForAssign();
  partnersP.catch(() => undefined); // avoid an unhandled rejection if getOrder triggers notFound first
  const order = await getOrder(orderId);
  // Never pass access tokens to the client.
  const partners = (await partnersP).map(({ id, name, phone, active }) => ({ id, name, phone, active }));
  return <OrderDetail order={order} partners={partners} />;
}
