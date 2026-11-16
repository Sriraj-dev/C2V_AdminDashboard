import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

function req(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie: `c2v_session=${cookie}` } } : {});
}

describe("proxy", () => {
  it("redirects /orders to /login when no cookie", () => {
    const res = proxy(req("/orders"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });
  it("lets /orders through with a cookie", () => {
    const res = proxy(req("/orders", "tok"));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
  it("never guards /login, /session-expired, /p/<token>", () => {
    for (const path of ["/login", "/session-expired", "/p/abc123", "/p/abc/orders"]) {
      const res = proxy(req(path));
      expect(res.headers.get("location"), path).toBeNull();
    }
  });
  it("redirects /login to / when a cookie exists", () => {
    const res = proxy(req("/login", "tok"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });
  it("does not redirect /session-expired or /p/ even with a cookie", () => {
    expect(proxy(req("/session-expired", "tok")).headers.get("location")).toBeNull();
    expect(proxy(req("/p/abc", "tok")).headers.get("location")).toBeNull();
  });
  it("does not redirect a POST to /login even with a cookie", () => {
    const res = proxy(new NextRequest("http://localhost:3000/login", { method: "POST", headers: { cookie: "c2v_session=tok" } }));
    expect(res.headers.get("location")).toBeNull();
  });
  it("matcher excludes static assets and favicon but not app routes", () => {
    const m = config.matcher as string[];
    expect(m).toHaveLength(1);
    const re = new RegExp("^" + m[0] + "$");
    expect(re.test("/_next/static/x.js")).toBe(false);
    expect(re.test("/favicon.ico")).toBe(false);
    expect(re.test("/orders")).toBe(true);
    expect(re.test("/p/abc")).toBe(true);
  });
});
