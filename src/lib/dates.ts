/** Dates are stored in UTC and shown in Asia/Kolkata. Delivery dates are YYYY-MM-DD calendar days. */

const TZ = "Asia/Kolkata";

export const WEEKDAYS: readonly string[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function weekdayName(n: number): string {
  return WEEKDAYS[n] ?? "";
}

function parts(fmt: Intl.DateTimeFormat, date: Date): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  return out;
}

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayInIST(now: Date = new Date()): string {
  const p = parts(ymdFmt, now);
  return `${p.year}-${p.month}-${p.day}`;
}

const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatDateTime(iso: string): string {
  const p = parts(dateTimeFmt, new Date(iso));
  return `${p.day} ${p.month}, ${p.hour}:${p.minute} ${(p.dayPeriod ?? "").toLowerCase()}`;
}

const deliveryFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

export function formatDeliveryDate(ymd: string): string {
  const p = parts(deliveryFmt, new Date(`${ymd}T00:00:00Z`));
  return `${p.weekday}, ${p.day} ${p.month}`;
}

export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Strict YYYY-MM-DD check: the date must exist (rejects 2026-02-31). */
export function isValidYmd(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === s;
}
