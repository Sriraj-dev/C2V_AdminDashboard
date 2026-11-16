import { describe, expect, it } from "vitest";
import { formatPhone, telHref, toFullPhone } from "./format";

describe("format", () => {
  it("normalises phones", () => {
    expect(toFullPhone("9800000001")).toBe("919800000001");
    expect(toFullPhone("919800000001")).toBe("919800000001");
  });
  it("formats phones for display", () => {
    expect(formatPhone("919800000001")).toBe("+91 98000 00001");
    expect(formatPhone("9800000001")).toBe("+91 98000 00001");
  });
  it("builds tel links", () => {
    expect(telHref("9800000001")).toBe("tel:+919800000001");
  });
});
