import "server-only";
import { adminRead } from "@/lib/api/admin";
import type { OrderView, Paged, Partner } from "@/lib/api/types";
import { HISTORY_PAGE_SIZE, REAL_STATUSES, UNPAID_STATUSES } from "../constants";
import type { HistoryParams } from "../schemas";

export async function getActiveOrders(): Promise<OrderView[]> {
  const { items } = await adminRead<{ items: OrderView[] }>("/admin/orders/active");
  return items;
}

export async function getOrderHistory(p: HistoryParams): Promise<Paged<OrderView>> {
  const statuses = p.status ?? [...REAL_STATUSES, ...(p.includeUnpaid ? UNPAID_STATUSES : [])];
  return adminRead<Paged<OrderView>>("/admin/orders", {
    status: statuses.join(","),
    deliveryFrom: p.deliveryFrom,
    deliveryTo: p.deliveryTo,
    pincode: p.pincode,
    partnerId: p.partnerId,
    q: p.q,
    page: p.page,
    pageSize: HISTORY_PAGE_SIZE,
  });
}

export async function getOrder(id: string): Promise<OrderView> {
  const { order } = await adminRead<{ order: OrderView }>(`/admin/orders/${encodeURIComponent(id)}`);
  return order;
}

export type AssignablePartner = Pick<Partner, "id" | "name" | "phone" | "active">;

export async function getPartnersForAssign(): Promise<AssignablePartner[]> {
  const { items } = await adminRead<{ items: Partner[] }>("/admin/partners");
  return items.map(({ id, name, phone, active }) => ({ id, name, phone, active }));
}
