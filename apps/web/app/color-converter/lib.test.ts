import { describe, expect, it } from "vitest";
import {
  analogous,
  complementary,
  formatHex,
  formatHsl,
  formatOklch,
  formatRgb,
  generateShades,
  generateTints,
  hexToRgb,
  hslToRgb,
  oklchToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  rgbToOklch,
  triadic,
  type RGB,
} from "./lib";

function closeTo(actual: number, expected: number, tolerance: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

describe("hexToRgb / rgbToHex", () => {
  it("parses 6-digit and 3-digit hex", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("00ff00")).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("#00f")).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("rejects invalid hex", () => {
    expect(hexToRgb("#zzzzzz")).toBeNull();
    expect(hexToRgb("#ffff")).toBeNull();
    expect(hexToRgb("")).toBeNull();
  });

  it("round-trips through rgbToHex", () => {
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe("#ff8000");
  });
});

describe("rgbToHsl / hslToRgb", () => {
  it("converts primary colors", () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    closeTo(hsl.h, 0, 0.5);
    closeTo(hsl.s, 100, 0.5);
    closeTo(hsl.l, 50, 0.5);
  });

  it("converts white and black without NaN", () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
  });

  it("round-trips rgb -> hsl -> rgb", () => {
    const original: RGB = { r: 34, g: 139, b: 230 };
    const roundTripped = hslToRgb(rgbToHsl(original));
    closeTo(roundTripped.r, original.r, 1);
    closeTo(roundTripped.g, original.g, 1);
    closeTo(roundTripped.b, original.b, 1);
  });
});

describe("rgbToOklch / oklchToRgb", () => {
  it("matches known reference values for red, green, blue", () => {
    const red = rgbToOklch({ r: 255, g: 0, b: 0 });
    closeTo(red.l, 0.628, 0.01);
    closeTo(red.c, 0.258, 0.01);
    closeTo(red.h, 29.2, 1);

    const green = rgbToOklch({ r: 0, g: 255, b: 0 });
    closeTo(green.l, 0.866, 0.01);
    closeTo(green.h, 142.5, 1);

    const blue = rgbToOklch({ r: 0, g: 0, b: 255 });
    closeTo(blue.l, 0.452, 0.01);
    closeTo(blue.h, 264.1, 1);
  });

  it("gives white lightness 1 and zero chroma", () => {
    const white = rgbToOklch({ r: 255, g: 255, b: 255 });
    closeTo(white.l, 1, 0.001);
    closeTo(white.c, 0, 0.001);
  });

  it("round-trips rgb -> oklch -> rgb", () => {
    const original: RGB = { r: 200, g: 90, b: 40 };
    const roundTripped = oklchToRgb(rgbToOklch(original));
    closeTo(roundTripped.r, original.r, 1);
    closeTo(roundTripped.g, original.g, 1);
    closeTo(roundTripped.b, original.b, 1);
  });
});

describe("parseColor", () => {
  it("parses hex, rgb, hsl, and oklch strings", () => {
    expect(parseColor("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor("rgb(255, 0, 0)")).toEqual({ r: 255, g: 0, b: 0 });

    const fromHsl = parseColor("hsl(0, 100%, 50%)")!;
    closeTo(fromHsl.r, 255, 1);
    closeTo(fromHsl.g, 0, 1);
    closeTo(fromHsl.b, 0, 1);

    const fromOklch = parseColor("oklch(62.8% 0.258 29.2)")!;
    closeTo(fromOklch.r, 255, 3);
    closeTo(fromOklch.g, 0, 3);
    closeTo(fromOklch.b, 0, 3);
  });

  it("returns null for garbage input", () => {
    expect(parseColor("not a color")).toBeNull();
    expect(parseColor("")).toBeNull();
  });
});

describe("formatting", () => {
  it("formats an RGB value in every notation", () => {
    const rgb: RGB = { r: 255, g: 0, b: 0 };
    expect(formatHex(rgb)).toBe("#ff0000");
    expect(formatRgb(rgb)).toBe("rgb(255, 0, 0)");
    expect(formatHsl(rgb)).toBe("hsl(0, 100%, 50%)");
    expect(formatOklch(rgb)).toBe("oklch(62.8% 0.258 29.2)");
  });
});

describe("palette generation", () => {
  const base: RGB = { r: 34, g: 139, b: 230 };

  it("generates shades that get progressively darker", () => {
    const shades = generateShades(base, 3);
    expect(shades).toHaveLength(3);
    const lightnesses = shades.map((s) => rgbToHsl(s).l);
    expect(lightnesses[0]).toBeGreaterThan(lightnesses[1]);
    expect(lightnesses[1]).toBeGreaterThan(lightnesses[2]);
  });

  it("generates tints that get progressively lighter", () => {
    const tints = generateTints(base, 3);
    expect(tints).toHaveLength(3);
    const lightnesses = tints.map((t) => rgbToHsl(t).l);
    expect(lightnesses[0]).toBeLessThan(lightnesses[1]);
    expect(lightnesses[1]).toBeLessThan(lightnesses[2]);
  });

  it("computes complementary as a 180deg hue rotation", () => {
    const comp = complementary(base);
    const baseHue = rgbToHsl(base).h;
    const compHue = rgbToHsl(comp).h;
    closeTo(((compHue - baseHue + 360) % 360), 180, 0.5);
  });

  it("computes analogous colors at +-30deg", () => {
    const baseHue = rgbToHsl(base).h;
    const [left, right] = analogous(base);
    closeTo(((rgbToHsl(left).h - baseHue + 360) % 360), 330, 0.5);
    closeTo(((rgbToHsl(right).h - baseHue + 360) % 360), 30, 0.5);
  });

  it("computes triadic colors at 120deg and 240deg", () => {
    const baseHue = rgbToHsl(base).h;
    const [second, third] = triadic(base);
    closeTo(((rgbToHsl(second).h - baseHue + 360) % 360), 120, 0.5);
    closeTo(((rgbToHsl(third).h - baseHue + 360) % 360), 240, 0.5);
  });
});
