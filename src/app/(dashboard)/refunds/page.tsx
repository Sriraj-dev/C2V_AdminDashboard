import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { RefundsList, getRefundsNeeded } from "@/features/orders";

export const metadata: Metadata = { title: "Refunds" };

export default async function Page() {
  const items = await getRefundsNeeded();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Refunds" actions={<RefreshButton />} />
      {items.length === 0 ? <EmptyState title="Nothing to refund." /> : <RefundsList items={items} />}
    </div>
  );
}
