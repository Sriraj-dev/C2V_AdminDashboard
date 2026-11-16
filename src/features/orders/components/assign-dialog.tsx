"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { OrderView } from "@/lib/api/types";
import { assignOrder } from "../server/actions";
import type { PartnerOption } from "../types";

type Props = {
  order: Pick<OrderView, "id" | "orderCode" | "partner">;
  partners: PartnerOption[];
  reassign?: boolean;
};

export function AssignDialog({ order, partners, reassign = false }: Props) {
  const router = useRouter();
  const currentId = order.partner?.id;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(reassign && currentId ? currentId : "");
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();

  const canSubmit = selected !== "" && !(reassign && selected === currentId) && !pending && !refreshing;

  async function submit() {
    setPending(true);
    try {
      const r = await assignOrder({ orderId: order.id, partnerId: selected });
      if (!r.ok) {
        toast.error(r.error.message);
      } else {
        const name = partners.find((p) => p.id === selected)?.name ?? "partner";
        toast.success(`Assigned to ${name}.`);
        setOpen(false);
      }
      startTransition(() => router.refresh());
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (next) setSelected(reassign && currentId ? currentId : "");
      }}
    >
      <DialogTrigger asChild>
        <Button className="min-h-11 md:min-h-8">{reassign ? "Reassign" : "Assign"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reassign ? "Reassign" : "Assign"} {order.orderCode}</DialogTitle>
          <DialogDescription>Choose the delivery partner.</DialogDescription>
        </DialogHeader>
        {partners.length === 0 ? (
          <p className="text-sm text-muted-foreground">No delivery partners yet. Add one under Partners.</p>
        ) : (
          <RadioGroup value={selected} onValueChange={setSelected} className="gap-1">
            {partners.map((p) => (
              <div key={p.id} className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-muted/50">
                <RadioGroupItem value={p.id} id={`partner-${p.id}`} disabled={!p.active} />
                <Label
                  htmlFor={`partner-${p.id}`}
                  className={p.active ? "flex-1 cursor-pointer" : "flex-1 text-muted-foreground"}
                >
                  {p.name}
                  {!p.active && " (inactive)"}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={submit}>
            {pending ? "Working…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
