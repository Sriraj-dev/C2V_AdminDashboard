import type { ChatListItem } from "@/lib/api/types";

/** `/` matches only exactly; every other item matches itself and its sub-paths. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function chatsAwaitingReply(items: ChatListItem[]): number {
  return items.filter((c) => c.canReply && c.lastMessage.direction === "in").length;
}
