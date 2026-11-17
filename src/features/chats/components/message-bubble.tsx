import { MapPin } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import type { ChatMessage } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { toMessageView, type MessageView } from "../message-view";
import { WaText } from "./wa-text";

function Content({ view }: { view: MessageView }) {
  switch (view.kind) {
    case "text":
    case "fallback":
      return (
        <p className="whitespace-pre-wrap break-words">
          <WaText text={view.body} />
        </p>
      );
    case "interactive":
      return (
        <div className="flex flex-col gap-1.5">
          {view.header && <p className="font-semibold break-words">{view.header}</p>}
          <p className="whitespace-pre-wrap break-words">
            <WaText text={view.body} />
          </p>
          {view.footer && <p className="text-xs text-muted-foreground break-words">{view.footer}</p>}
          {view.options.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="Options sent">
              {view.options.map((o, i) => (
                <li key={i} className="rounded-full border bg-background px-2.5 py-1 text-xs">
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case "reply":
      return <p className="break-words">{view.title}</p>;
    case "form":
      return <p className="font-medium">{view.label}</p>;
    case "image":
      return (
        <div className="flex flex-col gap-1.5">
          {view.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- external URLs are not configured for next/image
            <img src={view.url} alt={view.caption ? "" : "Image"} loading="lazy" className="max-h-64 rounded-md object-contain" />
          ) : (
            <p className="text-muted-foreground">[Image]</p>
          )}
          {view.caption && (
            <p className="whitespace-pre-wrap break-words">
              <WaText text={view.caption} />
            </p>
          )}
        </div>
      );
    case "template":
      return (
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">Template: {view.name}</p>
          {view.params.length > 0 && <p className="break-words">{view.params.join(" · ")}</p>}
        </div>
      );
    case "location":
      return (
        <a
          href={view.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-2"
        >
          <MapPin className="size-4" aria-hidden="true" />
          Location
        </a>
      );
  }
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const out = message.direction === "out";
  return (
    <div className={cn("flex", out ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm md:max-w-[70%]",
          out ? "bg-primary/10" : "border bg-card",
        )}
      >
        <Content view={toMessageView(message)} />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">{formatDateTime(message.createdAt)}</p>
      </div>
    </div>
  );
}
