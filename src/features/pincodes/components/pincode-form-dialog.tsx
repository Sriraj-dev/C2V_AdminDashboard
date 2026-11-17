"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Controller, useForm, type DefaultValues } from "react-hook-form";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Pincode } from "@/lib/api/types";
import { WEEKDAYS } from "@/lib/dates";
import {
  pincodeFormSchema,
  type PincodeFormInput,
  type PincodeFormValues,
} from "../schemas";
import { createPincode, updatePincode } from "../server/actions";
import { pincodeChanges } from "../utils";

const FIELDS = ["pincode", "deliveryWeekday", "note", "active"] as const;

/** A new pincode has no weekday yet; the select shows "Choose a day" until one is picked. */
function initialValues(p?: Pincode): DefaultValues<PincodeFormInput> {
  return p
    ? { pincode: p.pincode, deliveryWeekday: p.deliveryWeekday, note: p.note ?? "", active: p.active }
    : { pincode: "", note: "", active: true };
}

/** Add (no `pincode`) or edit a delivery area. The pincode itself is read-only when editing. */
export function PincodeFormDialog({
  pincode,
  trigger,
}: {
  pincode?: Pincode;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PincodeFormInput, unknown, PincodeFormValues>({
    resolver: zodResolver(pincodeFormSchema),
    defaultValues: initialValues(pincode),
  });

  async function onSubmit() {
    setFormError(null);
    const values = getValues();
    let result;
    if (pincode) {
      const changed = pincodeChanges(pincode, values);
      if (Object.keys(changed).length === 0) {
        setOpen(false);
        return;
      }
      result = await updatePincode(pincode.id, changed);
    } else {
      result = await createPincode(values);
    }
    if (!result.ok) {
      setFormError(result.error.message);
      let unmatched: string | null = null;
      for (const [field, message] of Object.entries(result.error.fieldErrors ?? {})) {
        if ((FIELDS as readonly string[]).includes(field))
          setError(field as (typeof FIELDS)[number], { message });
        else unmatched ??= message;
      }
      if (unmatched) setFormError(unmatched);
      return;
    }
    toast.success(pincode ? "Pincode updated." : `${result.data.pincode.pincode} added.`);
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
          reset(initialValues(pincode));
          clearErrors();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{pincode ? `Edit ${pincode.pincode}` : "Add pincode"}</DialogTitle>
            <DialogDescription>
              Orders to this pincode go out on the next chosen weekday.
            </DialogDescription>
          </DialogHeader>
          {formError && Object.keys(errors).length === 0 && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pincode-code">Pincode</Label>
            <Input
              id="pincode-code"
              inputMode="numeric"
              autoComplete="off"
              placeholder="560034"
              readOnly={!!pincode}
              className={pincode ? "bg-muted" : undefined}
              aria-invalid={!!errors.pincode}
              aria-describedby={errors.pincode ? "pincode-code-err" : undefined}
              {...register("pincode")}
            />
            {pincode && (
              <p className="text-sm text-muted-foreground">
                Pincodes can&apos;t be changed; add a new one.
              </p>
            )}
            {errors.pincode && (
              <p id="pincode-code-err" className="text-sm text-destructive">
                {errors.pincode.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pincode-weekday">Delivery day</Label>
            <Controller
              control={control}
              name="deliveryWeekday"
              render={({ field }) => (
                <Select
                  value={field.value === undefined ? "" : String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger
                    id="pincode-weekday"
                    className="min-h-11 w-full md:min-h-8"
                    aria-invalid={!!errors.deliveryWeekday}
                  >
                    <SelectValue placeholder="Choose a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((name, i) => (
                      <SelectItem key={name} value={String(i)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.deliveryWeekday && (
              <p className="text-sm text-destructive">{errors.deliveryWeekday.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pincode-note">Note (optional)</Label>
            <Input
              id="pincode-note"
              autoComplete="off"
              aria-invalid={!!errors.note}
              aria-describedby={errors.note ? "pincode-note-err" : undefined}
              {...register("note")}
            />
            {errors.note && (
              <p id="pincode-note-err" className="text-sm text-destructive">
                {errors.note.message}
              </p>
            )}
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Active (customers can order here)
              </label>
            )}
          />
          <DialogFooter>
            <Button type="submit" className="min-h-11 md:min-h-8" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : pincode ? "Save" : "Add pincode"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
