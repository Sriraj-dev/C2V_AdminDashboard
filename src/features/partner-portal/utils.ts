import type { PartnerOrderView } from "@/lib/api/types";

/** Partner link tokens are 43 URL-safe characters. Anything else is not a link we issued. */
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export const NOT_ACTIVE_MESSAGE = "This link isn't active. Ask the shop for a new one.";
export const NO_LONGER_ASSIGNED_MESSAGE = "This order is no longer assigned to you.";

export type DateGroup = { date: string; overdue: boolean; orders: PartnerOrderView[] };

/** Groups orders by delivery date in ascending order, so overdue days (before `today`) naturally come first. */
export function groupByDate(orders: PartnerOrderView[], today: string): DateGroup[] {
  const byDate = new Map<string, PartnerOrderView[]>();
  for (const o of orders) {
    const list = byDate.get(o.deliveryDate);
    if (list) list.push(o);
    else byDate.set(o.deliveryDate, [o]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({ date, overdue: date < today, orders: list }));
}
