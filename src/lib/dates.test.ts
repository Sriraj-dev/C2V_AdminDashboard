import { describe, expect, it } from "vitest";
import { addDays, formatDate, formatRelative, formatDateTime, formatDeliveryDate, todayInIST, weekdayName, WEEKDAYS } from "./dates";

describe("dates", () => {
  it("computes today in IST", () => {
    expect(todayInIST(new Date("2026-11-15T19:00:00Z"))).toBe("2026-11-16");
    expect(todayInIST(new Date("2026-11-15T18:29:00Z"))).toBe("2026-11-15");
  });
  it("formats delivery dates and date-times", () => {
    expect(formatDeliveryDate("2026-11-18")).toBe("Wed, 18 Nov");
    expect(formatDateTime("2026-11-14T06:15:03.000Z")).toBe("14 Nov, 11:45 am");
    expect(formatDateTime("2026-11-14T10:00:00.000Z")).toBe("14 Nov, 3:30 pm");
    expect(formatDateTime("2026-11-14T18:35:00.000Z")).toBe("15 Nov, 12:05 am");
  });
  it("names weekdays", () => {
    expect(weekdayName(0)).toBe("Sunday");
    expect(weekdayName(6)).toBe("Saturday");
    expect(WEEKDAYS).toHaveLength(7);
  });
  it("adds days across month boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("isValidYmd", () => {
  it("accepts real dates and rejects impossible or malformed ones", async () => {
    const { isValidYmd } = await import("./dates");
    expect(isValidYmd("2026-11-18")).toBe(true);
    expect(isValidYmd("2024-02-29")).toBe(true);
    expect(isValidYmd("2026-02-31")).toBe(false);
    expect(isValidYmd("2026-13-01")).toBe(false);
    expect(isValidYmd("2026-1-1")).toBe(false);
    expect(isValidYmd("")).toBe(false);
  });

  it("formats a date only, in IST", () => {
    expect(formatDate("2026-03-05T20:00:00Z")).toBe("6 Mar 2026");
  });
  it("formats relative times", () => {
    const now = new Date("2026-11-16T12:00:00Z");
    expect(formatRelative("2026-11-16T11:59:30Z", now)).toBe("now");
    expect(formatRelative("2026-11-16T11:55:00Z", now)).toBe("5m");
    expect(formatRelative("2026-11-16T09:00:00Z", now)).toBe("3h");
    expect(formatRelative("2026-11-14T18:35:00Z", now)).toBe("15 Nov");
    expect(formatRelative("2026-11-17T12:00:00Z", now)).toBe("now");
  });
});
