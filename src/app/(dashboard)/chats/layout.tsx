import { ChatList, ChatsShell, getChats } from "@/features/chats";

export default async function ChatsLayout({ children }: LayoutProps<"/chats">) {
  const items = await getChats();
  return <ChatsShell list={<ChatList items={items} />}>{children}</ChatsShell>;
}
