import type { CustomerView, GeoLocation } from "@/lib/api/types";

/** Profile name, else saved-address name, else "Unknown". */
export function displayName(c: Pick<CustomerView, "profileName" | "defaultAddress">): string {
  return c.profileName?.trim() || c.defaultAddress?.name?.trim() || "Unknown";
}

export function mapHref(loc: GeoLocation): string {
  return `https://maps.google.com/?q=${loc.lat},${loc.lng}`;
}
