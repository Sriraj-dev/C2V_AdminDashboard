"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type { Pincode } from "@/lib/api/types";
import { setPincodeActive } from "../server/actions";

export function PincodeActiveSwitch({ pincode }: { pincode: Pincode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(active: boolean) {
    startTransition(async () => {
      try {
        const r = await setPincodeActive(pincode.id, active);
        if (r.ok) toast.success(active ? `${pincode.pincode} is active.` : `${pincode.pincode} is inactive.`);
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
        checked={pincode.active}
        disabled={pending}
        onCheckedChange={onChange}
        aria-label={`${pincode.pincode} active`}
      />
      <span aria-hidden>{pincode.active ? "Active" : "Inactive"}</span>
    </label>
  );
}
