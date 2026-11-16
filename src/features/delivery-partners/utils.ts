export function partnerShareText(name: string, link: string): string {
  return `Hi ${name}, here is your delivery link. Open it to see your orders and mark them delivered:\n${link}`;
}

/** Last 10 digits of a phone, so "+91 98765 43210", "919876543210" and "9876543210" compare equal. */
export function phoneTail(s: string): string {
  return s.replace(/\D/g, "").slice(-10);
}

/** Only the fields that differ from the saved partner. */
export function changedFields(
  partner: { name: string; phone: string },
  values: { name: string; phone: string },
): { name?: string; phone?: string } {
  const changed: { name?: string; phone?: string } = {};
  if (values.name !== partner.name) changed.name = values.name;
  if (phoneTail(values.phone) !== phoneTail(partner.phone))
    changed.phone = values.phone;
  return changed;
}
