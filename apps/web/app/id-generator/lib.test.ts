import { describe, expect, it } from "vitest";
import {
  generateBatch,
  generateNanoid,
  generateUlid,
  generateUuidV4,
  generateUuidV7,
  toCsv,
  toJson,
} from "./lib";

const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function decodeUlidTime(ulid: string): number {
  let ts = 0;
  for (const char of ulid.slice(0, 10)) {
    ts = ts * 32 + ULID_ALPHABET.indexOf(char);
  }
  return ts;
}

function decodeUuidV7Time(uuid: string): number {
  const hex = uuid.replace(/-/g, "").slice(0, 12);
  return parseInt(hex, 16);
}

describe("generateUuidV4", () => {
  it("matches the RFC 4122 v4 shape", () => {
    expect(generateUuidV4()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});

describe("generateUuidV7", () => {
  it("matches the RFC 9562 v7 shape", () => {
    expect(generateUuidV7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("embeds a timestamp close to now", () => {
    const before = Date.now();
    const uuid = generateUuidV7();
    const after = Date.now();
    const ts = decodeUuidV7Time(uuid);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("generateUlid", () => {
  it("is 26 Crockford base32 characters", () => {
    expect(generateUlid()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("embeds a timestamp close to now", () => {
    const before = Date.now();
    const ulid = generateUlid();
    const after = Date.now();
    const ts = decodeUlidTime(ulid);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("generateNanoid", () => {
  it("defaults to 21 characters from the nanoid alphabet", () => {
    const id = generateNanoid();
    expect(id).toHaveLength(21);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("respects a custom length", () => {
    expect(generateNanoid(10)).toHaveLength(10);
  });
});

describe("generateBatch", () => {
  it("returns the requested count with no duplicates", () => {
    const batch = generateBatch("uuid-v4", 200);
    expect(batch).toHaveLength(200);
    expect(new Set(batch).size).toBe(200);
  });

  it("passes nanoidLength through for nanoid batches", () => {
    const batch = generateBatch("nanoid", 5, 8);
    expect(batch).toHaveLength(5);
    for (const id of batch) expect(id).toHaveLength(8);
  });
});

describe("toCsv", () => {
  it("prefixes an id header and joins one id per line", () => {
    expect(toCsv(["a", "b"])).toBe("id\na\nb");
  });
});

describe("toJson", () => {
  it("round-trips to the same array", () => {
    const ids = ["a", "b", "c"];
    expect(JSON.parse(toJson(ids))).toEqual(ids);
  });
});
