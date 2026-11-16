import type { OrderView } from "@/lib/api/types";
import { formatDeliveryDate } from "@/lib/dates";
import { formatPhone, toFullPhone } from "@/lib/format";

type Partner = NonNullable<OrderView["partner"]>;

export type DeliveryGroups = {
  unassigned: OrderView[];
  partners: { partner: Partner; pincodes: { pincode: string; orders: OrderView[] }[] }[];
};

export function deliveryDates(orders: OrderView[]): string[] {
  return [...new Set(orders.map((o) => o.deliveryDate))].sort();
}

/** Today if present; else the next date after today; else the latest overdue date; else today. */
export function pickDefaultDate(dates: string[], today: string): string {
  if (dates.includes(today)) return today;
  const sorted = [...dates].sort();
  const next = sorted.find((d) => d > today);
  if (next) return next;
  const overdue = sorted.filter((d) => d < today);
  return overdue[overdue.length - 1] ?? today;
}

export const byCode = (a: OrderView, b: OrderView) => (a.orderCode < b.orderCode ? -1 : a.orderCode > b.orderCode ? 1 : 0);
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function groupDeliveries(orders: OrderView[], date: string): DeliveryGroups {
  const day = orders.filter((o) => o.deliveryDate === date).sort(byCode);
  const unassigned = day.filter((o) => !o.partner);
  const byPartner = new Map<string, { partner: Partner; orders: OrderView[] }>();
  for (const o of day) {
    if (!o.partner) continue;
    const g = byPartner.get(o.partner.id) ?? { partner: o.partner, orders: [] };
    g.orders.push(o);
    byPartner.set(o.partner.id, g);
  }
  const partners = [...byPartner.values()]
    .sort((a, b) => cmp(a.partner.name, b.partner.name))
    .map(({ partner, orders: list }) => {
      const byPin = new Map<string, OrderView[]>();
      for (const o of list) byPin.set(o.pincode, [...(byPin.get(o.pincode) ?? []), o]);
      const pincodes = [...byPin.entries()].sort(([a], [b]) => cmp(a, b)).map(([pincode, os]) => ({ pincode, orders: os }));
      return { partner, pincodes };
    });
  return { unassigned, partners };
}

export function buildShareText(a: {
  tenantName: string;
  partnerName: string;
  date: string;
  orders: OrderView[];
  partnerLink?: string;
}): string {
  const n = a.orders.length;
  const lines: string[] = [
    `${a.tenantName} — deliveries for ${formatDeliveryDate(a.date)}`,
    `${a.partnerName}: ${n} ${n === 1 ? "order" : "orders"}`,
  ];
  a.orders.forEach((o, i) => {
    const phone = o.customer.phone ?? o.address.phone;
    lines.push("", `${i + 1}. ${o.orderCode}`);
    lines.push(phone ? `${o.address.name} · ${formatPhone(toFullPhone(phone))}` : o.address.name);
    lines.push(`${o.address.line1}, ${o.pincode}`);
    if (o.address.landmark) lines.push(`Landmark: ${o.address.landmark}`);
    if (o.mapUrl) lines.push(`Map: ${o.mapUrl}`);
    lines.push(o.items.map((it) => `${it.name} × ${it.quantity}`).join(", "));
  });
  if (a.partnerLink) lines.push("", `Your orders: ${a.partnerLink}`);
  return lines.join("\n");
}
