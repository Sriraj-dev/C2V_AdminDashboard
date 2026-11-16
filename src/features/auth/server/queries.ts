import "server-only";
import { cache } from "react";
import { adminRead } from "@/lib/api/admin";
import type { AuthUser } from "@/lib/api/types";

export const getCurrentUser = cache(async (): Promise<AuthUser> => {
  const { user } = await adminRead<{ user: AuthUser }>("/admin/me");
  return user;
});
