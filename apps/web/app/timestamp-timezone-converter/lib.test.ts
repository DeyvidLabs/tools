import { describe, expect, it } from "vitest";
import {
  convertBatch,
  formatTimestamp,
  getAvailableTimeZones,
  parseTimestamp,
} from "./lib";

describe("parseTimestamp", () => {
  it("auto-detects unix seconds", () => {
    const date = parseTimestamp("1700000000");
    expect(date?.toISOString()).toBe("2023-11-14T22:13:20.000Z");
  });

  it("auto-detects unix milliseconds", () => {
    const date = parseTimestamp("1700000000000");
    expect(date?.toISOString()).toBe("2023-11-14T22:13:20.000Z");
  });

  it("auto-detects ISO 8601", () => {
    const date = parseTimestamp("2023-11-14T22:13:20.000Z");
    expect(date?.toISOString()).toBe("2023-11-14T22:13:20.000Z");
  });

  it("respects an explicit unit over auto-detection", () => {
    const date = parseTimestamp("1700000000", "unix-ms");
    expect(date?.toISOString()).toBe("1970-01-20T16:13:20.000Z");
  });

  it("rejects non-numeric input for unix units", () => {
    expect(parseTimestamp("not-a-number", "unix-s")).toBeNull();
  });

  it("rejects unparseable ISO input", () => {
    expect(parseTimestamp("not-a-date", "iso8601")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseTimestamp("   ")).toBeNull();
  });
});

describe("formatTimestamp", () => {
  it("produces unix seconds, unix ms, ISO, and a timezone-aware human string", () => {
    const date = new Date("2023-11-14T22:13:20.000Z");
    const result = formatTimestamp(date, "UTC");
    expect(result.unixSeconds).toBe(1700000000);
    expect(result.unixMs).toBe(1700000000000);
    expect(result.iso).toBe("2023-11-14T22:13:20.000Z");
    expect(result.human).toContain("2023");
  });

  it("renders the human string in the requested time zone", () => {
    const date = new Date("2023-11-14T22:13:20.000Z");
    const tokyo = formatTimestamp(date, "Asia/Tokyo").human;
    const utc = formatTimestamp(date, "UTC").human;
    expect(tokyo).not.toBe(utc);
  });
});

describe("convertBatch", () => {
  it("converts each non-empty line independently", () => {
    const results = convertBatch("1700000000\n\n2023-11-14T22:13:20.000Z", "UTC");
    expect(results).toHaveLength(2);
    expect(results[0].result?.unixSeconds).toBe(1700000000);
    expect(results[1].result?.unixSeconds).toBe(1700000000);
  });

  it("reports a null result for lines that fail to parse", () => {
    const results = convertBatch("garbage", "UTC", "unix-s");
    expect(results[0].result).toBeNull();
    expect(results[0].input).toBe("garbage");
  });
});

describe("getAvailableTimeZones", () => {
  it("includes UTC", () => {
    expect(getAvailableTimeZones()).toContain("UTC");
  });
});
