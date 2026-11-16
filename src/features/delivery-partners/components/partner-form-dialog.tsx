"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
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
import { changedFields, phoneTail } from "../utils";
import { partnerFormSchema, type PartnerForm } from "../schemas";
import { createPartner, updatePartner } from "../server/actions";
import type { PartnerRow } from "../types";

/** Add (no `partner`) or edit a delivery partner. */
export function PartnerFormDialog({
  partner,
  trigger,
}: {
  partner?: PartnerRow;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PartnerForm>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      name: partner?.name ?? "",
      phone: partner ? phoneTail(partner.phone) : "",
    },
  });

  async function onSubmit(values: PartnerForm) {
    setFormError(null);
    let result;
    if (partner) {
      const changed = changedFields(partner, values);
      if (Object.keys(changed).length === 0) {
        setOpen(false);
        return;
      }
      result = await updatePartner(partner.id, changed);
    } else {
      result = await createPartner(values);
    }
    if (!result.ok) {
      setFormError(result.error.message);
      for (const [field, message] of Object.entries(
        result.error.fieldErrors ?? {},
      )) {
        if (field === "name" || field === "phone") setError(field, { message });
      }
      return;
    }
    toast.success(
      partner ? "Partner updated." : `${result.data.partner.name} added.`,
    );
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setFormError(null);
        if (next) {
          reset({
            name: partner?.name ?? "",
            phone: partner ? phoneTail(partner.phone) : "",
          });
          clearErrors();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>
              {partner ? "Edit partner" : "Add partner"}
            </DialogTitle>
            <DialogDescription>
              {partner
                ? "Change the name or WhatsApp number."
                : "A private delivery link is created for them."}
            </DialogDescription>
          </DialogHeader>
          {formError && !errors.name && !errors.phone && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="partner-name">Name</Label>
            <Input
              id="partner-name"
              autoComplete="off"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "partner-name-err" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="partner-name-err" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="partner-phone">Mobile number</Label>
            <Input
              id="partner-phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="98000 00000"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "partner-phone-err" : undefined}
              {...register("phone")}
            />
            {errors.phone && (
              <p id="partner-phone-err" className="text-sm text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="min-h-11 md:min-h-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : partner ? "Save" : "Add partner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
