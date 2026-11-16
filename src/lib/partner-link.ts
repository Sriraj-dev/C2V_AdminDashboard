import "server-only";
import { serverEnv } from "@/lib/env";

/** The private link a delivery partner opens. Never log it. */
export function partnerLink(token: string): string {
  return `${serverEnv().PUBLIC_APP_URL.replace(/\/+$/, "")}/p/${token}`;
}
