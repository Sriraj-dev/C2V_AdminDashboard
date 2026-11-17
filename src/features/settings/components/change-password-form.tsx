"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/shared/field-error";
import { FormError } from "@/components/shared/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyFieldErrors } from "@/lib/form-errors";
import { changePasswordSchema, type ChangePasswordInput } from "../schemas";
import { changePassword } from "../server/actions";

const EMPTY: ChangePasswordInput = { currentPassword: "", newPassword: "", confirmPassword: "" };
const FIELDS = ["currentPassword", "newPassword", "confirmPassword"] as const;

const ROWS = [
  ["currentPassword", "cp-current", "Current password", "current-password"],
  ["newPassword", "cp-new", "New password (at least 10 characters)", "new-password"],
  ["confirmPassword", "cp-confirm", "Confirm new password", "new-password"],
] as const;

export function ChangePasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  async function onSubmit() {
    setFormError(null);
    const result = await changePassword(getValues());
    if (!result.ok) {
      setFormError(applyFieldErrors(result.error, FIELDS, setError));
      return;
    }
    reset(EMPTY);
    toast.success("Password changed. Other devices are signed out.");
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => setFormError(null))} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">This signs you out on other devices.</p>
      <FormError message={formError} />
      {ROWS.map(([name, id, label, autoComplete]) => (
        <div key={name} className="flex flex-col gap-1.5">
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            type="password"
            autoComplete={autoComplete}
            className="min-h-11 md:min-h-8"
            aria-invalid={!!errors[name]}
            aria-describedby={errors[name] ? `${id}-err` : undefined}
            {...register(name)}
          />
          <FieldError id={`${id}-err`} message={errors[name]?.message} />
        </div>
      ))}
      <div>
        <Button type="submit" className="min-h-11 w-full md:min-h-8 md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "Changing…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
