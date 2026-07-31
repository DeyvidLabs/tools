import { describe, expect, it } from "vitest";
import {
  buildCaptureUrl,
  displayBody,
  formatRelativeTime,
  sameRequestIds,
  type CapturedRequest,
} from "./lib";

function buildRequest(overrides: Partial<CapturedRequest> = {}): CapturedRequest {
  return {
    id: "req-1",
    method: "POST",
    headers: {},
    query: {},
    contentType: null,
    body: null,
    bodyEncoding: "utf8",
    sourceIp: null,
    receivedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildCaptureUrl", () => {
  it("joins the origin, capture path, and bin id", () => {
    expect(buildCaptureUrl("https://tools.example", "abc-123")).toBe(
      "https://tools.example/api/webhook/capture/abc-123",
    );
  });
});

describe("displayBody", () => {
  it("reports no body", () => {
    const result = displayBody(buildRequest({ body: null }));
    expect(result).toEqual({ text: "(no body)", isBinary: false });
  });

  it("flags base64 bodies as binary without decoding them", () => {
    const result = displayBody(
      buildRequest({ body: "//5f", bodyEncoding: "base64" }),
    );
    expect(result.isBinary).toBe(true);
    expect(result.text).not.toContain("//5f");
  });

  it("pretty-prints a JSON body when the content-type says JSON", () => {
    const result = displayBody(
      buildRequest({
        contentType: "application/json",
        body: '{"hello":"world"}',
      }),
    );
    expect(result.isBinary).toBe(false);
    expect(result.text).toBe(JSON.stringify({ hello: "world" }, null, 2));
  });

  it("falls back to raw text when the JSON content-type body doesn't actually parse", () => {
    const result = displayBody(
      buildRequest({ contentType: "application/json", body: "not json" }),
    );
    expect(result).toEqual({ text: "not json", isBinary: false });
  });

  it("returns plain text bodies as-is", () => {
    const result = displayBody(
      buildRequest({ contentType: "text/plain", body: "hello there" }),
    );
    expect(result).toEqual({ text: "hello there", isBinary: false });
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-01-01T00:10:00.000Z").getTime();

  it("returns 'just now' for very recent timestamps", () => {
    expect(formatRelativeTime("2026-01-01T00:09:58.000Z", now)).toBe("just now");
  });

  it("formats seconds", () => {
    expect(formatRelativeTime("2026-01-01T00:09:30.000Z", now)).toBe("30s ago");
  });

  it("formats minutes", () => {
    expect(formatRelativeTime("2026-01-01T00:05:00.000Z", now)).toBe("5m ago");
  });

  it("formats hours", () => {
    expect(formatRelativeTime("2025-12-31T22:10:00.000Z", now)).toBe("2h ago");
  });

  it("formats days", () => {
    expect(formatRelativeTime("2025-12-28T00:10:00.000Z", now)).toBe("4d ago");
  });
});

describe("sameRequestIds", () => {
  it("is true for two empty lists", () => {
    expect(sameRequestIds([], [])).toBe(true);
  });

  it("is true when ids match in the same order", () => {
    const a = [buildRequest({ id: "1" }), buildRequest({ id: "2" })];
    const b = [buildRequest({ id: "1" }), buildRequest({ id: "2" })];
    expect(sameRequestIds(a, b)).toBe(true);
  });

  it("is false when a new request is appended", () => {
    const a = [buildRequest({ id: "1" })];
    const b = [buildRequest({ id: "2" }), buildRequest({ id: "1" })];
    expect(sameRequestIds(a, b)).toBe(false);
  });

  it("is false when the lengths differ", () => {
    const a = [buildRequest({ id: "1" })];
    const b: CapturedRequest[] = [];
    expect(sameRequestIds(a, b)).toBe(false);
  });

  it("is false when the order changes even with the same ids", () => {
    const a = [buildRequest({ id: "1" }), buildRequest({ id: "2" })];
    const b = [buildRequest({ id: "2" }), buildRequest({ id: "1" })];
    expect(sameRequestIds(a, b)).toBe(false);
  });
});
