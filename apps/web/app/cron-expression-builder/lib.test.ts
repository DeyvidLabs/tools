import { describe, expect, it } from "vitest";
import { describeCron, formatRunTime, nextRunTimes, parseCron } from "./lib";

describe("parseCron", () => {
  it("parses a simple fixed-time expression", () => {
    const result = parseCron("30 4 * * *");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.minute).toEqual([30]);
    expect(result.data.hour).toEqual([4]);
    expect(result.data.dayOfMonth).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    expect(result.data.domRestricted).toBe(false);
    expect(result.data.dowRestricted).toBe(false);
  });

  it("expands comma lists", () => {
    const result = parseCron("0,15,30,45 * * * *");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.minute).toEqual([0, 15, 30, 45]);
  });

  it("expands ranges", () => {
    const result = parseCron("0 9-17 * * *");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.hour).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  it("expands step values over the full range", () => {
    const result = parseCron("*/15 * * * *");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.minute).toEqual([0, 15, 30, 45]);
  });

  it("expands a step over an explicit range", () => {
    const result = parseCron("0 0 1-10/3 * *");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.dayOfMonth).toEqual([1, 4, 7, 10]);
  });

  it("expands a step from a single start value to the field max", () => {
    const result = parseCron("5/20 * * * *");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.minute).toEqual([5, 25, 45]);
  });

  it("resolves month and weekday names, case-insensitively", () => {
    const result = parseCron("0 9 * jan,jul MON-FRI");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.month).toEqual([1, 7]);
    expect(result.data.dayOfWeek).toEqual([1, 2, 3, 4, 5]);
  });

  it("folds day-of-week 7 into 0 (Sunday)", () => {
    const result = parseCron("0 0 * * 7");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.dayOfWeek).toEqual([0]);
  });

  it("rejects blank input", () => {
    expect(parseCron("   ")).toEqual({ ok: false, error: "Enter a cron expression." });
  });

  it("rejects the wrong number of fields", () => {
    const result = parseCron("* * * *");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("5 fields");
  });

  it("rejects an out-of-range value", () => {
    const result = parseCron("0 25 * * *");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("out of range");
  });

  it("rejects a range with the end before the start", () => {
    const result = parseCron("0 17-9 * * *");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("end before start");
  });

  it("rejects a non-positive step", () => {
    const result = parseCron("*/0 * * * *");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("step must be positive");
  });

  it("rejects garbage tokens", () => {
    expect(parseCron("x * * * *").ok).toBe(false);
  });
});

describe("describeCron", () => {
  it("describes a fixed daily time", () => {
    expect(describeCron("30 4 * * *")).toBe("At 04:30, every day.");
  });

  it("describes an interval of minutes", () => {
    expect(describeCron("*/15 * * * *")).toBe("Every 15 minutes, every day.");
  });

  it("describes weekday-restricted schedules", () => {
    expect(describeCron("0 9 * * MON-FRI")).toBe("At 09:00, on Monday, Tuesday, Wednesday, Thursday, Friday.");
  });

  it("describes month restrictions", () => {
    expect(describeCron("0 0 1 JAN,JUL *")).toBe(
      "At 00:00, on day 1 of the month in January, July.",
    );
  });

  it("describes the OR semantics when both day fields are restricted", () => {
    const text = describeCron("0 0 1 * MON");
    expect(text).toContain("on day 1 of the month, or on Monday");
  });

  it("returns the parse error for invalid expressions", () => {
    expect(describeCron("bad")).toContain("5 fields");
  });
});

describe("nextRunTimes", () => {
  it("finds the next occurrences of a daily fixed-time schedule", () => {
    const parsed = parseCron("0 12 * * *");
    if (!parsed.ok) throw new Error("expected valid cron");
    const from = new Date("2026-01-01T00:00:00");
    const runs = nextRunTimes(parsed.data, from, 3);
    expect(runs).toHaveLength(3);
    expect(runs[0].getHours()).toBe(12);
    expect(runs[0].getMinutes()).toBe(0);
    expect(runs[1].getDate()).toBe(runs[0].getDate() + 1);
  });

  it("finds the next occurrences of an every-minute schedule", () => {
    const parsed = parseCron("* * * * *");
    if (!parsed.ok) throw new Error("expected valid cron");
    const from = new Date("2026-01-01T00:00:00");
    const runs = nextRunTimes(parsed.data, from, 2);
    expect(runs[0].getTime()).toBe(new Date("2026-01-01T00:01:00").getTime());
    expect(runs[1].getTime()).toBe(new Date("2026-01-01T00:02:00").getTime());
  });

  it("applies OR semantics between day-of-month and day-of-week when both are restricted", () => {
    const parsed = parseCron("0 0 1 * MON");
    if (!parsed.ok) throw new Error("expected valid cron");
    const from = new Date("2026-01-02T00:00:00");
    const runs = nextRunTimes(parsed.data, from, 1);
    expect(runs).toHaveLength(1);
    const matchesFirstOfMonth = runs[0].getDate() === 1;
    const matchesMonday = runs[0].getDay() === 1;
    expect(matchesFirstOfMonth || matchesMonday).toBe(true);
  });

  it("returns fewer results when the schedule never matches within the search window", () => {
    const parsed = parseCron("0 0 30 2 *");
    if (!parsed.ok) throw new Error("expected valid cron");
    const runs = nextRunTimes(parsed.data, new Date("2026-01-01T00:00:00"), 5);
    expect(runs).toEqual([]);
  });
});

describe("formatRunTime", () => {
  it("formats a date without ambiguous numeric day/month ordering", () => {
    const formatted = formatRunTime(new Date(2026, 0, 2, 3, 4));
    expect(formatted).not.toMatch(/^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}/);
  });
});
