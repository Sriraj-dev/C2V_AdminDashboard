import { formatDateTime } from "@/lib/dates";
import type { OrderView } from "@/lib/api/types";

export function OrderTimeline({ order }: { order: Pick<OrderView, "createdAt" | "paidAt" | "deliveredAt"> }) {
  const steps = [
    { label: "Ordered", at: order.createdAt },
    { label: "Paid", at: order.paidAt },
    { label: "Delivered", at: order.deliveredAt },
  ].filter((s): s is { label: string; at: string } => Boolean(s.at));
  return (
    <ol className="flex flex-col gap-1 text-sm">
      {steps.map((s) => (
        <li key={s.label} className="flex justify-between gap-3">
          <span className="text-muted-foreground">{s.label}</span>
          <span className="tabular-nums">{formatDateTime(s.at)}</span>
        </li>
      ))}
    </ol>
  );
}
