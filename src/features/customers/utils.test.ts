import { describe, expect, it } from "vitest";
import { displayName, mapHref } from "./utils";

const addr = { name: "Asha", line1: "1 St", pincode: "560001" };

describe("displayName", () => {
  it("prefers the profile name", () => {
    expect(displayName({ profileName: "Ravi", defaultAddress: addr })).toBe("Ravi");
  });
  it("falls back to the address name", () => {
    expect(displayName({ profileName: null, defaultAddress: addr })).toBe("Asha");
    expect(displayName({ profileName: "  ", defaultAddress: addr })).toBe("Asha");
  });
  it("falls back to Unknown", () => {
    expect(displayName({ profileName: null, defaultAddress: null })).toBe("Unknown");
  });
});

describe("mapHref", () => {
  it("builds a maps link", () => {
    expect(mapHref({ lat: 12.97, lng: 77.59 })).toBe("https://maps.google.com/?q=12.97,77.59");
  });
});
