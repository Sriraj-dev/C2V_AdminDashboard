import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { UrlPagination } from "@/components/shared/url-pagination";
import { CustomerList, CustomerSearch, customerParamsSchema, getCustomers } from "@/features/customers";

export const metadata: Metadata = { title: "Customers" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = customerParamsSchema.parse(await searchParams);
  const result = await getCustomers(params);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Customers" actions={<RefreshButton />} />
      <CustomerSearch value={params.q ?? ""} />
      {result.items.length === 0 ? (
        params.page > 1 ? (
          <div className="flex flex-col items-center gap-3">
            <EmptyState title="No more customers." />
            <Link href={params.q ? `/customers?q=${encodeURIComponent(params.q)}` : "/customers"} className="text-sm underline underline-offset-2">
              Back to first page
            </Link>
          </div>
        ) : (
          <EmptyState title={params.q ? "No customers match this search." : "No customers yet."} />
        )
      ) : (
        <CustomerList customers={result.items} />
      )}
      <UrlPagination page={result.page} pageSize={result.pageSize} total={result.total} />
    </div>
  );
}
