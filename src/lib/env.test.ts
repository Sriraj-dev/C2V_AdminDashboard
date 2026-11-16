import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetServerEnvForTests, serverEnv } from "@/lib/env";

describe("serverEnv", () => {
  beforeEach(() => {
    resetServerEnvForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetServerEnvForTests();
  });

  it("parses valid env", () => {
    vi.stubEnv("C2V_API_URL", "http://localhost:8080");
    vi.stubEnv("PUBLIC_APP_URL", "http://localhost:3000");
    expect(serverEnv()).toEqual({
      C2V_API_URL: "http://localhost:8080",
      PUBLIC_APP_URL: "http://localhost:3000",
    });
  });

  it("throws naming the missing keys", () => {
    vi.stubEnv("C2V_API_URL", "");
    vi.stubEnv("PUBLIC_APP_URL", "");
    expect(() => serverEnv()).toThrow(/C2V_API_URL/);
    expect(() => serverEnv()).toThrow(/PUBLIC_APP_URL/);
  });

  it("strips a trailing slash from C2V_API_URL", () => {
    vi.stubEnv("C2V_API_URL", "http://x:8080/");
    vi.stubEnv("PUBLIC_APP_URL", "http://localhost:3000");
    expect(serverEnv().C2V_API_URL).toBe("http://x:8080");
  });

  it("throws naming a key whose value is not a valid URL", () => {
    vi.stubEnv("C2V_API_URL", "not-a-url");
    vi.stubEnv("PUBLIC_APP_URL", "http://localhost:3000");
    expect(() => serverEnv()).toThrow(/C2V_API_URL/);
  });
});
