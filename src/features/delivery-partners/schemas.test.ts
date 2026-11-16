import { describe, expect, it } from "vitest";
import { partnerFormSchema, partnerPatchSchema } from "./schemas";

describe("partnerFormSchema", () => {
  it.each(["9800000003", "+91 98000-00003", "919800000003"])("accepts %s", (phone) => {
    const r = partnerFormSchema.safeParse({ name: " Ravi ", phone });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Ravi");
  });
  it.each(["5800000003", "98000", ""])("rejects %s", (phone) => {
    expect(partnerFormSchema.safeParse({ name: "Ravi", phone }).success).toBe(false);
  });
  it("strips spaces and dashes from the output", () => {
    expect(partnerFormSchema.parse({ name: "R", phone: "+91 98000-00003" }).phone).toBe("+919800000003");
  });
  it("rejects empty/long names and unknown keys", () => {
    expect(partnerFormSchema.safeParse({ name: " ", phone: "9800000003" }).success).toBe(false);
    expect(partnerFormSchema.safeParse({ name: "x".repeat(61), phone: "9800000003" }).success).toBe(false);
    expect(partnerFormSchema.safeParse({ name: "R", phone: "9800000003", active: true }).success).toBe(false);
  });
});

describe("partnerPatchSchema", () => {
  it("allows a subset, rejects empty and unknown keys", () => {
    expect(partnerPatchSchema.safeParse({ name: "New" }).success).toBe(true);
    expect(partnerPatchSchema.safeParse({}).success).toBe(false);
    expect(partnerPatchSchema.safeParse({ name: "N", token: "x" }).success).toBe(false);
  });
});
