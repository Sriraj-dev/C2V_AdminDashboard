import { changedFields } from "@/lib/changed-fields";
import { paiseToRupeesInput, rupeesToPaise } from "@/lib/money";
import type { Settings } from "@/lib/api/types";
import type { SettingsFormInput } from "./schemas";

export function settingsToFormInput(s: Settings): SettingsFormInput {
  return {
    supportPhone: s.supportPhone ?? "",
    welcomeImageUrl: s.welcomeImageUrl ?? "",
    deliveryFee: paiseToRupeesInput(s.deliveryFeePaise),
    minOrder: paiseToRupeesInput(s.minOrderPaise),
  };
}

const tail = (s: string) => s.replace(/\D/g, "").slice(-10);

/** Only the fields that differ from the saved settings (phones compare by last 10 digits, money by value). */
export function settingsChanges(
  settings: Settings,
  values: SettingsFormInput,
): Partial<SettingsFormInput> {
  const saved = settingsToFormInput(settings);
  const money = (v: string) => {
    const p = rupeesToPaise(v);
    return p === null ? v.trim() : paiseToRupeesInput(p);
  };
  const phone = values.supportPhone.trim();
  const normalized: SettingsFormInput = {
    supportPhone: phone !== "" && tail(phone) === tail(saved.supportPhone) ? saved.supportPhone : phone,
    welcomeImageUrl: values.welcomeImageUrl.trim(),
    deliveryFee: money(values.deliveryFee),
    minOrder: money(values.minOrder),
  };
  return changedFields(saved, normalized);
}
