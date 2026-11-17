import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Chats" };

export default function Page() {
  return <EmptyState title="Select a conversation" description="Pick a customer on the left to read and reply." />;
}
