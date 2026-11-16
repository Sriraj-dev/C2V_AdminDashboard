import { describe, expect, it } from "vitest";
import { waShareUrl } from "./whatsapp";

describe("waShareUrl", () => {
  it("encodes the text", () => {
    expect(waShareUrl("919800000002", "a b")).toBe("https://wa.me/919800000002?text=a%20b");
  });
  it("encodes newlines and symbols", () => {
    expect(waShareUrl("919800000002", "x\n1. & y")).toBe("https://wa.me/919800000002?text=x%0A1.%20%26%20y");
  });
  it("keeps digits only in the phone", () => {
    expect(waShareUrl("+91 98000 00002", "hi")).toBe("https://wa.me/919800000002?text=hi");
  });
});
