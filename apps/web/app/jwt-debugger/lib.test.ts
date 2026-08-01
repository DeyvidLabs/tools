import { describe, expect, it } from "vitest";
import { decodeJwt, expiryStatus, formatDate, timeClaims } from "./lib";

// { "alg": "HS256", "typ": "JWT" } / { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("decodeJwt", () => {
  it("decodes a well-formed token's header, payload, and signature", () => {
    const result = decodeJwt(SAMPLE_JWT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result.data.payload).toEqual({ sub: "1234567890", name: "John Doe", iat: 1516239022 });
    expect(result.data.signature).toBe("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
  });

  it("decodes base64url characters (- and _) that base64 doesn't use", () => {
    // payload: {"note":"a?b>c"} — base64 of the JSON contains a '+' that
    // becomes '-' and a '/' that becomes '_' once made URL-safe.
    const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const payload = "eyJub3RlIjoiYT9iPmMifQ";
    const result = decodeJwt(`${header}.${payload}.sig`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.payload).toEqual({ note: "a?b>c" });
  });

  it("rejects blank input", () => {
    const result = decodeJwt("   ");
    expect(result).toEqual({ ok: false, error: "Paste a JWT to decode." });
  });

  it("rejects tokens without exactly 3 parts", () => {
    expect(decodeJwt("only.two").ok).toBe(false);
    expect(decodeJwt("a.b.c.d").ok).toBe(false);
  });

  it("rejects a header or payload that isn't valid JSON", () => {
    expect(decodeJwt("not-base64.eyJhIjoxfQ.sig").ok).toBe(false);
    expect(decodeJwt("eyJhbGciOiJIUzI1NiJ9.not-base64.sig").ok).toBe(false);
  });

  it("rejects a header or payload that decodes to a non-object", () => {
    // "[1,2,3]" base64url-encoded
    const arrayPart = "WzEsMiwzXQ";
    const validPayload = "eyJhIjoxfQ";
    expect(decodeJwt(`${arrayPart}.${validPayload}.sig`).ok).toBe(false);
  });
});

describe("expiryStatus", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("reports expired when exp is in the past", () => {
    const exp = now.getTime() / 1000 - 3600;
    const info = expiryStatus({ exp }, now);
    expect(info.status).toBe("expired");
    expect(info.message).toContain("ago");
  });

  it("reports valid when exp is in the future", () => {
    const exp = now.getTime() / 1000 + 3600;
    const info = expiryStatus({ exp }, now);
    expect(info.status).toBe("valid");
    expect(info.message).toContain("in ");
  });

  it("reports not-yet-valid when nbf is in the future", () => {
    const nbf = now.getTime() / 1000 + 3600;
    const info = expiryStatus({ nbf, exp: nbf + 100 }, now);
    expect(info.status).toBe("not-yet-valid");
  });

  it("reports unknown when there is no exp claim", () => {
    const info = expiryStatus({ sub: "abc" }, now);
    expect(info.status).toBe("unknown");
  });

  it("ignores a non-numeric exp claim", () => {
    const info = expiryStatus({ exp: "not-a-number" }, now);
    expect(info.status).toBe("unknown");
  });
});

describe("timeClaims", () => {
  it("extracts iat/exp/nbf as dates, preserving key order", () => {
    const claims = timeClaims({ iat: 1000, exp: 2000, sub: "x" });
    expect(claims.map((c) => c.key)).toEqual(["iat", "exp"]);
    expect(claims[0].date).toEqual(new Date(1000 * 1000));
  });

  it("returns an empty array when no time claims are present", () => {
    expect(timeClaims({ sub: "x" })).toEqual([]);
  });
});

describe("formatDate", () => {
  it("spells out the month so day/month order can't be misread", () => {
    const formatted = formatDate(new Date(Date.UTC(2026, 0, 2, 3, 4, 5)));
    expect(formatted).not.toMatch(/^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}/);
  });
});
