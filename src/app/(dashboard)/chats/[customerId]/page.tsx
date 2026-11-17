import type { Metadata } from "next";
import { ChatThread, getChatThread } from "@/features/chats";

export const metadata: Metadata = { title: "Chat" };

export default async function Page({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  const { customer, canReply, items } = await getChatThread(customerId);
  return <ChatThread customer={customer} canReply={canReply} items={items} />;
}
