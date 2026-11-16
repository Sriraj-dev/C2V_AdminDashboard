import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetServerEnvForTests } from "@/lib/env";
import { mockNextHeaders } from "@/test/next-mocks";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetModules();
  resetServerEnvForTests();
  vi.stubEnv("C2V_API_URL", "http://localhost:8080");
  vi.stubEnv("PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const user = { username: "acme", tenantId: "nutrifarm", tenantName: "NutriFarm Eggs" };

describe("loginAction", () => {
  it("logs in: posts credentials, sets cookie from token/expiresAt, redirects to /", async () => {
    const { jar } = mockNextHeaders();
    fetchMock.mockResolvedValue(json(200, { token: "tok", expiresAt: "2026-12-15T09:30:00.000Z", user }));
    const { loginAction } = await import("./actions");
    await expect(loginAction({ username: " acme ", password: "pw" })).rejects.toThrow("NEXT_REDIRECT:/");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://localhost:8080/admin/auth/login");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({ username: "acme", password: "pw" });
    expect(jar.set).toHaveBeenCalledWith(
      "c2v_session",
      "tok",
      expect.objectContaining({ httpOnly: true, expires: new Date("2026-12-15T09:30:00.000Z") }),
    );
  });

  it("wrong password returns the API message, sets no cookie", async () => {
    const { jar, redirect } = mockNextHeaders();
    fetchMock.mockResolvedValue(json(401, { error: { code: "invalid_credentials", message: "Wrong username or password." } }));
    const { loginAction } = await import("./actions");
    await expect(loginAction({ username: "acme", password: "bad" })).resolves.toEqual({
      ok: false,
      error: { code: "invalid_credentials", message: "Wrong username or password." },
    });
    expect(jar.set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects empty username without calling the API", async () => {
    mockNextHeaders();
    const { loginAction } = await import("./actions");
    const r = await loginAction({ username: "   ", password: "pw" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("validation_error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unknown keys (tenantId) without calling the API", async () => {
    mockNextHeaders();
    const { loginAction } = await import("./actions");
    const r = await loginAction({ username: "acme", password: "pw", tenantId: "other" } as never);
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("logoutAction", () => {
  it("clears the cookie even when the API call fails, and redirects to /login", async () => {
    const { jar } = mockNextHeaders({ c2v_session: "tok" });
    fetchMock.mockResolvedValue(json(401, { error: { code: "unauthorized", message: "x" } }));
    const { logoutAction } = await import("./actions");
    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://localhost:8080/admin/auth/logout");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(jar.delete).toHaveBeenCalledWith("c2v_session");
  });

  it("skips the API call when there is no token", async () => {
    const { jar } = mockNextHeaders();
    const { logoutAction } = await import("./actions");
    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(jar.delete).toHaveBeenCalledWith("c2v_session");
  });
});
