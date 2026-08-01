export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export type DecodeResult = { ok: true; data: DecodedJwt } | { ok: false; error: string };

// Decodes base64url (RFC 4648 §5) to a UTF-8 string — atob alone handles
// neither the URL-safe alphabet nor multi-byte characters in claim values.
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function decodeJwt(token: string): DecodeResult {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, error: "Paste a JWT to decode." };

  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    return { ok: false, error: `A JWT has 3 dot-separated parts — found ${parts.length}.` };
  }
  const [headerPart, payloadPart, signature] = parts;

  let header: unknown;
  try {
    header = JSON.parse(base64UrlDecode(headerPart));
  } catch {
    return { ok: false, error: "Header is not valid base64url-encoded JSON." };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart));
  } catch {
    return { ok: false, error: "Payload is not valid base64url-encoded JSON." };
  }
  if (typeof header !== "object" || header === null || Array.isArray(header)) {
    return { ok: false, error: "Header must decode to a JSON object." };
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, error: "Payload must decode to a JSON object." };
  }

  return {
    ok: true,
    data: {
      header: header as Record<string, unknown>,
      payload: payload as Record<string, unknown>,
      signature,
    },
  };
}

export type ExpiryStatus = "expired" | "valid" | "not-yet-valid" | "unknown";

export interface ExpiryInfo {
  status: ExpiryStatus;
  message: string;
}

function formatRelative(deltaSeconds: number): string {
  const abs = Math.abs(deltaSeconds);
  const units: [number, string][] = [
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];
  for (const [secs, name] of units) {
    if (abs >= secs || secs === 1) {
      const count = Math.floor(abs / secs);
      const plural = count === 1 ? name : `${name}s`;
      return deltaSeconds >= 0 ? `in ${count} ${plural}` : `${count} ${plural} ago`;
    }
  }
  return "now";
}

// Registered `exp`/`nbf` claims (RFC 7519 §4.1) are NumericDate — seconds
// since the epoch — so any non-number value is treated as absent rather
// than coerced, matching how most JWT libraries validate them.
export function expiryStatus(payload: Record<string, unknown>, now: Date = new Date()): ExpiryInfo {
  const nowSec = now.getTime() / 1000;
  const nbf = typeof payload.nbf === "number" ? payload.nbf : null;
  const exp = typeof payload.exp === "number" ? payload.exp : null;

  if (nbf !== null && nowSec < nbf) {
    return { status: "not-yet-valid", message: `Not valid yet — becomes valid ${formatRelative(nbf - nowSec)}` };
  }
  if (exp !== null) {
    const delta = exp - nowSec;
    return delta <= 0
      ? { status: "expired", message: `Expired ${formatRelative(delta)}` }
      : { status: "valid", message: `Valid — expires ${formatRelative(delta)}` };
  }
  return { status: "unknown", message: "No exp claim — this token does not expire." };
}

export interface TimeClaim {
  key: string;
  label: string;
  date: Date;
}

const TIME_CLAIM_LABELS: Record<string, string> = {
  iat: "Issued at",
  exp: "Expires at",
  nbf: "Not valid before",
};

// Spells out the month (dateStyle: "medium") instead of using digits, so
// the date reads unambiguously regardless of whether the browser's locale
// orders day/month as DD/MM or MM/DD.
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(date);
}

export function timeClaims(payload: Record<string, unknown>): TimeClaim[] {
  return (["iat", "exp", "nbf"] as const)
    .filter((key) => typeof payload[key] === "number")
    .map((key) => ({
      key,
      label: TIME_CLAIM_LABELS[key],
      date: new Date((payload[key] as number) * 1000),
    }));
}
