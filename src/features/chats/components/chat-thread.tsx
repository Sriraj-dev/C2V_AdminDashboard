"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import type { ChatCustomer, ChatMessage } from "@/lib/api/types";
import { formatDate } from "@/lib/dates";
import { customerLabel, istDay } from "../utils";
import { AutoRefreshSwitch } from "./auto-refresh-switch";
import { MessageBubble } from "./message-bubble";
import { ReplyBox } from "./reply-box";

export function ChatThread({
  customer,
  canReply,
  items,
}: {
  customer: ChatCustomer;
  canReply: boolean;
  items: ChatMessage[];
}) {
  const paneRef = useRef<HTMLDivElement>(null);
  const lastId = items.at(-1)?.id;

  useEffect(() => {
    const el = paneRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  return (
    <section className="flex flex-col gap-3" aria-label="Conversation">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/chats"
            aria-label="Back to chats"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-accent md:hidden"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{customerLabel(customer)}</h2>
            {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AutoRefreshSwitch intervalMs={10_000} />
          <RefreshButton />
        </div>
      </div>
      <div ref={paneRef} className="flex max-h-[60dvh] min-h-48 flex-col gap-2 overflow-y-auto rounded-lg border bg-muted/40 p-3 md:max-h-[calc(100dvh-20rem)]">
        {items.length === 0 ? (
          <EmptyState title="No messages in the last 3 days." />
        ) : (
          items.map((m, i) => {
            const day = istDay(m.createdAt);
            const showDay = i === 0 || istDay(items[i - 1]?.createdAt ?? "") !== day;
            return (
              <div key={m.id} className="flex flex-col gap-2">
                {showDay && (
                  <p className="self-center rounded-full bg-background px-3 py-0.5 text-xs text-muted-foreground">
                    {formatDate(m.createdAt)}
                  </p>
                )}
                <MessageBubble message={m} />
              </div>
            );
          })
        )}
      </div>
      <ReplyBox customerId={customer.id} canReply={canReply} />
    </section>
  );
}
