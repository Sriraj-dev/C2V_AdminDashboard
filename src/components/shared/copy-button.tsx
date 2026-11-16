"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({ value, label }: { value: string; label: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      <Copy aria-hidden />
      {label}
    </Button>
  );
}
