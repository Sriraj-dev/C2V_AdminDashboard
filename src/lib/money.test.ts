import { describe, expect, it } from "vitest";
import { formatPaise, paiseToRupeesInput, rupeesToPaise } from "./money";

describe("money", () => {
  it("formats paise as rupees with Indian grouping", () => {
    expect(formatPaise(57000)).toBe("₹570");
    expect(formatPaise(1250)).toBe("₹12.50");
    expect(formatPaise(12345600)).toBe("₹1,23,456");
  });
  it("parses rupee input to paise", () => {
    expect(rupeesToPaise("570")).toBe(57000);
    expect(rupeesToPaise("12.5")).toBe(1250);
    expect(rupeesToPaise(" ₹1,200 ")).toBe(120000);
    expect(rupeesToPaise("0.10")).toBe(10);
  });
  it("rejects invalid input", () => {
    expect(rupeesToPaise("1.234")).toBeNull();
    expect(rupeesToPaise("")).toBeNull();
    expect(rupeesToPaise("-5")).toBeNull();
    expect(rupeesToPaise("abc")).toBeNull();
  });
  it("formats paise for an input field", () => {
    expect(paiseToRupeesInput(1250)).toBe("12.50");
    expect(paiseToRupeesInput(57000)).toBe("570");
  });
});
