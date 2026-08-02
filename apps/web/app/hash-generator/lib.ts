export type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

export const HASH_ALGORITHMS: HashAlgorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"];

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

// The 64 round constants are floor(abs(sin(i+1)) * 2**32), per RFC 1321 —
// computed once here rather than hardcoded so the derivation stays visible.
const MD5_K = new Int32Array(64);
for (let i = 0; i < 64; i++) {
  MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);
}

function leftRotate(x: number, amount: number): number {
  return (x << amount) | (x >>> (32 - amount));
}

// Web Crypto's SubtleCrypto has no MD5 (it was dropped from the spec as
// cryptographically broken), so it needs this standalone RFC 1321
// implementation instead of crypto.subtle.digest().
export function md5(bytes: Uint8Array): Uint8Array {
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const msgLen = bytes.length;
  // msgLen * 8 stays well under Number.MAX_SAFE_INTEGER for any file a
  // browser would realistically hash, so the 64-bit bit-length trailer can
  // be split into its two 32-bit words with plain arithmetic (`>>> 0`
  // applies the same modulo-2**32 wrap a BigInt mask would) instead of
  // requiring BigInt literals, which the project's ES2017 target rejects.
  const totalBits = msgLen * 8;

  // Pad to a 64-byte boundary, leaving room for the 0x80 terminator and an
  // 8-byte little-endian bit-length trailer.
  const paddedLen = (((msgLen + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[msgLen] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, totalBits >>> 0, true);
  view.setUint32(paddedLen - 4, Math.floor(totalBits / 2 ** 32), true);

  for (let chunkStart = 0; chunkStart < paddedLen; chunkStart += 64) {
    const M = new Int32Array(16);
    for (let i = 0; i < 16; i++) {
      M[i] = view.getInt32(chunkStart + i * 4, true);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      // Each operand stays within int32 range, so the sum stays well under
      // Number.MAX_SAFE_INTEGER — no precision loss before the `| 0` wrap.
      F = (F + A + MD5_K[i] + M[g]) | 0;
      A = D;
      D = C;
      C = B;
      B = (B + leftRotate(F, MD5_SHIFTS[i])) | 0;
    }

    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }

  const digest = new Uint8Array(16);
  const digestView = new DataView(digest.buffer);
  digestView.setInt32(0, a0, true);
  digestView.setInt32(4, b0, true);
  digestView.setInt32(8, c0, true);
  digestView.setInt32(12, d0, true);
  return digest;
}

export async function hashBytes(algorithm: HashAlgorithm, data: Uint8Array): Promise<string> {
  if (algorithm === "MD5") {
    return bytesToHex(md5(data));
  }
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Web Crypto API isn't available in this context (needs HTTPS or localhost).");
  }
  const digest = await crypto.subtle.digest(algorithm, new Uint8Array(data));
  return bytesToHex(new Uint8Array(digest));
}

export function hashText(algorithm: HashAlgorithm, text: string): Promise<string> {
  return hashBytes(algorithm, new TextEncoder().encode(text));
}
