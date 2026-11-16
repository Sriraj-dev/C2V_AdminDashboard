import Link from "next/link";
import { formatDeliveryDate } from "@/lib/dates";
import { formatPaise } from "@/lib/money";
import type { OrderView } from "@/lib/api/types";
import { customerName } from "../utils";
import { StatusBadge } from "./status-badge";

export function OrderCard({ order }: { order: OrderView }) {
  return (
    <li>
      <Link
        href={`/orders/${order.id}`}
        className="block rounded-lg border bg-card p-3 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
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
