import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { formatPaise } from "@/lib/money";
import type { RefundNeededItem } from "@/lib/api/types";
import { REFUND_REASON_LABEL } from "../constants";
import { customerName } from "../utils";
import { RefundButton } from "./refund-button";

function ReasonBadge({ reason }: { reason: RefundNeededItem["refundReason"] }) {
  return (
    <Badge variant="outline" className="border-transparent bg-status-warning-bg text-status-warning-fg">
      {REFUND_REASON_LABEL[reason]}
    </Badge>
  );
}

function paidLabel(paidAt: string | null): string {
  return paidAt ? formatDateTime(paidAt) : "—";
}

/** Table at md and up, cards below. Server Component; only RefundButton is client. */
export function RefundsList({ items }: { items: RefundNeededItem[] }) {
  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Action</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">
                  <Link href={`/orders/${o.id}`} className="hover:underline focus-visible:underline">
                    {o.orderCode}
                  </Link>
                </TableCell>
                <TableCell>{customerName(o)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPaise(o.totalPaise)}</TableCell>
                <TableCell>{paidLabel(o.paidAt)}</TableCell>
                <TableCell>
                  <ReasonBadge reason={o.refundReason} />
                </TableCell>
                <TableCell className="text-right">
                  <RefundButton order={o} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-2 md:hidden">
        {items.map((o) => (
          <li key={o.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/orders/${o.id}`} className="font-medium hover:underline focus-visible:underline">
                {o.orderCode}
              </Link>
              <span className="font-medium tabular-nums">{formatPaise(o.totalPaise)}</span>
            </div>
            <p className="truncate">{customerName(o)}</p>
            <p className="text-muted-foreground">Paid {paidLabel(o.paidAt)}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ReasonBadge reason={o.refundReason} />
              <RefundButton order={o} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
