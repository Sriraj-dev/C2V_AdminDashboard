import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { getCurrentUser } from "@/features/auth";
import {
  DeliveriesBoard,
  deliveryDates,
  getActiveOrders,
  getPartnerLinks,
  getPartnersForAssign,
  pickDefaultDate,
} from "@/features/orders";
import { isValidYmd, todayInIST } from "@/lib/dates";

export const metadata: Metadata = { title: "Deliveries" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await searchParams).date;
  const requested = typeof raw === "string" && isValidYmd(raw) ? raw : undefined;
  const [user, orders, partners, links] = await Promise.all([
    getCurrentUser(),
    getActiveOrders(),
    getPartnersForAssign(),
    getPartnerLinks(),
  ]);
  const today = todayInIST();
  const date = requested ?? pickDefaultDate(deliveryDates(orders), today);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Deliveries" actions={<RefreshButton />} />
      <DeliveriesBoard
        orders={orders}
        date={date}
        today={today}
        tenantName={user.tenantName}
        partners={partners}
        links={links}
      />
    </div>
  );
}
