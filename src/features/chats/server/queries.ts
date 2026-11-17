import "server-only";
import { adminRead } from "@/lib/api/admin";
import type { ChatCustomer, ChatListItem, ChatMessage } from "@/lib/api/types";

export async function getChats(): Promise<ChatListItem[]> {
  const { items } = await adminRead<{ items: ChatListItem[] }>("/admin/chats");
  return items;
}

export async function getChatThread(
  customerId: string,
): Promise<{ customer: ChatCustomer; canReply: boolean; items: ChatMessage[] }> {
  return adminRead(`/admin/chats/${encodeURIComponent(customerId)}/messages`);
}
