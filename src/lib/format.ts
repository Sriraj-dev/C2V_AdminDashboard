/** Phone numbers are stored as 91XXXXXXXXXX. */

export function toFullPhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export function formatPhone(p: string): string {
  const full = toFullPhone(p);
  if (full.length !== 12 || !full.startsWith("91")) return p;
  const n = full.slice(2);
  return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
}

export function telHref(p: string): string {
  return `tel:+${toFullPhone(p)}`;
}

/** "Near <landmark>", without doubling "Near" when the customer already wrote it. */
export function nearLandmark(landmark: string): string {
  const t = landmark.trim();
  return /^near\b/i.test(t) ? t : `Near ${t}`;
}
