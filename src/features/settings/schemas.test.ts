import { describe, expect, it } from "vitest";
import { changePasswordSchema, settingsFormSchema, settingsPatchSchema } from "./schemas";

const base = { supportPhone: "", welcomeImageUrl: "", deliveryFee: "0", minOrder: "199.50" };

describe("settingsFormSchema", () => {
  it("turns empty phone and image into null and rupees into paise", () => {
    expect(settingsFormSchema.parse(base)).toEqual({
      supportPhone: null,
      welcomeImageUrl: null,
      deliveryFee: 0,
      minOrder: 19950,
    });
  });
  it("normalises an Indian mobile to 91XXXXXXXXXX", () => {
    for (const p of ["98765 43210", "+91 98765-43210", "919876543210"]) {
      expect(settingsFormSchema.parse({ ...base, supportPhone: p }).supportPhone).toBe("919876543210");
    }
  });
  it("rejects bad phones, http and long URLs, bad money", () => {
    for (const bad of [
      { supportPhone: "12345" },
      { welcomeImageUrl: "http://x.com/a.png" },
      { welcomeImageUrl: "https://x.com/" + "a".repeat(2000) },
      { welcomeImageUrl: "not a url" },
      { deliveryFee: "-1" },
      { minOrder: "100001" },
      { deliveryFee: "1.234" },
    ]) {
      expect(settingsFormSchema.safeParse({ ...base, ...bad }).success).toBe(false);
    }
  });
  it("patch rejects empty and unknown keys", () => {
    expect(settingsPatchSchema.safeParse({}).success).toBe(false);
    expect(settingsPatchSchema.safeParse({ tenantId: "x", deliveryFee: "1" }).success).toBe(false);
    expect(settingsPatchSchema.parse({ deliveryFee: "40" })).toEqual({ deliveryFee: 4000 });
  });
});

describe("changePasswordSchema", () => {
  const ok = { currentPassword: "old", newPassword: "longenough1", confirmPassword: "longenough1" };
  it("accepts a matching new password", () => {
    expect(changePasswordSchema.safeParse(ok).success).toBe(true);
  });
  it("flags a mismatch on confirmPassword", () => {
    const r = changePasswordSchema.safeParse({ ...ok, confirmPassword: "different11" });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]?.path).toEqual(["confirmPassword"]);
  });
  it("enforces lengths", () => {
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: "short", confirmPassword: "short" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, currentPassword: "" }).success).toBe(false);
  });
});
