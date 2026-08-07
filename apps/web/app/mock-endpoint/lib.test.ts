import { describe, expect, it } from "vitest";
import { formatExpiry, headerRowsToRecord, parseResponseBody } from "./lib";

describe("formatExpiry", () => {
  const now = new Date("2026-01-01T00:00:00Z").getTime();

  it("reports an already-expired endpoint", () => {
    const past = new Date(now - 1000).toISOString();
    expect(formatExpiry(past, now)).toBe("Expired");
  });

  it("spells out the month in the absolute date, so day/month order can't be misread", () => {
    const future = new Date(now + 3 * 24 * 60 * 60_000).toISOString();
    const formatted = formatExpiry(future, now);
    expect(formatted.startsWith("Expires ")).toBe(true);
    expect(formatted).not.toMatch(/\d{1,2}[/.]\d{1,2}[/.]\d{2,4}/);
  });
});

describe("headerRowsToRecord", () => {
  it("drops rows with a blank key", () => {
    expect(
      headerRowsToRecord([
        { key: "X-Test", value: "1" },
        { key: "  ", value: "ignored" },
        { key: "", value: "" },
      ]),
    ).toEqual({ "X-Test": "1" });
  });

  it("trims header keys but not values", () => {
    expect(headerRowsToRecord([{ key: "  X-Test  ", value: " padded " }])).toEqual({
      "X-Test": " padded ",
    });
  });

  it("returns an empty object for no rows", () => {
    expect(headerRowsToRecord([])).toEqual({});
  });
});

describe("parseResponseBody", () => {
  it("returns undefined for empty or whitespace-only input", () => {
    expect(parseResponseBody("")).toBeUndefined();
    expect(parseResponseBody("   ")).toBeUndefined();
  });

  it("parses a JSON object", () => {
    expect(parseResponseBody('{"error":"nope"}')).toEqual({ error: "nope" });
  });

  it("parses a JSON array, string, number, and boolean", () => {
    expect(parseResponseBody("[1,2,3]")).toEqual([1, 2, 3]);
    expect(parseResponseBody('"hello"')).toBe("hello");
    expect(parseResponseBody("42")).toBe(42);
    expect(parseResponseBody("false")).toBe(false);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseResponseBody("{not valid json")).toThrow();
  });
});
