import "server-only";
import { unstable_rethrow } from "next/navigation";
import { adminRead } from "@/lib/api/admin";
import type { ChatListItem, RefundNeededItem } from "@/lib/api/types";
import type { NavCounts } from "../types";
import { chatsAwaitingReply } from "../utils";

/** Badge counts for the shell. Any failure except redirect/notFound degrades to zeros so the shell never breaks. */
export async function getNavCounts(): Promise<NavCounts> {
  try {
    const [refunds, chats] = await Promise.all([
      adminRead<{ items: RefundNeededItem[] }>("/admin/refunds/needed"),
      adminRead<{ items: ChatListItem[] }>("/admin/chats"),
    ]);
    return { refunds: refunds.items.length, chats: chatsAwaitingReply(chats.items) };
  } catch (e) {
    unstable_rethrow(e);
    return { refunds: 0, chats: 0 };
  }
}
