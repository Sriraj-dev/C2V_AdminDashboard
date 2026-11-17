"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { setPartnerActive } from "../server/actions";
import type { PartnerRow } from "../types";

export function PartnerStatusToggle({ partner }: { partner: PartnerRow }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acting, startTransition] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const pending = acting || refreshing;
  const className = "min-h-11 md:min-h-8";

  async function run(active: boolean) {
    const r = await setPartnerActive(partner.id, active);
    if (r.ok)
      toast.success(
        active
          ? `${partner.name} is active again.`
          : `${partner.name} is deactivated.`,
      );
    else toast.error(r.error.message);
    startRefresh(() => router.refresh());
  }

  /** Direct-click path: ConfirmDialog has its own error handling, this one needs it here. */
  function runDirect(active: boolean) {
    startTransition(async () => {
      try {
        await run(active);
      } catch {
        toast.error("Something went wrong. Try again.");
      }
    });
  }

  if (!partner.active) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        disabled={pending}
        onClick={() => runDirect(true)}
      >
        {pending ? "Saving…" : "Activate"}
      </Button>
    );
  }

  const n = partner.openOrderCount;
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        disabled={pending}
        onClick={() => (n > 0 ? setConfirmOpen(true) : runDirect(false))}
      >
        {pending ? "Saving…" : "Deactivate"}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Deactivate ${partner.name}?`}
        description={`${partner.name} still has ${n} open ${n === 1 ? "order" : "orders"}. They stay assigned; reassign them from Deliveries.`}
        confirmLabel="Deactivate"
        destructive
        onConfirm={() => run(false)}
      />
    </>
  );
}
