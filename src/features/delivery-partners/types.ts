import type { Partner } from "@/lib/api/types";

/** A partner as the client sees it: the raw token is replaced by the full private link. */
export type PartnerRow = Omit<Partner, "accessToken"> & { link: string | null };
