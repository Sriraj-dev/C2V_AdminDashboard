import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDeliveryDate } from "@/lib/dates";
import { formatPaise } from "@/lib/money";
import type { OrderView } from "@/lib/api/types";
import type { Selection } from "../types";
import { customerName, isAssignable } from "../utils";
import { StatusBadge } from "./status-badge";

export function OrderTable({
  orders,
  selection,
  allSelected = false,
  onToggleAll,
}: {
  orders: OrderView[];
  selection?: Selection;
  allSelected?: boolean;
  onToggleAll?: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {selection && (
              <TableHead className="w-8">
                <Checkbox aria-label="Select all" checked={allSelected} onCheckedChange={() => onToggleAll?.()} />
              </TableHead>
            )}
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Pincode</TableHead>
            <TableHead>Partner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              {selection && (
                <TableCell>
                  {isAssignable(o) && (
                    <Checkbox
                      aria-label={`Select ${o.orderCode}`}
                      checked={selection.selected.has(o.id)}
                      onCheckedChange={() => selection.toggle(o.id)}
                    />
                  )}
                </TableCell>
              )}
              <TableCell className="font-medium">
                <Link href={`/orders/${o.id}`} className="hover:underline focus-visible:underline">
                  {o.orderCode}
                </Link>
              </TableCell>
              <TableCell>{customerName(o)}</TableCell>
              <TableCell>{formatDeliveryDate(o.deliveryDate)}</TableCell>
              <TableCell>{o.pincode}</TableCell>
              <TableCell className={o.partner ? "" : "text-muted-foreground"}>{o.partner?.name ?? "Unassigned"}</TableCell>
              <TableCell>
                <StatusBadge status={o.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatPaise(o.totalPaise)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
