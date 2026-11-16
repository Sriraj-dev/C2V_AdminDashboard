import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetServerEnvForTests } from "@/lib/env";
import { partnerLink } from "./partner-link";

describe("partnerLink", () => {
  beforeEach(() => {
    resetServerEnvForTests();
    vi.stubEnv("C2V_API_URL", "http://localhost:8080");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    resetServerEnvForTests();
  });

  it("builds the link from PUBLIC_APP_URL", () => {
    vi.stubEnv("PUBLIC_APP_URL", "http://localhost:3000");
    expect(partnerLink("t".repeat(43))).toBe(`http://localhost:3000/p/${"t".repeat(43)}`);
  });
  it("strips a trailing slash", () => {
    vi.stubEnv("PUBLIC_APP_URL", "https://app.example.com/");
    expect(partnerLink("abc")).toBe("https://app.example.com/p/abc");
  });
});
