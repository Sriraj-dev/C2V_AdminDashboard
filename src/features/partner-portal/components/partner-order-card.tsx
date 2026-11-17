import { MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { PartnerOrderView } from "@/lib/api/types";
import { nearLandmark, telHref } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PartnerOrderActions } from "./partner-order-actions";

const STATUS: Record<"assigned" | "out_for_delivery", { label: string; className: string }> = {
  assigned: { label: "Assigned", className: "bg-status-accent-bg text-status-accent-fg" },
  out_for_delivery: { label: "Out for delivery", className: "bg-status-warning-bg text-status-warning-fg" },
};

export function PartnerOrderCard({ order, token }: { order: PartnerOrderView; token: string }) {
  const status = order.status;
  const badge = status === "assigned" || status === "out_for_delivery" ? STATUS[status] : null;
  const { address } = order;
  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium">{order.orderCode}</span>
        {badge && (
          <Badge variant="outline" className={cn("border-transparent", badge.className)}>
            {badge.label}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <p className="font-medium">{order.customerName}</p>
        <p className="break-words">{address.line1}</p>
        {address.landmark && <p className="break-words text-muted-foreground">{nearLandmark(address.landmark)}</p>}
        <p className="text-muted-foreground">{address.pincode}</p>
      </div>
      <ul className="text-sm">
        {order.items.map((i, idx) => (
          <li key={`${idx}-${i.name}`}>
            {i.name} × {i.quantity}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        {order.customerPhone ? (
          <a href={telHref(order.customerPhone)} className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}>
            <Phone aria-hidden="true" /> Call
          </a>
        ) : (
          <span />
        )}
        {order.mapUrl && (
          <a
            href={order.mapUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
          >
            <MapPin aria-hidden="true" /> Map
          </a>
        )}
      </div>
      <PartnerOrderActions token={token} orderId={order.id} orderCode={order.orderCode} status={status} />
    </article>
  );
}
