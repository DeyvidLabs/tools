export type IdType = "uuid-v4" | "uuid-v7" | "ulid" | "nanoid";

export const ID_TYPE_LABELS: Record<IdType, string> = {
  "uuid-v4": "UUID v4",
  "uuid-v7": "UUID v7",
  ulid: "ULID",
  nanoid: "nanoid",
};

// Rejection-sampled uniform int in [0, maxExclusive) — avoids the modulo bias
// a plain `getRandomValues()[0] % max` would introduce. Same technique as
// password-generator/lib.ts (each tool here is self-contained, so this is
// reimplemented locally rather than shared).
function secureRandomInt(maxExclusive: number): number {
  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  let value: number;
  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);
  return value % maxExclusive;
}

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, "0");
}

function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, toHex).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateUuidV4(): string {
  return crypto.randomUUID();
}

// RFC 9562 UUIDv7: 48-bit big-endian ms timestamp, then a version nibble,
// 12 random bits (rand_a), a variant, and 62 more random bits (rand_b).
export function generateUuidV7(): string {
  const bytes = new Uint8Array(16);
  const ts = Date.now();

  // 48-bit timestamp doesn't fit JS's 32-bit bitwise operators, so it's
  // extracted via division rather than a shift — safe since ts stays well
  // under Number.MAX_SAFE_INTEGER.
  bytes[0] = Math.floor(ts / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ts / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(ts / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(ts / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(ts / 2 ** 8) & 0xff;
  bytes[5] = ts & 0xff;

  const rand = crypto.getRandomValues(new Uint8Array(10));
  bytes[6] = 0x70 | (rand[0] & 0x0f); // version 7 + top 4 bits of rand_a
  bytes[7] = rand[1]; // remaining 8 bits of rand_a
  bytes[8] = 0x80 | (rand[2] & 0x3f); // variant 10 + top 6 bits of rand_b
  bytes.set(rand.slice(3), 9); // remaining 56 bits of rand_b

  return bytesToUuid(bytes);
}

const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32, no I/L/O/U

// Encodes a 48-bit ms timestamp as 10 base32 chars, 5 bits at a time via
// division rather than a bit shift (same 32-bit-bitwise-operator reason as
// generateUuidV7, and the same technique ULID's own reference libraries use).
function encodeUlidTime(ts: number): string {
  let out = "";
  for (let i = 9; i >= 0; i--) {
    out += ULID_ALPHABET[Math.floor(ts / 2 ** (i * 5)) % 32];
  }
  return out;
}

export function generateUlid(): string {
  let random = "";
  for (let i = 0; i < 16; i++) {
    random += ULID_ALPHABET[secureRandomInt(32)];
  }
  return encodeUlidTime(Date.now()) + random;
}

const NANOID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
export const DEFAULT_NANOID_LENGTH = 21;

// 64-char alphabet is a power of 2, so secureRandomInt(64) per character is
// already bias-free — no bitmask trickery needed.
export function generateNanoid(length: number = DEFAULT_NANOID_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += NANOID_ALPHABET[secureRandomInt(NANOID_ALPHABET.length)];
  }
  return out;
}

export function generateId(type: IdType, nanoidLength?: number): string {
  switch (type) {
    case "uuid-v4":
      return generateUuidV4();
    case "uuid-v7":
      return generateUuidV7();
    case "ulid":
      return generateUlid();
    case "nanoid":
      return generateNanoid(nanoidLength);
  }
}

export function generateBatch(type: IdType, count: number, nanoidLength?: number): string[] {
  return Array.from({ length: count }, () => generateId(type, nanoidLength));
}

// No escaping needed: every generated id's charset is alphanumeric plus
// -/_ only, never a comma/quote/newline.
export function toCsv(ids: string[]): string {
  return ["id", ...ids].join("\n");
}

export function toJson(ids: string[]): string {
  return JSON.stringify(ids, null, 2);
}
