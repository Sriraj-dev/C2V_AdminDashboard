import type { ChatCustomer, ChatListItem } from "@/lib/api/types";
import { formatPhone } from "@/lib/format";

/** Title for a conversation: the WhatsApp name, else the formatted phone. */
export function customerLabel(c: ChatCustomer): string {
  return c.profileName?.trim() || (c.phone ? formatPhone(c.phone) : "Customer");
}

/** Line under the title: the formatted phone, only when the title is the name (never repeated). */
export function customerSubtitle(c: ChatCustomer): string | null {
  return c.profileName?.trim() && c.phone ? formatPhone(c.phone) : null;
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
