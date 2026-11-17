"use client";

import { Link2, MessageCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { waShareUrl } from "@/lib/whatsapp";
import { resetPartnerLink } from "../server/actions";
import type { PartnerRow } from "../types";
import { partnerShareText } from "../utils";

export function PartnerLinkActions({ partner }: { partner: PartnerRow }) {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const pending = resetting || refreshing;
  const btn = "min-h-11 md:min-h-8";

  async function reset() {
    setResetting(true);
    try {
      const r = await resetPartnerLink(partner.id);
      if (r.ok)
        toast.success(
          partner.link
            ? "New link created. The old link no longer works."
            : "Link created.",
        );
      else toast.error(r.error.message);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setResetting(false);
    }
  }

  if (!partner.link) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={btn}
        disabled={pending}
        onClick={reset}
      >
        <Link2 aria-hidden />
        {pending ? "Generating…" : "Generate link"}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 [&_button]:min-h-11 md:[&_button]:min-h-8">
      <CopyButton value={partner.link} label="Copy link" />
      {partner.active ? (
        <Button asChild variant="outline" size="sm" className={btn}>
          <a
            href={waShareUrl(
              partner.phone,
              partnerShareText(partner.name, partner.link),
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden />
            Share on WhatsApp
          </a>
        </Button>
      ) : (
        <span className="text-sm text-muted-foreground">
          Link works again when reactivated.
        </span>
      )}
      <ConfirmDialog
        trigger={
          <Button variant="outline" size="sm" className={btn} disabled={pending}>
            <RotateCcw aria-hidden />
            Reset link
          </Button>
        }
        title={`Reset ${partner.name}'s link?`}
        description="The old link stops working right away."
        confirmLabel="Reset link"
        destructive
        onConfirm={reset}
      />
    </div>
  );
}
