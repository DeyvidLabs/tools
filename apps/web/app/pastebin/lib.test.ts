import { describe, expect, it } from "vitest";
import { formatExpiry } from "./lib";

describe("formatExpiry", () => {
  const now = new Date("2026-01-01T00:00:00Z").getTime();

  it("reports never-expiring pastes", () => {
    expect(formatExpiry(null, now)).toBe("Never expires");
  });

  it("reports an already-expired paste", () => {
    const past = new Date(now - 1000).toISOString();
    expect(formatExpiry(past, now)).toBe("Expired");
  });

  it("formats a sub-hour delta in minutes", () => {
    const soon = new Date(now + 30 * 60_000).toISOString();
    expect(formatExpiry(soon, now)).toBe("Expires in 30m");
  });

  it("formats a sub-day delta in hours", () => {
    const later = new Date(now + 5 * 60 * 60_000).toISOString();
    expect(formatExpiry(later, now)).toBe("Expires in 5h");
  });

  it("formats a multi-day delta in days", () => {
    const future = new Date(now + 3 * 24 * 60 * 60_000).toISOString();
    expect(formatExpiry(future, now)).toBe("Expires in 3d");
  });
});
