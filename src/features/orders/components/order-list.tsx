"use client";

import { useState } from "react";
import type { OrderView } from "@/lib/api/types";
import type { PartnerOption, Selection } from "../types";
import { isAssignable } from "../utils";
import { BulkAssignBar } from "./bulk-assign-bar";
import { OrderCard } from "./order-card";
import { OrderTable } from "./order-table";

/** Table at md and up, cards below. Both render; CSS shows one. Selection (bulk assign) is opt-in. */
export function OrderList({
  orders,
  selectable = false,
  partners = [],
}: {
  orders: OrderView[];
  selectable?: boolean;
  partners?: PartnerOption[];
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const assignableIds = orders.filter(isAssignable).map((o) => o.id);
  // Drop ids that vanished after a refresh, so the count never includes stale orders.
  const live = new Set(assignableIds.filter((id) => selected.has(id)));

  const selection: Selection | undefined = selectable
    ? {
        selected: live,
        toggle: (id) =>
          setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          }),
      }
    : undefined;

  const allSelected = assignableIds.length > 0 && live.size === assignableIds.length;

  return (
    <>
      <div className="hidden md:block">
        <OrderTable
          orders={orders}
          selection={selection}
          allSelected={allSelected}
          onToggleAll={() => setSelected(allSelected ? new Set() : new Set(assignableIds))}
        />
      </div>
      <ul className="flex flex-col gap-2 md:hidden">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} selection={selection} />
        ))}
      </ul>
      {selectable && live.size > 0 && (
        <BulkAssignBar
          selected={orders.filter((o) => live.has(o.id)).map((o) => ({ id: o.id, orderCode: o.orderCode }))}
          partners={partners}
          onDone={() => setSelected(new Set())}
        />
      )}
    </>
  );
}
