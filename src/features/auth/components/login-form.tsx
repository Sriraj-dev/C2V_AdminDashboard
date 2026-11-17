"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { FieldError } from "@/components/shared/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyFieldErrors } from "@/lib/form-errors";
import { loginSchema, type LoginInput } from "../schemas";
import { loginAction } from "../server/actions";

const FIELDS = ["username", "password"] as const;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { username: "", password: "" } });

  const onSubmit = (values: LoginInput) => {
    setError(null);
    startTransition(async () => {
      // On success the action redirects to "/" and never returns.
      const result = await loginAction(values);
      if (result.ok) return;
      // Login always shows the API's message; field errors (if any) also go on their fields.
      applyFieldErrors(result.error, FIELDS, setFieldError);
      setError(result.error.message);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, () => setError(null))} className="flex flex-col gap-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          className="h-11"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? "username-err" : undefined}
          {...register("username")}
        />
        <FieldError id="username-err" message={errors.username?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          className="h-11"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-err" : undefined}
          {...register("password")}
        />
        <FieldError id="password-err" message={errors.password?.message} />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
