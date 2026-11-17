// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const sendReply = vi.fn();
vi.mock("../server/actions", () => ({ sendReply: (...a: unknown[]) => sendReply(...a) }));

import { CLOSED_COPY, ReplyBox } from "./reply-box";

const ID = "11111111-1111-4111-8111-111111111111";

function desktop(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

beforeEach(() => desktop(true));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ReplyBox", () => {
  it("shows the 24 hour copy and no textarea when the window is closed", () => {
    render(<ReplyBox customerId={ID} canReply={false} />);
    expect(screen.getByText(CLOSED_COPY)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
  it("Enter sends on desktop, then clears and refreshes once", async () => {
    sendReply.mockResolvedValue({ ok: true, data: { message: {} } });
    render(<ReplyBox customerId={ID} canReply />);
    await userEvent.type(screen.getByRole("textbox", { name: "Reply" }), "hello{Enter}");
    await waitFor(() => expect(sendReply).toHaveBeenCalledWith(ID, { text: "hello" }));
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("Shift+Enter adds a newline and does not send", async () => {
    render(<ReplyBox customerId={ID} canReply />);
    await userEvent.type(screen.getByRole("textbox"), "a{Shift>}{Enter}{/Shift}b");
    expect(screen.getByRole("textbox")).toHaveValue("a\nb");
    expect(sendReply).not.toHaveBeenCalled();
  });
  it("Enter is a newline on phones; the Send button sends", async () => {
    desktop(false);
    sendReply.mockResolvedValue({ ok: true, data: { message: {} } });
    render(<ReplyBox customerId={ID} canReply />);
    await userEvent.type(screen.getByRole("textbox"), "a{Enter}b");
    expect(sendReply).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(sendReply).toHaveBeenCalledWith(ID, { text: "a\nb" }));
  });
  it("keeps the text and shows the message on an error", async () => {
    sendReply.mockResolvedValue({ ok: false, error: { code: "provider_error", message: "WhatsApp failed" } });
    render(<ReplyBox customerId={ID} canReply />);
    await userEvent.type(screen.getByRole("textbox"), "hello{Enter}");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("WhatsApp failed"));
    expect(screen.getByRole("textbox")).toHaveValue("hello");
    expect(refresh).not.toHaveBeenCalled();
  });
  it("on outside_reply_window shows the message and refreshes", async () => {
    sendReply.mockResolvedValue({ ok: false, error: { code: "outside_reply_window", message: "Window closed" } });
    render(<ReplyBox customerId={ID} canReply />);
    await userEvent.type(screen.getByRole("textbox"), "hello{Enter}");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Window closed"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("does not send blank text", async () => {
    render(<ReplyBox customerId={ID} canReply />);
    await userEvent.type(screen.getByRole("textbox"), "   {Enter}");
    expect(sendReply).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
