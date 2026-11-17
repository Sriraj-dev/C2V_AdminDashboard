"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { OrderView } from "@/lib/api/types";
import { formatPaise } from "@/lib/money";
import { refundOrder } from "../server/actions";

export function RefundButton({ order }: { order: Pick<OrderView, "id" | "orderCode" | "totalPaise"> }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  async function onConfirm() {
    const r = await refundOrder(order.id);
    if (!r.ok) {
      toast.error(r.error.message);
    } else {
      toast.success(r.data.result === "already_refunded" ? "This order was already refunded." : "Refund issued.");
    }
    startTransition(() => router.refresh());
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" className="min-h-11 md:min-h-8" disabled={refreshing}>
          Refund
        </Button>
      }
      title={`Refund ${formatPaise(order.totalPaise)} for ${order.orderCode}?`}
      description="The full amount goes back through Cashfree. The customer is not notified."
      confirmLabel="Refund"
      destructive
      onConfirm={onConfirm}
    />
  );
}
