import { describe, expect, it } from "vitest";
import {
  convert,
  decodeBase64,
  decodeHtmlEntities,
  decodeUrl,
  encodeBase64,
  encodeHtmlEntities,
  encodeUrl,
} from "./lib";

describe("encodeBase64 / decodeBase64", () => {
  it("round-trips ASCII text", () => {
    const encoded = encodeBase64("hello world");
    expect(encoded).toEqual({ ok: true, data: "aGVsbG8gd29ybGQ=" });
    expect(decodeBase64("aGVsbG8gd29ybGQ=")).toEqual({ ok: true, data: "hello world" });
  });

  it("round-trips Unicode text via UTF-8", () => {
    const encoded = encodeBase64("héllo 🎉");
    expect(encoded.ok).toBe(true);
    if (encoded.ok) {
      expect(decodeBase64(encoded.data)).toEqual({ ok: true, data: "héllo 🎉" });
    }
  });

  it("reports an error for invalid Base64", () => {
    expect(decodeBase64("not base64!!!").ok).toBe(false);
  });
});

describe("encodeUrl / decodeUrl", () => {
  it("round-trips text with reserved characters", () => {
    const encoded = encodeUrl("a b/c?d=e&f");
    expect(encoded).toEqual({ ok: true, data: "a%20b%2Fc%3Fd%3De%26f" });
    expect(decodeUrl("a%20b%2Fc%3Fd%3De%26f")).toEqual({ ok: true, data: "a b/c?d=e&f" });
  });

  it("reports an error for a malformed percent-escape", () => {
    expect(decodeUrl("100% done").ok).toBe(false);
  });
});

describe("encodeHtmlEntities / decodeHtmlEntities", () => {
  it("escapes the five XML-sensitive characters", () => {
    expect(encodeHtmlEntities(`<a href="x">Tom & Jerry's</a>`)).toEqual({
      ok: true,
      data: "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;",
    });
  });

  it("decodes named entities", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry&#39;s &hellip;")).toEqual({
      ok: true,
      data: "Tom & Jerry's …",
    });
  });

  it("decodes decimal and hex numeric entities", () => {
    expect(decodeHtmlEntities("&#169; &#x1F600;")).toEqual({ ok: true, data: "© 😀" });
  });

  it("leaves unknown entities untouched", () => {
    expect(decodeHtmlEntities("&notreal;")).toEqual({ ok: true, data: "&notreal;" });
  });
});

describe("convert", () => {
  it("dispatches to the right encoder/decoder by mode and direction", () => {
    expect(convert("url", "encode", "a b")).toEqual({ ok: true, data: "a%20b" });
    expect(convert("html-entity", "decode", "&lt;b&gt;")).toEqual({ ok: true, data: "<b>" });
  });
});
