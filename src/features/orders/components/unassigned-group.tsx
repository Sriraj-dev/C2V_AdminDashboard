"use client";

import Link from "next/link";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { OrderView } from "@/lib/api/types";
import type { PartnerOption } from "../types";
import { customerName } from "../utils";
import { BulkAssignBar } from "./bulk-assign-bar";
import { StatusBadge } from "./status-badge";

/** Unassigned orders for the day: tick some, pick a partner, assign. */
export function UnassignedGroup({ orders, partners }: { orders: OrderView[]; partners: PartnerOption[] }) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  // Drop ids that vanished after a refresh.
  const live = orders.filter((o) => selected.has(o.id));
  const allSelected = orders.length > 0 && live.length === orders.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section aria-label="Unassigned" className="flex flex-col gap-2 rounded-lg border border-dashed bg-card p-3">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Unassigned · {orders.length}</h2>
        <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <Checkbox
            aria-label="Select all unassigned"
            checked={allSelected}
            onCheckedChange={() => setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)))}
          />
          All
        </label>
      </header>
      <ul className="flex flex-col gap-1">
        {orders.map((o) => (
          <li key={o.id} className="flex items-center gap-1">
            <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center md:size-9">
              <Checkbox
                aria-label={`Select ${o.orderCode}`}
                checked={selected.has(o.id)}
                onCheckedChange={() => toggle(o.id)}
              />
            </label>
            <Link
              href={`/orders/${o.id}`}
              className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border px-3 text-sm hover:bg-muted/50 md:min-h-9"
            >
              <span className="shrink-0 font-medium whitespace-nowrap">{o.orderCode}</span>
              <span className="min-w-0 flex-1 truncate">{customerName(o)}</span>
              <span className="text-muted-foreground">{o.pincode}</span>
              <StatusBadge status={o.status} />
            </Link>
          </li>
        ))}
      </ul>
      {live.length > 0 && (
        <BulkAssignBar
          selected={live.map((o) => ({ id: o.id, orderCode: o.orderCode }))}
          partners={partners}
          onDone={() => setSelected(new Set())}
        />
      )}
    </section>
  );
}
