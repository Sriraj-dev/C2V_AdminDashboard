import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

function ignoreList(): RegExp[] {
  const logging = nextConfig.logging;
  const incoming = logging ? logging.incomingRequests : undefined;
  return typeof incoming === "object" && incoming.ignore ? incoming.ignore : [];
}

describe("next.config logging", () => {
  it("does not log server function arguments", () => {
    expect(nextConfig.logging && nextConfig.logging.serverFunctions).toBe(false);
  });
  it("ignores partner link requests but not other routes", () => {
    const ignore = ignoreList();
    expect(ignore.some((r) => r.test("/p/abc"))).toBe(true);
    expect(ignore.some((r) => r.test("/orders"))).toBe(false);
  });
});
