import { describe, expect, it } from "vitest";
import type { ChatListItem } from "@/lib/api/types";
import { customerLabel, customerSubtitle, isAwaitingReply, istDay } from "./utils";

const item = (canReply: boolean, direction: "in" | "out"): ChatListItem => ({
  customer: { id: "c", profileName: null, phone: null },
  lastMessage: { direction, text: null, createdAt: "2026-11-16T05:00:00Z" },
  lastInboundAt: null,
  canReply,
});

describe("chats utils", () => {
  it("awaiting reply only when open and customer spoke last", () => {
    expect(isAwaitingReply(item(true, "in"))).toBe(true);
    expect(isAwaitingReply(item(true, "out"))).toBe(false);
    expect(isAwaitingReply(item(false, "in"))).toBe(false);
  });
  it("labels by name, then phone, then a fallback", () => {
    expect(customerLabel({ id: "c", profileName: " Asha ", phone: "919800000001" })).toBe("Asha");
    expect(customerLabel({ id: "c", profileName: null, phone: "919800000001" })).toBe("+91 98000 00001");
    expect(customerLabel({ id: "c", profileName: null, phone: null })).toBe("Customer");
  });
  it("shows the formatted phone under a name, and nothing when the phone is already the title", () => {
    expect(customerSubtitle({ id: "c", profileName: "Asha", phone: "919398651343" })).toBe("+91 93986 51343");
    expect(customerSubtitle({ id: "c", profileName: " ", phone: "919398651343" })).toBeNull();
    expect(customerSubtitle({ id: "c", profileName: "Asha", phone: null })).toBeNull();
  });
  it("buckets by IST day", () => {
    expect(istDay("2026-11-15T18:35:00Z")).toBe("2026-11-16");
    expect(istDay("2026-11-15T18:25:00Z")).toBe("2026-11-15");
  });
});
