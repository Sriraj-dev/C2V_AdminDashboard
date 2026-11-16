/** Money is integer paise end to end. */

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatPaise(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const rupees = Math.floor(abs / 100);
  const rem = abs % 100;
  const frac = rem === 0 ? "" : `.${String(rem).padStart(2, "0")}`;
  return `${negative ? "-" : ""}₹${inr.format(rupees)}${frac}`;
}

export function rupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(paise) ? paise : null;
}

export function paiseToRupeesInput(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const rem = paise % 100;
  return rem === 0 ? String(rupees) : `${rupees}.${String(rem).padStart(2, "0")}`;
}
