import type { OrderView } from "@/lib/api/types";
import { OrderCard } from "./order-card";
import { OrderTable } from "./order-table";

/** Table at md and up, cards below. Both render; CSS shows one. */
export function OrderList({ orders }: { orders: OrderView[] }) {
  return (
    <>
      <div className="hidden md:block">
        <OrderTable orders={orders} />
      </div>
      <ul className="flex flex-col gap-2 md:hidden">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </ul>
    </>
  );
}
