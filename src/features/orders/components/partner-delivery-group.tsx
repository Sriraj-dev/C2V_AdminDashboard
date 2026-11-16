import { Phone } from "lucide-react";
import Link from "next/link";
import type { OrderView } from "@/lib/api/types";
import { formatPhone, telHref } from "@/lib/format";
import { buildShareText, type DeliveryGroups } from "../deliveries";
import { customerName } from "../utils";
import { ShareActions } from "./share-actions";
import { StatusBadge } from "./status-badge";

type Props = {
  group: DeliveryGroups["partners"][number];
  date: string;
  tenantName: string;
  link?: string;
};

export function PartnerDeliveryGroup({ group, date, tenantName, link }: Props) {
  const { partner, pincodes } = group;
  const orders: OrderView[] = pincodes.flatMap((p) => p.orders);
  const out = orders.filter((o) => o.status === "out_for_delivery").length;
  const text = buildShareText({ tenantName, partnerName: partner.name, date, orders, partnerLink: link });

  return (
    <section aria-label={partner.name} className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold">{partner.name}</h2>
          <p className="text-sm text-muted-foreground">
            {orders.length} {orders.length === 1 ? "order" : "orders"} · {out} out for delivery
          </p>
        </div>
        <a
          href={telHref(partner.phone)}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm underline-offset-2 hover:underline md:min-h-8"
        >
          <Phone className="size-4" aria-hidden />
          {formatPhone(partner.phone)}
        </a>
      </header>
      {pincodes.map(({ pincode, orders: list }) => (
        <div key={pincode}>
          <h3 className="mb-1 text-xs font-medium text-muted-foreground">{pincode}</h3>
          <ul className="flex flex-col gap-1">
            {list.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 text-sm hover:bg-muted/50 md:min-h-9"
                >
                  <span className="font-medium">{o.orderCode}</span>
                  <span className="min-w-0 flex-1 truncate">{customerName(o)}</span>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <ShareActions partnerId={partner.id} partnerPhone={partner.phone} date={date} text={text} link={link} />
    </section>
  );
}
