import { describe, expect, it } from "vitest";
import { addDays, formatDateTime, formatDeliveryDate, todayInIST, weekdayName, WEEKDAYS } from "./dates";

describe("dates", () => {
  it("computes today in IST", () => {
    expect(todayInIST(new Date("2026-11-15T19:00:00Z"))).toBe("2026-11-16");
    expect(todayInIST(new Date("2026-11-15T18:29:00Z"))).toBe("2026-11-15");
  });
  it("formats delivery dates and date-times", () => {
    expect(formatDeliveryDate("2026-11-18")).toBe("Wed, 18 Nov");
    expect(formatDateTime("2026-11-14T06:15:03.000Z")).toBe("14 Nov, 11:45 am");
    expect(formatDateTime("2026-11-14T10:00:00.000Z")).toBe("14 Nov, 3:30 pm");
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
