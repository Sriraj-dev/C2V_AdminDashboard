import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AutoRefresh } from "@/components/shared/auto-refresh";
import { EmptyState } from "@/components/shared/empty-state";
import { UrlPagination } from "@/components/shared/url-pagination";
import {
  OrderList,
  OrdersFilters,
  OrdersTabs,
  activeFiltersSchema,
  filterActiveOrders,
  getActiveOrders,
  getOrderHistory,
  getPartnersForAssign,
  historyParamsSchema,
} from "@/features/orders";

export const metadata: Metadata = { title: "Orders" };

type RawParams = Record<string, string | string[] | undefined>;

export default async function Page({ searchParams }: { searchParams: Promise<RawParams> }) {
  const raw = await searchParams;
  const view = raw.view === "history" ? "history" : "active";
  const partnersP = getPartnersForAssign();
  partnersP.catch(() => undefined); // avoid an unhandled rejection if the orders query redirects first

  let values: Record<string, string | undefined>;
  let body: React.ReactNode;
  if (view === "active") {
    const filters = activeFiltersSchema.parse(raw);
    values = { ...filters };
    const ordersP = getActiveOrders();
    const orders = filterActiveOrders(await ordersP, filters);
    const filtered = Object.values(filters).some(Boolean);
    body = (
      <>
        <AutoRefresh intervalMs={30_000} />
        {orders.length === 0 ? (
          <EmptyState title={filtered ? "No orders match these filters." : "No open orders."} />
        ) : (
          <OrderList orders={orders} />
        )}
      </>
    );
  } else {
    const params = historyParamsSchema.parse(raw);
    values = {
      deliveryFrom: params.deliveryFrom,
      deliveryTo: params.deliveryTo,
      pincode: params.pincode,
      partnerId: params.partnerId,
      q: params.q,
      status: params.status?.join(","),
      includeUnpaid: params.includeUnpaid ? "1" : undefined,
    };
    const result = await getOrderHistory(params);
    body = (
      <>
        {result.items.length === 0 ? <EmptyState title="No orders found." /> : <OrderList orders={result.items} />}
        <UrlPagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </>
    );
  }
  const partners = (await partnersP).map((p) => ({ id: p.id, name: p.active ? p.name : `${p.name} (inactive)` }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Orders" />
      <OrdersTabs view={view} />
      <OrdersFilters view={view} partners={partners} values={values} />
      {body}
    </div>
  );
}
