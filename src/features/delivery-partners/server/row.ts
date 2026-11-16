import "server-only";
import type { Partner } from "@/lib/api/types";
import { partnerLink } from "@/lib/partner-link";
import type { PartnerRow } from "../types";

/** Builds the private link on the server and drops the raw token, so clients only ever see the full link. */
export function toPartnerRow({ accessToken, ...p }: Partner): PartnerRow {
  return { ...p, link: accessToken ? partnerLink(accessToken) : null };
}
