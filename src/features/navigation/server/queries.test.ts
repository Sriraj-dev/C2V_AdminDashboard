import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockNextHeaders } from "@/test/next-mocks";

let impl: (path: string) => Promise<unknown> = async () => ({});
// Plain wrapper: a rejecting vi.fn() promise is reported by vitest as an unhandled error.
const adminRead = (path: string) => impl(path);

async function load() {
  vi.resetModules();
  mockNextHeaders();
  vi.doMock("@/lib/api/admin", () => ({ adminRead }));
  return import("./queries");
}

function chat(direction: "in" | "out", canReply: boolean) {
  return { lastMessage: { direction }, canReply };
}

describe("getNavCounts", () => {
  beforeEach(() => {
    impl = async () => ({});
  });

  it("counts refunds and chats awaiting reply", async () => {
    impl = async (path: string) =>
      path === "/admin/refunds/needed" ? { items: [{}, {}] } : { items: [chat("in", true), chat("out", true)] };
    const { getNavCounts } = await load();
    expect(await getNavCounts()).toEqual({ refunds: 2, chats: 1 });
  });
  it("returns zeros when the API fails", async () => {
    impl = async () => {
      throw new Error("boom");
    };
    const { getNavCounts } = await load();
    expect(await getNavCounts()).toEqual({ refunds: 0, chats: 0 });
  });
  it("rethrows redirects and not-found via unstable_rethrow", async () => {
    impl = async () => {
      throw new Error("NEXT_REDIRECT:/session-expired");
    };
    vi.resetModules();
    mockNextHeaders();
    vi.doMock("next/navigation", () => ({
      unstable_rethrow: (e: unknown) => {
        if (e instanceof Error && e.message.startsWith("NEXT_REDIRECT")) throw e;
      },
    }));
    vi.doMock("@/lib/api/admin", () => ({ adminRead }));
    const { getNavCounts } = await import("./queries");
    await expect(getNavCounts()).rejects.toThrow("NEXT_REDIRECT:/session-expired");
  });
});
