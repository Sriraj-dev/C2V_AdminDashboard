"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** md+: list and thread side by side. Phones: `/chats` shows the list, `/chats/[id]` only the thread. */
export function ChatsShell({ list, children }: { list: ReactNode; children: ReactNode }) {
  const atList = usePathname() === "/chats";
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(16rem,22rem)_1fr] md:items-start">
      <div className={cn(!atList && "hidden md:block")}>{list}</div>
      <div className={cn(atList && "hidden md:block", "min-w-0")}>{children}</div>
    </div>
  );
}
