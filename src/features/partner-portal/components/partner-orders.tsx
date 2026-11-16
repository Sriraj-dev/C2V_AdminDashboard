import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Badge } from "@/components/ui/badge";
import type { PartnerOrderView } from "@/lib/api/types";
import { formatDeliveryDate, todayInIST } from "@/lib/dates";
import { groupByDate } from "../utils";
import { PartnerOrderCard } from "./partner-order-card";

export function PartnerOrders({
  token,
  partnerName,
  orders,
}: {
  token: string;
  partnerName: string;
  orders: PartnerOrderView[];
}) {
  const groups = groupByDate(orders, todayInIST());
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="min-w-0 break-words text-lg font-semibold">Hi {partnerName}</h1>
        <RefreshButton />
      </div>
      {orders.length === 0 ? (
        <EmptyState title="No deliveries assigned to you right now." />
      ) : (
        groups.map((g) => (
          <section key={g.date} className="flex flex-col gap-2" aria-label={formatDeliveryDate(g.date)}>
            <h2 className="flex items-center gap-2 text-sm font-medium">
              {formatDeliveryDate(g.date)}
              {g.overdue && (
                <Badge variant="outline" className="border-transparent bg-status-danger-bg text-status-danger-fg">
                  Overdue
                </Badge>
              )}
            </h2>
            {g.orders.map((o) => (
              <PartnerOrderCard key={o.id} order={o} token={token} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}
