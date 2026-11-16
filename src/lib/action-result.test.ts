import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fromApiError, validationFailed } from "./action-result";

describe("action-result", () => {
  it("maps api error details to field errors, first message wins", () => {
    expect(
      fromApiError({
        status: 400,
        code: "validation_error",
        message: "Invalid",
        details: [
          { path: "name", message: "first" },
          { path: "name", message: "second" },
          { path: "pricePaise", message: "low" },
        ],
      }),
    ).toEqual({ code: "validation_error", message: "Invalid", fieldErrors: { name: "first", pricePaise: "low" } });
  });

  it("omits fieldErrors when there are no details", () => {
    expect(fromApiError({ status: 409, code: "conflict", message: "m" })).toEqual({ code: "conflict", message: "m" });
  });

  it("maps zod errors", () => {
    const r = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
    if (r.success) throw new Error("expected failure");
    const e = validationFailed(r.error);
    expect(e.code).toBe("validation_error");
    expect(e.message).toBe("Check the highlighted fields.");
    expect(Object.keys(e.fieldErrors ?? {})).toEqual(["name"]);
  });
});
