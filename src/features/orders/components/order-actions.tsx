"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import type { OrderView } from "@/lib/api/types";
import { markDelivered, markOutForDelivery } from "../server/actions";
import type { PartnerOption } from "../types";
import { availableActions } from "../utils";
import { AssignDialog } from "./assign-dialog";
import { CancelOrderFlow } from "./cancel-order-flow";
import { RefundButton } from "./refund-button";

const DELIVERED_WARNING = "Marked delivered, but the WhatsApp message to the customer failed. Let them know yourself.";

/** Renders only the actions that are valid for the order's current status. */
export function OrderActions({ order, partners }: { order: OrderView; partners: PartnerOption[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const busy = pending || refreshing;
  const actions = availableActions(order);

  async function run<T>(fn: () => Promise<ActionResult<T>>, onOk: (data: T) => void) {
    setPending(true);
    try {
      const r = await fn();
      if (r.ok) onOk(r.data);
      else toast.error(r.error.message);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    // Phones: sticky above the bottom nav (3.5rem + safe area). Desktop: a normal card. Hidden (not unmounted)
    // when there is nothing to do, so CancelOrderFlow keeps its refund prompt across the post-cancel refresh.
    <div
      hidden={actions.length === 0}
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap items-center gap-2 border-t bg-card p-3 md:static md:rounded-lg md:border md:p-4"
    >
      {actions.includes("assign") && <AssignDialog order={order} partners={partners} />}
      {actions.includes("reassign") && <AssignDialog order={order} partners={partners} reassign />}
      {actions.includes("out_for_delivery") && (
        <Button
          className="min-h-11 md:min-h-8"
          disabled={busy}
          onClick={() => run(() => markOutForDelivery(order.id), () => toast.success("Marked out for delivery."))}
        >
          Out for delivery
        </Button>
      )}
      {actions.includes("delivered") && (
        <Button
          className="min-h-11 md:min-h-8"
          disabled={busy}
          onClick={() =>
            run(
              () => markDelivered(order.id),
              (d) => (d.notified ? toast.success("Marked delivered.") : toast.warning(DELIVERED_WARNING)),
            )
          }
        >
          Delivered
        </Button>
      )}
      {actions.includes("refund") && <RefundButton order={order} />}
      <CancelOrderFlow order={order} canCancel={actions.includes("cancel")} />
    </div>
  );
}
