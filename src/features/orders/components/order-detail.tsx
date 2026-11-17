import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import type { OrderView } from "@/lib/api/types";
import { formatDeliveryDate } from "@/lib/dates";
import { formatPhone, telHref } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import type { PartnerOption } from "../types";
import { customerName } from "../utils";
import { OrderActions } from "./order-actions";
import { OrderTimeline } from "./order-timeline";
import { StatusBadge } from "./status-badge";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const PAYMENT_LABEL = {
  created: "Awaiting payment",
  paid: "Paid",
  failed: "Failed",
  expired: "Expired",
  refunded: "Refunded",
} as const;

export function OrderDetail({ order, partners }: { order: OrderView; partners: PartnerOption[] }) {
  const phone = order.customer.phone ?? order.address.phone ?? null;
  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-0">
      <PageHeader
        title={order.orderCode}
        description={`Delivery ${formatDeliveryDate(order.deliveryDate)}`}
        actions={
          <>
            <StatusBadge status={order.status} />
            <RefreshButton />
          </>
        }
      />

      <OrderActions order={order} partners={partners} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Items">
          <ul className="flex flex-col gap-1 text-sm">
            {order.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {i.name} <span className="text-muted-foreground">× {i.quantity}</span>
                </span>
                <span className="tabular-nums">{formatPaise(i.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 flex flex-col gap-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPaise(order.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery fee</dt>
              <dd className="tabular-nums">{formatPaise(order.deliveryFeePaise)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPaise(order.totalPaise)}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Customer">
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium">{customerName(order)}</p>
            {phone && (
              <a href={telHref(phone)} className="w-fit underline underline-offset-2">
                {formatPhone(phone)}
              </a>
            )}
            <p>{order.address.line1}</p>
            <p>Pincode {order.pincode}</p>
            {order.address.landmark && <p className="text-muted-foreground">Landmark: {order.address.landmark}</p>}
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {order.mapUrl && (
                <a href={order.mapUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  Map
                </a>
              )}
              <Link href={`/customers/${order.customer.id}`} className="underline underline-offset-2">
                Customer
              </Link>
              <Link href={`/chats/${order.customer.id}`} className="underline underline-offset-2">
                Chat
              </Link>
            </div>
          </div>
        </Section>

        <Section title="Delivery and payment">
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Partner</dt>
              <dd>{order.partner?.name ?? "Unassigned"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Payment</dt>
              <dd>{order.paymentStatus ? PAYMENT_LABEL[order.paymentStatus] : "No payment"}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Timeline">
          <OrderTimeline order={order} />
        </Section>
      </div>
    </div>
  );
}
