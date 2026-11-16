import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockNextHeaders } from "@/test/next-mocks";

const fetchMock = vi.fn();
const call = (i: number): any[] => fetchMock.mock.calls[i]!; // eslint-disable-line @typescript-eslint/no-explicit-any

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  vi.resetModules();
  mockNextHeaders();
  vi.stubEnv("C2V_API_URL", "http://localhost:8080");
  vi.stubEnv("PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("partnerRead / partnerWrite", () => {
  it("builds /partner/<encoded token>/orders and sends no Authorization header", async () => {
    fetchMock.mockResolvedValue(json(200, { items: [] }));
    const { partnerRead } = await import("./partner");
    expect(await partnerRead("a/b c", "/orders")).toEqual({ items: [] });
    const [url, init] = call(0);
    expect(url).toBe("http://localhost:8080/partner/a%2Fb%20c/orders");
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("partnerRead calls notFound on 404", async () => {
    fetchMock.mockResolvedValue(json(404, { error: { code: "not_found", message: "no" } }));
    const { partnerRead } = await import("./partner");
    await expect(partnerRead("t", "/orders")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("partnerRead throws ApiRequestError on other errors", async () => {
    fetchMock.mockResolvedValue(json(500, { error: { code: "internal", message: "boom" } }));
    const { partnerRead } = await import("./partner");
    const { ApiRequestError } = await import("./client");
    await expect(partnerRead("t", "/orders")).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("partnerWrite POSTs and returns the result, including errors", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { order: {}, notified: true }));
    const { partnerWrite } = await import("./partner");
    expect(await partnerWrite("t", "/orders/o1/delivered")).toEqual({ ok: true, data: { order: {}, notified: true } });
    expect(call(0)[1].method).toBe("POST");
    expect(call(0)[0]).toBe("http://localhost:8080/partner/t/orders/o1/delivered");
    expect(call(0)[1].headers.Authorization).toBeUndefined();

    fetchMock.mockResolvedValueOnce(json(409, { error: { code: "invalid_transition", message: "m" } }));
    expect(await partnerWrite("t", "/orders/o1/delivered")).toEqual({
      ok: false,
      error: { status: 409, code: "invalid_transition", message: "m" },
    });
  });
});
