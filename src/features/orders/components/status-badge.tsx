import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, type StatusTone } from "../constants";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-status-neutral-bg text-status-neutral-fg",
  info: "bg-status-info-bg text-status-info-fg",
  accent: "bg-status-accent-bg text-status-accent-fg",
  warning: "bg-status-warning-bg text-status-warning-fg",
  success: "bg-status-success-bg text-status-success-fg",
  danger: "bg-status-danger-bg text-status-danger-fg",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", TONE_CLASS[STATUS_TONE[status]], className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
