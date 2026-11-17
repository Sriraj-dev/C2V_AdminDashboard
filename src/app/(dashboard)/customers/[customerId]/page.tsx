import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { CustomerProfile, displayName, getCustomer } from "@/features/customers";
import { OrderList } from "@/features/orders";

export const metadata: Metadata = { title: "Customer" };

export default async function Page({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  const { customer, orders } = await getCustomer(customerId);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={displayName(customer)} actions={<RefreshButton />} />
      <CustomerProfile customer={customer} />
      <h2 className="text-sm font-semibold">Recent orders</h2>
      {orders.length === 0 ? <EmptyState title="No orders yet." /> : <OrderList orders={orders} />}
    </div>
  );
}
