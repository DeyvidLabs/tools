export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface OKLCH {
  l: number;
  c: number;
  h: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---------- HEX <-> RGB ----------

export function hexToRgb(hex: string): RGB | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const digits = match[1];
  const full = digits.length === 3 ? digits.split("").map((d) => d + d).join("") : digits;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHexByte = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${toHexByte(rgb.r)}${toHexByte(rgb.g)}${toHexByte(rgb.b)}`;
}

// ---------- RGB <-> HSL ----------

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let [r1, g1, b1] = [0, 0, 0];
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

// ---------- RGB <-> OKLCH ----------
// Formulas per Björn Ottosson's OKLab reference (https://bottosson.github.io/posts/oklab/).

function srgbChannelToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearChannelToSrgb(c: number): number {
  const clamped = clamp(c, 0, 1);
  return clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

export function rgbToOklch(rgb: RGB): OKLCH {
  const r = srgbChannelToLinear(rgb.r / 255);
  const g = srgbChannelToLinear(rgb.g / 255);
  const b = srgbChannelToLinear(rgb.b / 255);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const c = Math.sqrt(a * a + bLab * bLab);
  let h = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c, h: c < 1e-6 ? 0 : h };
}

export function oklchToRgb(oklch: OKLCH): RGB {
  const hRad = (oklch.h * Math.PI) / 180;
  const a = oklch.c * Math.cos(hRad);
  const bLab = oklch.c * Math.sin(hRad);

  const l_ = oklch.l + 0.3963377774 * a + 0.2158037573 * bLab;
  const m_ = oklch.l - 0.1055613458 * a - 0.0638541728 * bLab;
  const s_ = oklch.l - 0.0894841775 * a - 1.2914855480 * bLab;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return {
    r: linearChannelToSrgb(r) * 255,
    g: linearChannelToSrgb(g) * 255,
    b: linearChannelToSrgb(b) * 255,
  };
}

// ---------- Parsing ----------

export function parseColor(input: string): RGB | null {
  const value = input.trim();
  if (value === "") return null;

  const hex = hexToRgb(value);
  if (hex) return hex;

  const rgbMatch = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(value);
  if (rgbMatch) {
    return {
      r: clamp(parseFloat(rgbMatch[1]), 0, 255),
      g: clamp(parseFloat(rgbMatch[2]), 0, 255),
      b: clamp(parseFloat(rgbMatch[3]), 0, 255),
    };
  }

  const hslMatch =
    /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*[\d.]+\s*)?\)$/i.exec(value);
  if (hslMatch) {
    return hslToRgb({
      h: parseFloat(hslMatch[1]),
      s: clamp(parseFloat(hslMatch[2]), 0, 100),
      l: clamp(parseFloat(hslMatch[3]), 0, 100),
    });
  }

  const oklchMatch =
    /^oklch\(\s*([\d.]+)(%)?\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(value);
  if (oklchMatch) {
    const lRaw = parseFloat(oklchMatch[1]);
    return oklchToRgb({
      l: oklchMatch[2] ? lRaw / 100 : lRaw,
      c: parseFloat(oklchMatch[3]),
      h: parseFloat(oklchMatch[4]),
    });
  }

  return null;
}

// ---------- Formatting ----------

export function formatHex(rgb: RGB): string {
  return rgbToHex(rgb);
}

export function formatRgb(rgb: RGB): string {
  return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
}

export function formatHsl(rgb: RGB): string {
  const hsl = rgbToHsl(rgb);
  return `hsl(${round(hsl.h)}, ${round(hsl.s)}%, ${round(hsl.l)}%)`;
}

export function formatOklch(rgb: RGB): string {
  const oklch = rgbToOklch(rgb);
  return `oklch(${round(oklch.l * 100, 1)}% ${round(oklch.c, 3)} ${round(oklch.h, 1)})`;
}

// ---------- Palette generation ----------

function withHue(rgb: RGB, hueOffset: number): RGB {
  const hsl = rgbToHsl(rgb);
  return hslToRgb({ ...hsl, h: hsl.h + hueOffset });
}

export function generateShades(rgb: RGB, count = 5): RGB[] {
  const hsl = rgbToHsl(rgb);
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / (count + 1);
    return hslToRgb({ ...hsl, l: hsl.l * (1 - t) });
  });
}

export function generateTints(rgb: RGB, count = 5): RGB[] {
  const hsl = rgbToHsl(rgb);
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / (count + 1);
    return hslToRgb({ ...hsl, l: hsl.l + (100 - hsl.l) * t });
  });
}

export function complementary(rgb: RGB): RGB {
  return withHue(rgb, 180);
}

export function analogous(rgb: RGB, angle = 30): [RGB, RGB] {
  return [withHue(rgb, -angle), withHue(rgb, angle)];
}

export function triadic(rgb: RGB): [RGB, RGB] {
  return [withHue(rgb, 120), withHue(rgb, 240)];
}
