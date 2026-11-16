import { EmptyState } from "@/components/shared/empty-state";
import type { OrderView } from "@/lib/api/types";
import { deliveryDates, groupDeliveries } from "../deliveries";
import type { PartnerOption } from "../types";
import { DeliveryDatePicker } from "./delivery-date-picker";
import { PartnerDeliveryGroup } from "./partner-delivery-group";
import { UnassignedGroup } from "./unassigned-group";

type Props = {
  orders: OrderView[];
  date: string;
  today: string;
  tenantName: string;
  partners: PartnerOption[];
  /** partnerId -> private link. Each group receives only its own. */
  links: Record<string, string>;
};

export function DeliveriesBoard({ orders, date, today, tenantName, partners, links }: Props) {
  if (orders.length === 0) return <EmptyState title="No open deliveries." />;
  const counts = new Map<string, number>();
  for (const o of orders) counts.set(o.deliveryDate, (counts.get(o.deliveryDate) ?? 0) + 1);
  const chips = deliveryDates(orders).map((d) => ({ date: d, count: counts.get(d) ?? 0 }));
  const groups = groupDeliveries(orders, date);
  const empty = groups.unassigned.length === 0 && groups.partners.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <DeliveryDatePicker dates={chips} selected={date} today={today} />
      {empty && <EmptyState title="No deliveries on this date." />}
      {groups.unassigned.length > 0 && <UnassignedGroup orders={groups.unassigned} partners={partners} />}
      {groups.partners.map((g) => (
        <PartnerDeliveryGroup
          key={g.partner.id}
          group={g}
          date={date}
          tenantName={tenantName}
          link={links[g.partner.id]}
        />
      ))}
    </div>
  );
}
