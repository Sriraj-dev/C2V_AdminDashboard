import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Button } from "@/components/ui/button";
import {
  MAX_ACTIVE_PRODUCTS,
  ProductFormDialog,
  ProductList,
  getProducts,
} from "@/features/products";

export const metadata: Metadata = { title: "Products" };

export default async function Page() {
  const products = await getProducts();
  const activeCount = products.filter((p) => p.active).length;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Products"
        description={`${activeCount} of ${MAX_ACTIVE_PRODUCTS} active${activeCount >= MAX_ACTIVE_PRODUCTS ? " (limit reached)" : ""}`}
        actions={
          <>
            <RefreshButton />
            <ProductFormDialog
              trigger={
                <Button size="sm" className="min-h-11 md:min-h-8">
                  <Plus aria-hidden />
                  Add product
                </Button>
              }
            />
          </>
        }
      />
      <p className="text-sm text-muted-foreground">
        Changes show in the next order form a customer opens.
      </p>
      {products.length === 0 ? <EmptyState title="No products yet." /> : <ProductList products={products} />}
    </div>
  );
}
