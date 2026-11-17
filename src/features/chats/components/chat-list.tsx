"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Badge } from "@/components/ui/badge";
import type { ChatListItem } from "@/lib/api/types";
import { formatRelative } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { customerLabel, customerSubtitle, isAwaitingReply } from "../utils";
import { AutoRefreshSwitch } from "./auto-refresh-switch";

export function ChatList({ items }: { items: ChatListItem[] }) {
  const pathname = usePathname();
  // Beside an open thread (md+) the thread header owns the refresh controls.
  const atList = pathname === "/chats";
  const Heading = atList ? "h1" : "h2";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* One h1 per page: the list title at /chats, the customer's name in an open thread. */}
        <Heading className="text-xl font-semibold tracking-tight">Chats</Heading>
        {atList && (
          <div className="flex items-center gap-3">
            <AutoRefreshSwitch intervalMs={30_000} />
            <RefreshButton />
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState title="No conversations yet." />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {items.map((c) => {
            const href = `/chats/${c.customer.id}`;
            const selected = pathname === href;
            const subtitle = customerSubtitle(c.customer);
            return (
              <li key={c.customer.id}>
                <Link
                  href={href}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 flex-col gap-0.5 px-3 py-2.5 hover:bg-accent",
                    selected && "bg-accent",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{customerLabel(c.customer)}</span>
                    <span suppressHydrationWarning className="shrink-0 text-xs text-muted-foreground">
                      {formatRelative(c.lastMessage.createdAt)}
                    </span>
                  </span>
                  {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
                  <span className="truncate text-sm text-muted-foreground">
                    {c.lastMessage.direction === "out" && "You: "}
                    {c.lastMessage.text ?? "[message]"}
                  </span>
                  <span className="flex items-center gap-2">
                    {isAwaitingReply(c) && <Badge>Awaiting reply</Badge>}
                    {!c.canReply && <span className="text-xs text-muted-foreground">Reply window closed</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Messages are kept for 3 days.</p>
    </div>
  );
}
