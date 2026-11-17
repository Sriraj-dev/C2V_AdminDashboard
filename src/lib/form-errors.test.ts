import { describe, expect, it, vi } from "vitest";
import { applyFieldErrors } from "./form-errors";

const FIELDS = ["name", "phone"] as const;

describe("applyFieldErrors", () => {
  it("returns the message when there are no field errors", () => {
    const setError = vi.fn();
    expect(applyFieldErrors({ code: "conflict", message: "Already exists" }, FIELDS, setError)).toBe("Already exists");
    expect(setError).not.toHaveBeenCalled();
  });

  it("sets matching fields and returns null when all matched", () => {
    const setError = vi.fn();
    const r = applyFieldErrors(
      { code: "validation_error", message: "Check", fieldErrors: { name: "Too long", phone: "Bad phone" } },
      FIELDS,
      setError,
    );
    expect(r).toBeNull();
    expect(setError).toHaveBeenCalledWith("name", { type: "server", message: "Too long" });
    expect(setError).toHaveBeenCalledWith("phone", { type: "server", message: "Bad phone" });
  });

  it("still returns an unmatched field error alongside matched ones", () => {
    const setError = vi.fn();
    const r = applyFieldErrors(
      { code: "validation_error", message: "Check", fieldErrors: { name: "Too long", "": "Nothing to change" } },
      FIELDS,
      setError,
    );
    expect(r).toBe("Nothing to change");
    expect(setError).toHaveBeenCalledTimes(1);
  });
});
