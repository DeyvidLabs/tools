export interface AnsiStyle {
  fg: string | null;
  bg: string | null;
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  inverse: boolean;
}

export interface AnsiSegment {
  text: string;
  style: AnsiStyle;
}

const DEFAULT_STYLE: AnsiStyle = {
  fg: null,
  bg: null,
  bold: false,
  dim: false,
  italic: false,
  underline: false,
  strikethrough: false,
  inverse: false,
};

// xterm's standard 16-color palette (0-7 normal, 8-15 bright) — same values
// most terminal emulators default to, so previews look like a real terminal.
const PALETTE_16 = [
  "#000000",
  "#cc0000",
  "#4e9a06",
  "#c4a000",
  "#3465a4",
  "#75507b",
  "#06989a",
  "#d3d7cf",
  "#555753",
  "#ef2929",
  "#8ae234",
  "#fce94f",
  "#729fcf",
  "#ad7fa8",
  "#34e2e2",
  "#eeeeec",
];

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

// xterm 256-color palette: 0-15 base, 16-231 a 6x6x6 color cube, 232-255 grayscale.
export function ansi256ToHex(n: number): string {
  if (n < 16) return PALETTE_16[n];
  if (n < 232) {
    const i = n - 16;
    const level = (v: number) => (v === 0 ? 0 : 55 + v * 40);
    return rgbToHex(level(Math.floor(i / 36)), level(Math.floor((i % 36) / 6)), level(i % 6));
  }
  const gray = 8 + (n - 232) * 10;
  return rgbToHex(gray, gray, gray);
}

// Matches any CSI sequence (ESC [ params letter), not just SGR ("m") — cursor
// moves, screen clears, etc. are common in real log output and need to be
// dropped from the text even though they carry no color/style information.
const CSI_REGEX = /\x1b\[([0-9;]*)([a-zA-Z])/g;
// OSC sequences (e.g. ESC ] 0 ; <title> BEL) — used to set the terminal
// title, occasionally leaks into captured CI/docker output.
const OSC_REGEX = /\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g;

function readExtendedColor(params: number[], start: number): [string | null, number] {
  const mode = params[start];
  if (mode === 5) return [ansi256ToHex(params[start + 1] ?? 0), 2];
  if (mode === 2) {
    return [rgbToHex(params[start + 1] ?? 0, params[start + 2] ?? 0, params[start + 3] ?? 0), 4];
  }
  return [null, 0];
}

function applySgr(prev: AnsiStyle, paramsRaw: string): AnsiStyle {
  const params = paramsRaw === "" ? [0] : paramsRaw.split(";").map((p) => (p === "" ? 0 : Number(p)));
  const style = { ...prev };

  for (let i = 0; i < params.length; i++) {
    const code = params[i];
    if (code === 0) Object.assign(style, DEFAULT_STYLE);
    else if (code === 1) style.bold = true;
    else if (code === 2) style.dim = true;
    else if (code === 3) style.italic = true;
    else if (code === 4) style.underline = true;
    else if (code === 7) style.inverse = true;
    else if (code === 9) style.strikethrough = true;
    else if (code === 22) {
      style.bold = false;
      style.dim = false;
    } else if (code === 23) style.italic = false;
    else if (code === 24) style.underline = false;
    else if (code === 27) style.inverse = false;
    else if (code === 29) style.strikethrough = false;
    else if (code >= 30 && code <= 37) style.fg = ansi256ToHex(code - 30);
    else if (code === 38) {
      const [color, consumed] = readExtendedColor(params, i + 1);
      if (color) style.fg = color;
      i += consumed;
    } else if (code === 39) style.fg = null;
    else if (code >= 40 && code <= 47) style.bg = ansi256ToHex(code - 40);
    else if (code === 48) {
      const [color, consumed] = readExtendedColor(params, i + 1);
      if (color) style.bg = color;
      i += consumed;
    } else if (code === 49) style.bg = null;
    else if (code >= 90 && code <= 97) style.fg = ansi256ToHex(code - 90 + 8);
    else if (code >= 100 && code <= 107) style.bg = ansi256ToHex(code - 100 + 8);
    // Unrecognized codes (e.g. blink, fraktur) are silently ignored rather
    // than rejected — real-world logs shouldn't break the preview.
  }
  return style;
}

export function parseAnsi(input: string): AnsiSegment[] {
  const withoutOsc = input.replace(OSC_REGEX, "");
  const segments: AnsiSegment[] = [];
  let style: AnsiStyle = { ...DEFAULT_STYLE };
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  CSI_REGEX.lastIndex = 0;
  while ((match = CSI_REGEX.exec(withoutOsc)) !== null) {
    const text = withoutOsc.slice(lastIndex, match.index);
    if (text) segments.push({ text, style });
    lastIndex = CSI_REGEX.lastIndex;

    const [, paramsRaw, final] = match;
    if (final === "m") style = applySgr(style, paramsRaw);
  }
  const rest = withoutOsc.slice(lastIndex);
  if (rest) segments.push({ text: rest, style });

  return segments;
}

export function stripAnsi(input: string): string {
  return input.replace(OSC_REGEX, "").replace(CSI_REGEX, "");
}

// Real log lines captured from this project's own `docker logs` output —
// one Nest "LOG" line (green, 16-color) and one "ERROR" line that also uses
// a 256-color context tag, so pasting the example demonstrates both palettes.
export const EXAMPLE_INPUT = [
  "\x1b[32m[Nest] 1  - \x1b[39m08/07/2026, 9:23:42 PM \x1b[32m    LOG\x1b[39m \x1b[38;5;3m[InstanceLoader] \x1b[39m\x1b[32mPasteModule dependencies initialized\x1b[39m\x1b[38;5;3m +0ms\x1b[39m",
  "\x1b[31m[Nest] 1  - \x1b[39m08/07/2026, 9:39:59 PM \x1b[31m  ERROR\x1b[39m \x1b[38;5;3m[HttpExceptionFilter] \x1b[39m\x1b[31mDELETE /api/mock/endpoints/836c5dfd-3cc7-4975-bb8e-848463ed41e7 → 403\x1b[39m",
].join("\n");
