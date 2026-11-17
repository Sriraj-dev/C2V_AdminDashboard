import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "@/lib/api/types";
import { formatPaise } from "@/lib/money";
import { ProductActiveSwitch } from "./product-active-switch";
import { ProductFormDialog } from "./product-form-dialog";

function EditButton({ product }: { product: Product }) {
  return (
    <ProductFormDialog
      product={product}
      trigger={
        <Button variant="outline" size="sm" className="min-h-11 md:min-h-8">
          <Pencil aria-hidden />
          Edit
        </Button>
      }
    />
  );
}

/** Table at md and up, cards below. */
export function ProductList({ products }: { products: Product[] }) {
  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Order</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {p.sortOrder}
                </TableCell>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPaise(p.pricePaise)}
                </TableCell>
                <TableCell>
                  <ProductActiveSwitch product={p} />
                </TableCell>
                <TableCell>
                  <EditButton product={p} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-2 md:hidden">
        {products.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {p.sku} · #{p.sortOrder}
                </p>
              </div>
              <p className="shrink-0 font-medium tabular-nums">{formatPaise(p.pricePaise)}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ProductActiveSwitch product={p} />
              <EditButton product={p} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
