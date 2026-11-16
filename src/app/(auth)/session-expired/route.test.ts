import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /session-expired", () => {
  it("deletes the session cookie and redirects to /login?expired=1", async () => {
    const res = await GET(new Request("http://localhost:3000/session-expired"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?expired=1");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("c2v_session=;");
    expect(setCookie.toLowerCase()).toMatch(/max-age=0|expires=thu, 01 jan 1970/);
  });
});
