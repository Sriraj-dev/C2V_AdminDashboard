import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDeliveryDate } from "@/lib/dates";
import { formatPaise } from "@/lib/money";
import type { OrderView } from "@/lib/api/types";
import type { Selection } from "../types";
import { customerName, isAssignable } from "../utils";
import { StatusBadge } from "./status-badge";

export function OrderCard({ order, selection }: { order: OrderView; selection?: Selection }) {
  return (
    <li className="flex items-start gap-2">
      {selection && isAssignable(order) && (
        <Checkbox
          aria-label={`Select ${order.orderCode}`}
          className="mt-3.5 ml-1"
          checked={selection.selected.has(order.id)}
          onCheckedChange={() => selection.toggle(order.id)}
        />
      )}
      <Link
        href={`/orders/${order.id}`}
        className="block min-w-0 flex-1 rounded-lg border bg-card p-3 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{order.orderCode}</span>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 truncate">{customerName(order)}</p>
        <p className="text-muted-foreground">
          {formatDeliveryDate(order.deliveryDate)} · {order.pincode}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-muted-foreground">{order.partner?.name ?? "Unassigned"}</span>
          <span className="font-medium tabular-nums">{formatPaise(order.totalPaise)}</span>
        </div>
      </Link>
    </li>
  );
}
