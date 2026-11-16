import type { OrderView } from "@/lib/api/types";
import type { OrderAction } from "./constants";
import type { ActiveFilters } from "./schemas";

/** Which actions the vendor may take on an order, mirroring the bot server's rules. */
export function availableActions(o: Pick<OrderView, "status" | "paymentStatus" | "source">): OrderAction[] {
  const actions: OrderAction[] = [];
  switch (o.status) {
    case "confirmed":
      actions.push("assign", "cancel");
      break;
    case "assigned":
      actions.push("reassign", "out_for_delivery", "cancel");
      break;
    case "out_for_delivery":
      actions.push("delivered", "cancel");
      break;
    default:
      break;
  }
  if (o.source === "one_time" && o.paymentStatus === "paid") actions.push("refund");
  return actions;
}

/** True when the order can be (re)assigned, i.e. may be part of a bulk assign. */
export function isAssignable(o: Pick<OrderView, "status" | "paymentStatus" | "source">): boolean {
  const a = availableActions(o);
  return a.includes("assign") || a.includes("reassign");
}

export function customerName(o: Pick<OrderView, "address" | "customer">): string {
  return o.address.name || o.customer.profileName || "Unknown";
}

export function filterActiveOrders(orders: OrderView[], f: ActiveFilters): OrderView[] {
  const q = f.q?.trim().toLowerCase();
  const phoneLike = q !== undefined && /^[+\d\s-]+$/.test(q) && q.replace(/\D/g, "").length >= 3;
  const qDigits = phoneLike ? q.replace(/\D/g, "") : "";
  return orders.filter((o) => {
    if (f.date && o.deliveryDate !== f.date) return false;
    if (f.pincode && o.pincode !== f.pincode) return false;
    if (f.partnerId === "unassigned" && o.partner) return false;
    if (f.partnerId && f.partnerId !== "unassigned" && o.partner?.id !== f.partnerId) return false;
    if (q) {
      const text = [o.orderCode, o.address.name, o.customer.profileName].some((s) => s?.toLowerCase().includes(q));
      const phone = qDigits ? [o.customer.phone, o.address.phone].some((p) => p?.includes(qDigits)) : false;
      if (!text && !phone) return false;
    }
    return true;
  });
}
