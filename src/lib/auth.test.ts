import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockNextHeaders } from "@/test/next-mocks";

beforeEach(() => {
  vi.resetModules();
});

describe("session cookie", () => {
  it("sets an httpOnly lax cookie that expires with the session", async () => {
    const jar = mockNextHeaders();
    const { setSession } = await import("./auth");
    await setSession("tok", "2026-12-15T09:30:00.000Z");
    expect(jar.set).toHaveBeenCalledWith("c2v_session", "tok", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      expires: new Date("2026-12-15T09:30:00.000Z"),
    });
  });

  it("reads the token, or null when absent", async () => {
    mockNextHeaders({ c2v_session: "abc" });
    const { getSessionToken } = await import("./auth");
    expect(await getSessionToken()).toBe("abc");
    vi.resetModules();
    mockNextHeaders();
    const again = await import("./auth");
    expect(await again.getSessionToken()).toBeNull();
  });

  it("clears the cookie", async () => {
    const jar = mockNextHeaders({ c2v_session: "abc" });
    const { clearSession } = await import("./auth");
    await clearSession();
    expect(jar.delete).toHaveBeenCalledWith("c2v_session");
  });
});
