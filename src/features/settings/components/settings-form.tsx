"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Settings } from "@/lib/api/types";
import { settingsFormSchema, type SettingsFormInput, type SettingsFormValues } from "../schemas";
import { updateSettings } from "../server/actions";
import { settingsChanges, settingsToFormInput } from "../utils";

const FIELDS = ["supportPhone", "welcomeImageUrl", "deliveryFee", "minOrder"] as const;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: settingsToFormInput(settings),
  });

  async function onSubmit() {
    setFormError(null);
    const changed = settingsChanges(settings, getValues());
    if (Object.keys(changed).length === 0) {
      toast.info("Nothing to save.");
      return;
    }
    const result = await updateSettings(changed);
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
    toast.success("Saved. Applies to the next order form.");
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {formError && Object.keys(errors).length === 0 && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-phone">Support phone</Label>
        <Input
          id="settings-phone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          className="min-h-11 md:min-h-8"
          aria-invalid={!!errors.supportPhone}
          aria-describedby="settings-phone-help settings-phone-err"
          {...register("supportPhone")}
        />
        <p id="settings-phone-help" className="text-sm text-muted-foreground">
          Shown to customers who ask for help. Leave empty to hide.
        </p>
        <FieldError id="settings-phone-err" message={errors.supportPhone?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-image">Welcome image link</Label>
        <Input
          id="settings-image"
          type="url"
          inputMode="url"
          autoComplete="off"
          className="min-h-11 md:min-h-8"
          aria-invalid={!!errors.welcomeImageUrl}
          aria-describedby="settings-image-help settings-image-err"
          {...register("welcomeImageUrl")}
        />
        <p id="settings-image-help" className="text-sm text-muted-foreground">
          https link to an image shown when a customer says hi
        </p>
        <FieldError id="settings-image-err" message={errors.welcomeImageUrl?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["deliveryFee", "settings-fee", "Delivery fee"],
            ["minOrder", "settings-min", "Minimum order"],
          ] as const
        ).map(([name, id, label]) => (
          <div key={name} className="flex flex-col gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
              >
                ₹
              </span>
              <Input
                id={id}
                inputMode="decimal"
                autoComplete="off"
                className="min-h-11 pl-7 md:min-h-8"
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${id}-err` : undefined}
                {...register(name)}
              />
            </div>
            <FieldError id={`${id}-err`} message={errors[name]?.message} />
          </div>
        ))}
      </div>
      <div>
        <Button type="submit" className="min-h-11 w-full md:min-h-8 md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
