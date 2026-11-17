"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/shared/field-error";
import { FormError } from "@/components/shared/form-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Product } from "@/lib/api/types";
import { applyFieldErrors } from "@/lib/form-errors";
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from "../schemas";
import { createProduct, updateProduct } from "../server/actions";
import { productChanges, productToFormInput } from "../utils";

const EMPTY: ProductFormInput = { sku: "", name: "", price: "", sortOrder: "", active: true };
const FIELDS = ["sku", "name", "price", "sortOrder", "active"] as const;

/** Add (no `product`) or edit a product. */
export function ProductFormDialog({
  product,
  trigger,
}: {
  product?: Product;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const initial = product ? productToFormInput(product) : EMPTY;
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initial,
  });

  async function onSubmit() {
    setFormError(null);
    const values = getValues();
    let result;
    if (product) {
      const changed = productChanges(product, values);
      if (Object.keys(changed).length === 0) {
        setOpen(false);
        return;
      }
      result = await updateProduct(product.id, changed);
    } else {
      result = await createProduct(values);
    }
    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, FIELDS, setError));
      return;
    }
    toast.success(product ? "Product updated." : `${result.data.product.name} added.`);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isSubmitting) return;
        setOpen(next);
        setFormError(null);
        if (next) {
          reset(initial);
          clearErrors();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit, () => setFormError(null))} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              Shown in the next order form a customer opens.
            </DialogDescription>
          </DialogHeader>
          <FormError message={formError} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-sku">SKU</Label>
            <Input
              id="product-sku"
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={!!errors.sku}
              aria-describedby={errors.sku ? "product-sku-err" : undefined}
              {...register("sku")}
            />
            <FieldError id="product-sku-err" message={errors.sku?.message} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-name">Name</Label>
            <Input
              id="product-name"
              autoComplete="off"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "product-name-err" : undefined}
              {...register("name")}
            />
            <FieldError id="product-name-err" message={errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-price">Price (₹)</Label>
              <Input
                id="product-price"
                inputMode="decimal"
                autoComplete="off"
                placeholder="90 or 12.50"
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? "product-price-err" : undefined}
                {...register("price")}
              />
              <FieldError id="product-price-err" message={errors.price?.message} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-sort">Sort order</Label>
              <Input
                id="product-sort"
                inputMode="numeric"
                autoComplete="off"
                placeholder={product ? undefined : "Last"}
                aria-invalid={!!errors.sortOrder}
                aria-describedby={errors.sortOrder ? "product-sort-err" : undefined}
                {...register("sortOrder")}
              />
              <FieldError id="product-sort-err" message={errors.sortOrder?.message} />
            </div>
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Active (shown in the order form)
              </label>
            )}
          />
          <DialogFooter>
            <Button type="submit" className="min-h-11 md:min-h-8" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : product ? "Save" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
