"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { partnerDelivered, partnerOutForDelivery } from "../server/actions";

const DELIVERED_WARNING =
  "Marked delivered, but the WhatsApp message to the customer failed. Let the shop know.";

type Props = { token: string; orderId: string; orderCode: string; status: string };

export function PartnerOrderActions({ token, orderId, orderCode, status }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acting, startTransition] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const [delivering, setDelivering] = useState(false);
  const pending = acting || refreshing || delivering;

  async function run<T>(fn: () => Promise<ActionResult<T>>, onOk: (data: T) => void) {
    const r = await fn();
    if (r.ok) onOk(r.data);
    else toast.error(r.error.message);
    startRefresh(() => router.refresh());
  }

  function outForDelivery() {
    startTransition(async () => {
      try {
        await run(
          () => partnerOutForDelivery(token, orderId),
          () => toast.success("Marked out for delivery."),
        );
      } catch {
        toast.error("Something went wrong. Try again.");
      }
    });
  }

  async function delivered() {
    setDelivering(true);
    try {
      await run(
        () => partnerDelivered(token, orderId),
        (d) => (d.notified ? toast.success("Marked delivered.") : toast.warning(DELIVERED_WARNING)),
      );
    } finally {
      setDelivering(false);
    }
  }

  if (status === "assigned") {
    return (
      <Button className="min-h-11 w-full" disabled={pending} onClick={outForDelivery}>
        {pending ? "Saving…" : "Out for delivery"}
      </Button>
    );
  }
  if (status !== "out_for_delivery") return null;
  return (
    <>
      <Button className="min-h-11 w-full" disabled={pending} onClick={() => setConfirmOpen(true)}>
        Delivered
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Mark ${orderCode} delivered?`}
        description="The customer gets a WhatsApp message."
        confirmLabel="Delivered"
        onConfirm={delivered}
      />
    </>
  );
}
