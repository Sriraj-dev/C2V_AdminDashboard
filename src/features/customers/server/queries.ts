import "server-only";
import { adminRead } from "@/lib/api/admin";
import type { CustomerView, OrderView, Paged } from "@/lib/api/types";
import { CUSTOMERS_PAGE_SIZE } from "../constants";
import type { CustomerParams } from "../schemas";

export async function getCustomers(p: CustomerParams): Promise<Paged<CustomerView>> {
  return adminRead<Paged<CustomerView>>("/admin/customers", {
    q: p.q || undefined,
    page: p.page,
    pageSize: CUSTOMERS_PAGE_SIZE,
  });
}

export async function getCustomer(id: string): Promise<{ customer: CustomerView; orders: OrderView[] }> {
  return adminRead<{ customer: CustomerView; orders: OrderView[] }>(`/admin/customers/${encodeURIComponent(id)}`);
}
