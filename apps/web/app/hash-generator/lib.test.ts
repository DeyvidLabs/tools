import { describe, expect, it } from "vitest";
import { hashBytes, hashText, md5 } from "./lib";

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

describe("md5", () => {
  it("matches known RFC 1321 test vectors", () => {
    expect(hex(md5(new TextEncoder().encode("")))).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(hex(md5(new TextEncoder().encode("abc")))).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(hex(md5(new TextEncoder().encode("message digest")))).toBe(
      "f96b697d7cb7938d525a2f31aaf161d0",
    );
  });

  it("matches a known vector for a 64+ byte message (exercises multi-block padding)", () => {
    expect(
      hex(md5(new TextEncoder().encode("The quick brown fox jumps over the lazy dog"))),
    ).toBe("9e107d9d372bb6826bd81d3542a419d6");
  });
});

describe("hashText", () => {
  it("hashes with MD5 via the pure-JS implementation", async () => {
    expect(await hashText("MD5", "abc")).toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  it("hashes with SHA-1 via Web Crypto", async () => {
    expect(await hashText("SHA-1", "abc")).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });

  it("hashes with SHA-256 via Web Crypto", async () => {
    expect(await hashText("SHA-256", "abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("hashes with SHA-512 via Web Crypto", async () => {
    const expected =
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f";
    expect(await hashText("SHA-512", "abc")).toBe(expected);
  });

  it("produces different hashes for different input", async () => {
    expect(await hashText("SHA-256", "abc")).not.toBe(await hashText("SHA-256", "abd"));
  });
});

describe("hashBytes", () => {
  it("hashes raw bytes the same way as their UTF-8 text equivalent", async () => {
    const bytes = new TextEncoder().encode("abc");
    expect(await hashBytes("SHA-256", bytes)).toBe(await hashText("SHA-256", "abc"));
  });
});
