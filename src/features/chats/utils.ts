import type { ChatCustomer, ChatListItem } from "@/lib/api/types";

export function customerLabel(c: ChatCustomer): string {
  return c.profileName?.trim() || c.phone || "Customer";
}

/** Same rule as the navigation badge: the customer spoke last and we can still answer. */
export function isAwaitingReply(c: ChatListItem): boolean {
  return c.canReply && c.lastMessage.direction === "in";
}

const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** IST calendar day (YYYY-MM-DD) of an ISO timestamp, for day separators. */
export function istDay(iso: string): string {
  return dayFmt.format(new Date(iso));
}
