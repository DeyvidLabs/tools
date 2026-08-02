export type EncodingMode = "base64" | "url" | "html-entity";
export type Direction = "encode" | "decode";

export const ENCODING_MODE_LABELS: Record<EncodingMode, string> = {
  base64: "Base64",
  url: "URL",
  "html-entity": "HTML entity",
};

export type ConversionResult = { ok: true; data: string } | { ok: false; error: string };

// btoa/atob only operate on a "binary string" (one code unit per byte), so
// Unicode text has to be routed through TextEncoder/TextDecoder first —
// btoa on a raw Unicode string throws for any character above U+00FF.
export function encodeBase64(text: string): ConversionResult {
  try {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return { ok: true, data: btoa(binary) };
  } catch {
    return { ok: false, error: "Couldn't encode that input as Base64." };
  }
}

export function decodeBase64(base64: string): ConversionResult {
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return { ok: true, data: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: "Not valid Base64." };
  }
}

export function encodeUrl(text: string): ConversionResult {
  try {
    return { ok: true, data: encodeURIComponent(text) };
  } catch {
    return { ok: false, error: "Couldn't URL-encode that input." };
  }
}

export function decodeUrl(text: string): ConversionResult {
  try {
    return { ok: true, data: decodeURIComponent(text) };
  } catch {
    return { ok: false, error: "Not a valid URL-encoded string — check for a stray % sequence." };
  }
}

const HTML_ENTITY_ENCODE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// Covers the handful of named entities that show up in practice; anything
// else round-trips through numeric entities, which decodeHtmlEntities
// handles directly rather than needing an exhaustive HTML5 entity table.
const HTML_ENTITY_DECODE_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
};

export function encodeHtmlEntities(text: string): ConversionResult {
  return { ok: true, data: text.replace(/[&<>"']/g, (ch) => HTML_ENTITY_ENCODE_MAP[ch]) };
}

export function decodeHtmlEntities(text: string): ConversionResult {
  const data = text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const codePoint = isHex ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    return HTML_ENTITY_DECODE_MAP[entity] ?? match;
  });
  return { ok: true, data };
}

export function convert(mode: EncodingMode, direction: Direction, text: string): ConversionResult {
  switch (mode) {
    case "base64":
      return direction === "encode" ? encodeBase64(text) : decodeBase64(text);
    case "url":
      return direction === "encode" ? encodeUrl(text) : decodeUrl(text);
    case "html-entity":
      return direction === "encode" ? encodeHtmlEntities(text) : decodeHtmlEntities(text);
  }
}
