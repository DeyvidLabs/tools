import { describe, expect, it } from "vitest";
import { formatExpiry } from "./lib";

describe("formatExpiry", () => {
  const now = new Date("2026-01-01T00:00:00Z").getTime();

  it("reports never-expiring short links", () => {
    expect(formatExpiry(null, now)).toBe("Never expires");
  });

  it("reports an already-expired short link", () => {
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
