import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockNextHeaders } from "@/test/next-mocks";

const fetchMock = vi.fn();
const call = (i: number): any[] => fetchMock.mock.calls[i]!; // eslint-disable-line @typescript-eslint/no-explicit-any

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("C2V_API_URL", "http://localhost:8080");
  vi.stubEnv("PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("adminRead", () => {
  it("redirects to /session-expired with no cookie, without calling fetch", async () => {
    mockNextHeaders();
    const { adminRead } = await import("./admin");
    await expect(adminRead("/admin/me")).rejects.toThrow("NEXT_REDIRECT:/session-expired");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns data and sends the bearer token", async () => {
    mockNextHeaders({ c2v_session: "tok" });
    fetchMock.mockResolvedValue(json(200, { user: 1 }));
    const { adminRead } = await import("./admin");
    expect(await adminRead("/admin/orders", { page: 2 })).toEqual({ user: 1 });
    expect(call(0)[0]).toBe("http://localhost:8080/admin/orders?page=2");
    expect(call(0)[1].headers.Authorization).toBe("Bearer tok");
  });

  it("redirects to /session-expired on 401", async () => {
    mockNextHeaders({ c2v_session: "tok" });
    fetchMock.mockResolvedValue(json(401, { error: { code: "unauthorized", message: "no" } }));
    const { adminRead } = await import("./admin");
    await expect(adminRead("/admin/me")).rejects.toThrow("NEXT_REDIRECT:/session-expired");
  });

  it("calls notFound on 404", async () => {
    mockNextHeaders({ c2v_session: "tok" });
    fetchMock.mockResolvedValue(json(404, { error: { code: "not_found", message: "no" } }));
    const { adminRead } = await import("./admin");
    await expect(adminRead("/admin/orders/x")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("throws ApiRequestError on 500", async () => {
    mockNextHeaders({ c2v_session: "tok" });
    fetchMock.mockResolvedValue(json(500, { error: { code: "internal", message: "boom" } }));
    const { adminRead } = await import("./admin");
    const { ApiRequestError } = await import("./client");
    const err = await adminRead("/admin/me").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect((err as InstanceType<typeof ApiRequestError>).error.status).toBe(500);
  });
});

describe("adminWrite", () => {
  it("redirects to /login?expired=1 with no cookie, without calling fetch", async () => {
    const { jar } = mockNextHeaders();
    const { adminWrite } = await import("./admin");
    await expect(adminWrite("/admin/x", { body: {} })).rejects.toThrow("NEXT_REDIRECT:/login?expired=1");
    expect(jar.delete).toHaveBeenCalledWith("c2v_session");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("on 401 clears the cookie then redirects to /login?expired=1", async () => {
    const { jar } = mockNextHeaders({ c2v_session: "tok" });
    fetchMock.mockResolvedValue(json(401, { error: { code: "unauthorized", message: "no" } }));
    const { adminWrite } = await import("./admin");
    await expect(adminWrite("/admin/x", { method: "POST" })).rejects.toThrow("NEXT_REDIRECT:/login?expired=1");
    expect(jar.delete).toHaveBeenCalledWith("c2v_session");
  });

  it("returns ok data on success with POST by default", async () => {
    mockNextHeaders({ c2v_session: "tok" });
    fetchMock.mockResolvedValue(json(200, { order: 1 }));
    const { adminWrite } = await import("./admin");
    expect(await adminWrite("/admin/x")).toEqual({ ok: true, data: { order: 1 } });
    expect(call(0)[1].method).toBe("POST");
  });

  it("returns the error result on 409 without redirecting", async () => {
    const { jar } = mockNextHeaders({ c2v_session: "tok" });
    fetchMock.mockResolvedValue(json(409, { error: { code: "invalid_transition", message: "m" } }));
    const { adminWrite } = await import("./admin");
    expect(await adminWrite("/admin/x", { method: "POST" })).toEqual({
      ok: false,
      error: { status: 409, code: "invalid_transition", message: "m" },
    });
    expect(jar.delete).not.toHaveBeenCalled();
  });
});
