"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { OrderView } from "@/lib/api/types";
import { formatPaise } from "@/lib/money";
import { cancelOrder, refundOrder } from "../server/actions";

type FlowOrder = Pick<OrderView, "id" | "orderCode" | "totalPaise" | "source">;

const REFUND_DESCRIPTION = "The full amount goes back through Cashfree. The customer is not notified.";

/**
 * Cancel confirm, then (for a paid order) the "Refund now?" prompt. Keep this mounted even after the
 * order stops being cancellable: the refund prompt must survive the refresh that follows the cancel.
 */
export function CancelOrderFlow({ order, canCancel }: { order: FlowOrder; canCancel: boolean }) {
  const router = useRouter();
  const [refundOpen, setRefundOpen] = useState(false);

  async function onCancel() {
    const r = await cancelOrder(order.id);
    if (!r.ok) {
      toast.error(r.error.message);
      router.refresh();
      return;
    }
    toast.success("Order cancelled.");
    if (r.data.order.paymentStatus === "paid" && order.source === "one_time") setRefundOpen(true);
    router.refresh();
  }

  async function onRefund() {
    const r = await refundOrder(order.id);
    if (!r.ok) {
      toast.error(r.error.message);
      router.refresh();
      return;
    }
    toast.success(r.data.result === "already_refunded" ? "This order was already refunded." : "Refund issued.");
    router.refresh();
  }

  return (
    <>
      {canCancel && (
        <ConfirmDialog
          trigger={
            <Button variant="outline" className="min-h-11 md:min-h-8">
              Cancel order
            </Button>
          }
          title={`Cancel order ${order.orderCode}?`}
          description="This only changes the status. No money is returned and the customer is not notified."
          confirmLabel="Cancel order"
          destructive
          onConfirm={onCancel}
        />
      )}
      <ConfirmDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        title={`Refund ${formatPaise(order.totalPaise)} now?`}
        description={REFUND_DESCRIPTION}
        confirmLabel="Refund"
        destructive
        onConfirm={onRefund}
      />
    </>
  );
}
