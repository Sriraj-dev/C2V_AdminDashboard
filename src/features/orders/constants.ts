import type { OrderStatus } from "@/lib/api/types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  payment_pending: "Payment pending",
  confirmed: "Confirmed",
  assigned: "Assigned",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  payment_failed: "Payment failed",
  expired: "Expired",
};

export type StatusTone = "neutral" | "info" | "accent" | "warning" | "success" | "danger";

export const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  payment_pending: "neutral",
  confirmed: "info",
  assigned: "accent",
  out_for_delivery: "warning",
  delivered: "success",
  cancelled: "danger",
  payment_failed: "danger",
  expired: "neutral",
};

export const REAL_STATUSES: readonly OrderStatus[] = [
  "confirmed",
  "assigned",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export const UNPAID_STATUSES: readonly OrderStatus[] = ["payment_pending", "payment_failed", "expired"];

export const ALL_STATUSES: readonly OrderStatus[] = [...REAL_STATUSES, ...UNPAID_STATUSES];

export type OrderAction = "assign" | "reassign" | "out_for_delivery" | "delivered" | "cancel" | "refund";

export const HISTORY_PAGE_SIZE = 25;
