import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetServerEnvForTests } from "@/lib/env";
import { apiRequest } from "./client";

const fetchMock = vi.fn();
const call = (i: number): any[] => fetchMock.mock.calls[i]!; // eslint-disable-line @typescript-eslint/no-explicit-any

beforeEach(() => {
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

describe("apiRequest", () => {
  it("sends bearer, JSON body and no-store", async () => {
    fetchMock.mockResolvedValue(json(200, { ok: 1 }));
    await apiRequest("/admin/orders", {
      method: "POST",
      token: "t",
      body: { a: 1 },
      query: { status: "confirmed", page: 2 },
    });
    const [url, init] = call(0);
    expect(url).toBe("http://localhost:8080/admin/orders?status=confirmed&page=2");
    expect(init.method).toBe("POST");
    expect(init.cache).toBe("no-store");
    expect(init.headers.Authorization).toBe("Bearer t");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Accept).toBe("application/json");
    expect(init.body).toBe('{"a":1}');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("omits Content-Type, body and Authorization when not given", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await apiRequest("/partner/x/orders");
    const [, init] = call(0);
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it("drops undefined query values", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await apiRequest("/admin/orders", { query: { q: undefined, page: 1 } });
    expect(call(0)[0]).toBe("http://localhost:8080/admin/orders?page=1");
  });

  it("returns ok data on 2xx and undefined data on 204", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { items: [] }));
    expect(await apiRequest("/x")).toEqual({ ok: true, data: { items: [] } });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await apiRequest("/x")).toEqual({ ok: true, data: undefined });
  });

  it("maps error body", async () => {
    fetchMock.mockResolvedValue(json(409, { error: { code: "invalid_transition", message: "m" } }));
    expect(await apiRequest("/x")).toEqual({
      ok: false,
      error: { status: 409, code: "invalid_transition", message: "m" },
    });
  });

  it("keeps validation details", async () => {
    const details = [{ path: "name", message: "bad" }];
    fetchMock.mockResolvedValue(json(400, { error: { code: "validation_error", message: "Invalid", details } }));
    const r = await apiRequest("/x");
    expect(r).toEqual({ ok: false, error: { status: 400, code: "validation_error", message: "Invalid", details } });
  });

  it("maps non-JSON error to internal", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 500, headers: { "content-type": "text/html" } }));
    expect(await apiRequest("/x")).toEqual({
      ok: false,
      error: { status: 500, code: "internal", message: "Something went wrong. Try again." },
    });
  });

  it("maps network failure and timeout to network_error", async () => {
    const expected = {
      ok: false,
      error: { status: 0, code: "network_error", message: "Couldn't reach the server. Try again." },
    };
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await apiRequest("/x")).toEqual(expected);
    fetchMock.mockRejectedValueOnce(new DOMException("timeout", "TimeoutError"));
    expect(await apiRequest("/x")).toEqual(expected);
  });
});
