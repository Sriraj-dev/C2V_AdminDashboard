// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let pathname = "/chats";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../server/actions", () => ({ sendReply: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import type { ChatListItem, ChatMessage } from "@/lib/api/types";
import { ChatList } from "./chat-list";
import { ChatThread } from "./chat-thread";

afterEach(() => {
  cleanup();
  pathname = "/chats";
});

const NOW = new Date().toISOString();
const row = (id: string, name: string, canReply: boolean, direction: "in" | "out"): ChatListItem => ({
  customer: { id, profileName: name, phone: "919800000001" },
  lastMessage: { direction, text: `hello ${name}`, createdAt: NOW },
  lastInboundAt: NOW,
  canReply,
});

describe("ChatList", () => {
  const items = [row("a", "Asha", true, "in"), row("b", "Bala", false, "in"), row("c", "Chitra", true, "out")];
  it("shows the awaiting badge only for open, customer-last rows and the closed label otherwise", () => {
    render(<ChatList items={items} />);
    const rows = screen.getAllByRole("link");
    expect(within(rows[0]!).getByText("Awaiting reply")).toBeInTheDocument();
    expect(within(rows[1]!).queryByText("Awaiting reply")).toBeNull();
    expect(within(rows[1]!).getByText("Reply window closed")).toBeInTheDocument();
    expect(within(rows[2]!).queryByText("Awaiting reply")).toBeNull();
    expect(within(rows[2]!).queryByText("Reply window closed")).toBeNull();
    expect(within(rows[2]!).getByText(/You: hello Chitra/)).toBeInTheDocument();
  });
  it("marks the selected row and hides the refresh controls beside an open thread", () => {
    pathname = "/chats/b";
    render(<ChatList items={items} />);
    const rows = screen.getAllByRole("link");
    expect(rows[1]).toHaveAttribute("aria-current", "page");
    expect(rows[0]).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("switch")).toBeNull();
  });
  it("shows the refresh controls at /chats", () => {
    render(<ChatList items={items} />);
    expect(screen.getByRole("switch", { name: "Auto-refresh" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
  it("is the page's h1 at /chats and an h2 beside an open thread (the thread owns the h1)", () => {
    render(<ChatList items={items} />);
    expect(screen.getByRole("heading", { level: 1, name: "Chats" })).toBeInTheDocument();
    cleanup();
    pathname = "/chats/b";
    render(<ChatList items={items} />);
    expect(screen.getByRole("heading", { level: 2, name: "Chats" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });
  it("titles a nameless customer by formatted phone without repeating it", () => {
    const nameless: ChatListItem = { ...row("z", "", true, "in"), customer: { id: "z", profileName: null, phone: "919398651343" } };
    render(<ChatList items={[nameless]} />);
    expect(screen.getAllByText("+91 93986 51343")).toHaveLength(1);
  });
});

describe("ChatThread", () => {
  const m = (id: string, direction: "in" | "out", createdAt: string, text: string | null, type = "text"): ChatMessage => ({
    id,
    direction,
    type,
    text,
    payload: {},
    createdAt,
  });
  const customer = { id: "11111111-1111-4111-8111-111111111111", profileName: "Asha", phone: "919800000001" };

  it("puts out right, in left, adds IST day separators and falls back to text", () => {
    const items = [
      m("1", "in", "2026-11-15T18:25:00Z", "late night"), // 15 Nov, 11:55 pm IST
      m("2", "out", "2026-11-15T18:35:00Z", "next day reply"), // 16 Nov 12:05 am IST
      m("3", "in", "2026-11-16T05:00:00Z", null, "sticker"),
    ];
    render(<ChatThread customer={customer} canReply items={items} />);
    expect(screen.getByRole("heading", { level: 1, name: "Asha" })).toBeInTheDocument();
    expect(screen.getByText("+91 98000 00001")).toBeInTheDocument();
    expect(screen.getByText("15 Nov 2026")).toBeInTheDocument();
    expect(screen.getByText("16 Nov 2026")).toBeInTheDocument();
    const side = (t: string) => screen.getByText(t).closest("div.flex")!;
    expect(side("late night")).toHaveClass("justify-start");
    expect(side("next day reply")).toHaveClass("justify-end");
    expect(screen.getByText("[sticker]")).toBeInTheDocument();
  });
  it("titles a nameless customer by formatted phone, shown once", () => {
    render(<ChatThread customer={{ ...customer, profileName: null }} canReply items={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: "+91 98000 00001" })).toBeInTheDocument();
    expect(screen.getAllByText("+91 98000 00001")).toHaveLength(1);
  });
  it("draws *bold* as <strong> and never as HTML", () => {
    const items = [
      { ...m("1", "out", "2026-11-16T05:00:00Z", null), payload: { type: "text", text: { body: "Order *NF-1* <b>x</b>" } } },
    ];
    render(<ChatThread customer={customer} canReply items={items} />);
    const strong = screen.getByText("NF-1");
    expect(strong.tagName).toBe("STRONG");
    expect(screen.getByText(/<b>x<\/b>/)).toBeInTheDocument();
  });
  it("shows an empty state with no messages", () => {
    render(<ChatThread customer={customer} canReply={false} items={[]} />);
    expect(screen.getByText("No messages in the last 3 days.")).toBeInTheDocument();
  });
});
