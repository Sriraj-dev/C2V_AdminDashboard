"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendReply } from "../server/actions";

export const CLOSED_COPY =
  "You can reply only within 24 hours of the customer's last message (WhatsApp rule). Ask them to message you first.";

export function ReplyBox({ customerId, canReply }: { customerId: string; canReply: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [, startTransition] = useTransition();
  const busy = useRef(false);

  if (!canReply) {
    return (
      <p className="rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">{CLOSED_COPY}</p>
    );
  }

  async function submit() {
    if (busy.current || text.trim() === "") return;
    busy.current = true;
    setSending(true);
    try {
      const result = await sendReply(customerId, { text });
      if (result.ok) {
        setText("");
        startTransition(() => router.refresh());
        return;
      }
      toast.error(result.error.message);
      if (result.error.code === "outside_reply_window") startTransition(() => router.refresh());
    } finally {
      busy.current = false;
      setSending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    // Phones (no hover, coarse pointer) keep Enter as a newline; the Send button sends.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    e.preventDefault();
    void submit();
  }

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Textarea
        aria-label="Reply"
        placeholder="Type a reply"
        value={text}
        readOnly={sending}
        maxLength={4096}
        rows={2}
        className="min-h-11 flex-1 resize-none"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <Button type="submit" className="min-h-11 md:min-h-9" disabled={sending || text.trim() === ""}>
        <Send aria-hidden="true" />
        {sending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
