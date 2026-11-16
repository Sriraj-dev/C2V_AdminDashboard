"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bulkAssign } from "../server/actions";
import type { PartnerOption } from "../types";

const MAX_BULK = 100;

type Props = {
  /** Selected order ids, with their codes for failure messages. */
  selected: { id: string; orderCode: string }[];
  partners: PartnerOption[];
  onDone: () => void;
};

/** Sticky bar shown when at least one order is selected. Sits above the bottom nav on phones. */
export function BulkAssignBar({ selected, partners, onDone }: Props) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState("");
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const tooMany = selected.length > MAX_BULK;
  const active = partners.filter((p) => p.active);

  async function submit() {
    setPending(true);
    try {
      const r = await bulkAssign({ orderIds: selected.map((s) => s.id), partnerId });
      if (!r.ok) {
        toast.error(r.error.message);
      } else {
        if (r.data.assigned > 0) toast.success(`${r.data.assigned} assigned`);
        if (r.data.failed.length > 0) {
          const codes = new Map(selected.map((s) => [s.id, s.orderCode]));
          toast.error(
            `Could not assign ${r.data.failed.length}: ` +
              r.data.failed.map((f) => `${codes.get(f.orderId) ?? f.orderId} (${f.message})`).join("; "),
          );
        }
        onDone();
      }
      startTransition(() => router.refresh());
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      role="region"
      aria-label="Bulk assign"
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap items-center gap-2 border-t bg-card p-3 md:sticky md:bottom-4 md:mt-2 md:rounded-lg md:border md:shadow-sm"
    >
      <Select value={partnerId} onValueChange={setPartnerId} disabled={pending}>
        <SelectTrigger aria-label="Partner" className="min-w-0 flex-1 sm:w-56 sm:flex-none">
          <SelectValue placeholder="Choose partner" />
        </SelectTrigger>
        <SelectContent>
          {active.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="min-h-11 md:min-h-8" disabled={!partnerId || pending || refreshing || tooMany} onClick={submit}>
        {pending ? "Working…" : `Assign ${selected.length}`}
      </Button>
      {tooMany && <p className="w-full text-sm text-destructive">Select up to 100 orders at a time.</p>}
    </div>
  );
}
