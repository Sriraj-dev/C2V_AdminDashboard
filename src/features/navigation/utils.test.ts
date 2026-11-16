import { describe, expect, it } from "vitest";
import type { ChatListItem } from "@/lib/api/types";
import { chatsAwaitingReply, isActive } from "./utils";

describe("isActive", () => {
  it("matches / only exactly", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/orders/x", "/")).toBe(false);
  });
  it("matches other items by prefix on a segment boundary", () => {
    expect(isActive("/orders", "/orders")).toBe(true);
    expect(isActive("/orders/x", "/orders")).toBe(true);
    expect(isActive("/orders-old", "/orders")).toBe(false);
  });
});

function chat(direction: "in" | "out", canReply: boolean): ChatListItem {
  return {
    customer: { id: "c", name: null, phone: "919999999999" },
    lastMessage: { direction, text: "hi", createdAt: "2026-11-16T00:00:00Z" },
    lastInboundAt: null,
    canReply,
  } as unknown as ChatListItem;
}

describe("chatsAwaitingReply", () => {
  it("counts only inbound chats that can be replied to", () => {
    expect(chatsAwaitingReply([chat("in", true), chat("in", false), chat("out", true), chat("in", true)])).toBe(2);
    expect(chatsAwaitingReply([])).toBe(0);
  });
});
