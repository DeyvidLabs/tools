import { describe, expect, it } from "vitest";
import { ansi256ToHex, parseAnsi, stripAnsi } from "./lib";

describe("parseAnsi", () => {
  it("returns a single unstyled segment for plain text", () => {
    expect(parseAnsi("hello")).toEqual([
      {
        text: "hello",
        style: {
          fg: null,
          bg: null,
          bold: false,
          dim: false,
          italic: false,
          underline: false,
          strikethrough: false,
          inverse: false,
        },
      },
    ]);
  });

  it("applies a 16-color foreground code (31 = red)", () => {
    const segments = parseAnsi("\x1b[31mred text\x1b[39m");
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ text: "red text", style: { fg: "#cc0000" } });
  });

  it("applies a bright 16-color foreground code (91 = bright red)", () => {
    const segments = parseAnsi("\x1b[91mtext\x1b[0m");
    expect(segments[0].style.fg).toBe("#ef2929");
  });

  it("applies a 256-color foreground via 38;5;N", () => {
    const segments = parseAnsi("\x1b[38;5;3mtext\x1b[0m");
    expect(segments[0].style.fg).toBe(ansi256ToHex(3));
  });

  it("applies a truecolor foreground via 38;2;R;G;B", () => {
    const segments = parseAnsi("\x1b[38;2;10;20;30mtext\x1b[0m");
    expect(segments[0].style.fg).toBe("#0a141e");
  });

  it("tracks bold, underline, and strikethrough flags", () => {
    const segments = parseAnsi("\x1b[1;4;9mtext\x1b[0m");
    expect(segments[0].style).toMatchObject({ bold: true, underline: true, strikethrough: true });
  });

  it("resets all styling on code 0", () => {
    const segments = parseAnsi("\x1b[1;31mbold red\x1b[0mplain");
    expect(segments[0].style).toMatchObject({ bold: true, fg: "#cc0000" });
    expect(segments[1].style).toMatchObject({ bold: false, fg: null });
  });

  it("carries style across multiple segments until changed", () => {
    const segments = parseAnsi("\x1b[32mgreen \x1b[1mgreen bold\x1b[0m");
    expect(segments[0].style).toMatchObject({ fg: "#4e9a06", bold: false });
    expect(segments[1].style).toMatchObject({ fg: "#4e9a06", bold: true });
  });

  it("drops non-SGR CSI sequences (cursor moves, clears) without affecting style", () => {
    const segments = parseAnsi("\x1b[2K\x1b[1Ahello");
    expect(segments).toEqual([{ text: "hello", style: expect.objectContaining({ fg: null }) }]);
  });

  it("drops OSC sequences (e.g. terminal title)", () => {
    const segments = parseAnsi("\x1b]0;My Title\x07hello");
    expect(segments.map((s) => s.text).join("")).toBe("hello");
  });

  it("ignores unrecognized SGR codes instead of throwing", () => {
    expect(() => parseAnsi("\x1b[5mblink\x1b[0m")).not.toThrow();
  });
});

describe("stripAnsi", () => {
  it("removes SGR sequences, leaving plain text", () => {
    expect(stripAnsi("\x1b[31mred\x1b[39m and \x1b[1mbold\x1b[0m")).toBe("red and bold");
  });

  it("removes non-SGR CSI and OSC sequences", () => {
    expect(stripAnsi("\x1b[2K\x1b]0;title\x07plain text")).toBe("plain text");
  });

  it("is a no-op on text with no escape codes", () => {
    expect(stripAnsi("just plain text")).toBe("just plain text");
  });
});

describe("ansi256ToHex", () => {
  it("maps 0-15 to the base 16-color palette", () => {
    expect(ansi256ToHex(1)).toBe("#cc0000");
    expect(ansi256ToHex(9)).toBe("#ef2929");
  });

  it("maps 16-231 to the 6x6x6 color cube", () => {
    expect(ansi256ToHex(16)).toBe("#000000");
    expect(ansi256ToHex(231)).toBe("#ffffff");
  });

  it("maps 232-255 to grayscale", () => {
    expect(ansi256ToHex(232)).toBe("#080808");
    expect(ansi256ToHex(255)).toBe("#eeeeee");
  });
});
