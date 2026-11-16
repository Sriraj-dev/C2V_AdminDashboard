import { MessageCircle, Printer } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { waShareUrl } from "@/lib/whatsapp";

type Props = {
  partnerId: string;
  partnerPhone: string;
  date: string;
  text: string;
  /** Full private partner link; absent when the partner has no token. */
  link?: string;
};

export function ShareActions({ partnerId, partnerPhone, date, text, link }: Props) {
  return (
    <div className="flex flex-wrap gap-2 [&_button]:min-h-11 md:[&_button]:min-h-8">
      <CopyButton value={text} label="Copy list" />
      <Button asChild variant="outline" size="sm" className="min-h-11 md:min-h-8">
        <a href={waShareUrl(partnerPhone, text)} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden />
          Share on WhatsApp
        </a>
      </Button>
      {link && <CopyButton value={link} label="Copy partner link" />}
      <Button asChild variant="outline" size="sm" className="min-h-11 md:min-h-8">
        <a href={`/deliveries/print?date=${date}&partnerId=${partnerId}`} target="_blank" rel="noopener noreferrer">
          <Printer aria-hidden />
          Print
        </a>
      </Button>
    </div>
  );
}
