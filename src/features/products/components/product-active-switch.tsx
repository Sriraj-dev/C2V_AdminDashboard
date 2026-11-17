"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type { Product } from "@/lib/api/types";
import { setProductActive } from "../server/actions";

/** Inline active toggle. The API enforces the 8-active limit; on a refusal the switch stays as it was. */
export function ProductActiveSwitch({ product }: { product: Product }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(active: boolean) {
    startTransition(async () => {
      try {
        const r = await setProductActive(product.id, active);
        if (r.ok) toast.success(active ? `${product.name} is active.` : `${product.name} is inactive.`);
        else toast.error(r.error.message);
      } catch {
        toast.error("Something went wrong. Try again.");
      }
      router.refresh();
    });
  }

  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm md:min-h-8">
      <Switch
        checked={product.active}
        disabled={pending}
        onCheckedChange={onChange}
        aria-label={`${product.name} active`}
      />
      <span aria-hidden>{product.active ? "Active" : "Inactive"}</span>
    </label>
  );
}
