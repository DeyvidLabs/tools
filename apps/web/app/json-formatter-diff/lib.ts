// A hand-rolled recursive-descent JSON parser rather than JSON.parse/try-catch:
// SyntaxError messages (and whether they even mention a position) differ across
// JS engines, so line/column error reporting can't be built on top of them
// reliably. This parser tracks its own index and reports errors from that.

export interface JsonParseError {
  message: string;
  index: number;
  line: number;
  column: number;
}

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: JsonParseError };

class ParseFailure extends Error {
  index: number;
  constructor(message: string, index: number) {
    super(message);
    this.index = index;
  }
}

function indexToLineColumn(text: string, index: number): { line: number; column: number } {
  let line = 1;
  let lastNewline = -1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      lastNewline = i;
    }
  }
  return { line, column: index - lastNewline };
}

export function parseJsonStrict(text: string): JsonParseResult {
  let i = 0;

  function fail(message: string): never {
    throw new ParseFailure(message, i);
  }

  function skipWs() {
    while (i < text.length && (text[i] === " " || text[i] === "\t" || text[i] === "\n" || text[i] === "\r")) {
      i++;
    }
  }

  function parseValue(): unknown {
    skipWs();
    if (i >= text.length) fail("Unexpected end of input");
    const ch = text[i];
    if (ch === "{") return parseObject();
    if (ch === "[") return parseArray();
    if (ch === '"') return parseString();
    if (ch === "-" || (ch >= "0" && ch <= "9")) return parseNumber();
    if (text.startsWith("true", i)) {
      i += 4;
      return true;
    }
    if (text.startsWith("false", i)) {
      i += 5;
      return false;
    }
    if (text.startsWith("null", i)) {
      i += 4;
      return null;
    }
    fail(`Unexpected token '${ch}'`);
  }

  function parseObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    i++;
    skipWs();
    if (text[i] === "}") {
      i++;
      return obj;
    }
    for (;;) {
      skipWs();
      if (text[i] !== '"') fail("Expected a double-quoted key");
      const key = parseString();
      skipWs();
      if (text[i] !== ":") fail("Expected ':' after key");
      i++;
      obj[key] = parseValue();
      skipWs();
      if (text[i] === ",") {
        i++;
        continue;
      }
      if (text[i] === "}") {
        i++;
        break;
      }
      fail("Expected ',' or '}'");
    }
    return obj;
  }

  function parseArray(): unknown[] {
    const arr: unknown[] = [];
    i++;
    skipWs();
    if (text[i] === "]") {
      i++;
      return arr;
    }
    for (;;) {
      arr.push(parseValue());
      skipWs();
      if (text[i] === ",") {
        i++;
        continue;
      }
      if (text[i] === "]") {
        i++;
        break;
      }
      fail("Expected ',' or ']'");
    }
    return arr;
  }

  function parseString(): string {
    i++;
    let result = "";
    for (;;) {
      if (i >= text.length) fail("Unterminated string");
      const ch = text[i];
      if (ch === '"') {
        i++;
        break;
      }
      if (ch === "\\") {
        i++;
        const esc = text[i];
        switch (esc) {
          case '"':
            result += '"';
            break;
          case "\\":
            result += "\\";
            break;
          case "/":
            result += "/";
            break;
          case "b":
            result += "\b";
            break;
          case "f":
            result += "\f";
            break;
          case "n":
            result += "\n";
            break;
          case "r":
            result += "\r";
            break;
          case "t":
            result += "\t";
            break;
          case "u": {
            const hex = text.slice(i + 1, i + 5);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail("Invalid unicode escape");
            result += String.fromCharCode(parseInt(hex, 16));
            i += 4;
            break;
          }
          default:
            fail(`Invalid escape character '\\${esc}'`);
        }
        i++;
      } else if (ch.charCodeAt(0) < 0x20) {
        fail("Invalid control character in string");
      } else {
        result += ch;
        i++;
      }
    }
    return result;
  }

  function parseNumber(): number {
    const start = i;
    if (text[i] === "-") i++;
    if (text[i] === "0") {
      i++;
    } else if (text[i] >= "1" && text[i] <= "9") {
      while (text[i] >= "0" && text[i] <= "9") i++;
    } else {
      fail("Invalid number");
    }
    if (text[i] === ".") {
      i++;
      if (!(text[i] >= "0" && text[i] <= "9")) fail("Invalid number");
      while (text[i] >= "0" && text[i] <= "9") i++;
    }
    if (text[i] === "e" || text[i] === "E") {
      i++;
      if (text[i] === "+" || text[i] === "-") i++;
      if (!(text[i] >= "0" && text[i] <= "9")) fail("Invalid number");
      while (text[i] >= "0" && text[i] <= "9") i++;
    }
    return Number(text.slice(start, i));
  }

  try {
    const value = parseValue();
    skipWs();
    if (i < text.length) fail("Unexpected trailing content after JSON value");
    return { ok: true, value };
  } catch (err) {
    if (err instanceof ParseFailure) {
      const { line, column } = indexToLineColumn(text, err.index);
      return { ok: false, error: { message: err.message, index: err.index, line, column } };
    }
    throw err;
  }
}

export function formatJson(value: unknown, indent = 2): string {
  return JSON.stringify(value, null, indent);
}

export function minifyJson(value: unknown): string {
  return JSON.stringify(value);
}

export interface JsonLine {
  text: string;
  path?: string;
}

interface JsonLineFrame {
  path: (string | number)[];
  type: "object" | "array";
  nextIndex: number;
}

const CLOSING_BRACKET_RE = /^[}\]],?$/;
const OBJECT_KEY_LINE_RE = /^\s*"((?:[^"\\]|\\.)*)":\s*(.*)$/;

// Re-parses JSON.stringify's own pretty-printed output line by line, tracking
// a stack of open containers, so each rendered line can carry the exact
// dotted/bracketed path (e.g. "data.info.user.id") to the key or array index
// it represents — reusing JSON.stringify's formatting instead of
// re-implementing a pretty-printer avoids the two ever drifting apart.
export function buildJsonLines(value: unknown, indent = 2): JsonLine[] {
  const text = JSON.stringify(value, null, indent);
  const lines = text.split("\n");

  const isContainer = value !== null && typeof value === "object";
  if (!isContainer) return [{ text: lines[0] }];

  const first = lines[0].trim();
  if (first === "{}" || first === "[]") return [{ text: lines[0] }];

  const stack: JsonLineFrame[] = [
    { path: [], type: first === "{" ? "object" : "array", nextIndex: 0 },
  ];
  const result: JsonLine[] = [{ text: lines[0] }];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const top = stack[stack.length - 1];

    if (CLOSING_BRACKET_RE.test(trimmed)) {
      stack.pop();
      result.push({ text: line });
      continue;
    }

    const keyMatch = top.type === "object" ? OBJECT_KEY_LINE_RE.exec(line) : null;
    if (keyMatch) {
      const key = JSON.parse(`"${keyMatch[1]}"`) as string;
      const remainder = keyMatch[2];
      const childPath = [...top.path, key];
      if (remainder === "{" || remainder === "[") {
        stack.push({ path: childPath, type: remainder === "{" ? "object" : "array", nextIndex: 0 });
      }
      result.push({ text: line, path: formatPath(childPath) });
      continue;
    }

    if (top.type === "array") {
      const idx = top.nextIndex++;
      const itemPath = [...top.path, idx];
      if (trimmed === "{" || trimmed === "[") {
        stack.push({ path: itemPath, type: trimmed === "{" ? "object" : "array", nextIndex: 0 });
      }
      result.push({ text: line, path: formatPath(itemPath) });
      continue;
    }

    result.push({ text: line });
  }

  return result;
}

export type JsonDiffType = "added" | "removed" | "changed";

export interface JsonDiffEntry {
  path: string;
  type: JsonDiffType;
  oldValue?: unknown;
  newValue?: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatPath(path: (string | number)[]): string {
  if (path.length === 0) return "(root)";
  return path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") return `${acc}[${segment}]`;
    return acc ? `${acc}.${segment}` : segment;
  }, "");
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return (
      keysA.length === keysB.length &&
      keysA.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]))
    );
  }
  return false;
}

// Key-by-key structural diff rather than a line-by-line one: reordering keys
// or reflowing whitespace in one of the two JSON documents shouldn't show up
// as a difference, only actual value/key changes should.
export function diffJsonValues(a: unknown, b: unknown, path: (string | number)[] = []): JsonDiffEntry[] {
  if (deepEqual(a, b)) return [];

  if (isPlainObject(a) && isPlainObject(b)) {
    const entries: JsonDiffEntry[] = [];
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      const inA = Object.prototype.hasOwnProperty.call(a, key);
      const inB = Object.prototype.hasOwnProperty.call(b, key);
      if (inA && !inB) {
        entries.push({ path: formatPath([...path, key]), type: "removed", oldValue: a[key] });
      } else if (!inA && inB) {
        entries.push({ path: formatPath([...path, key]), type: "added", newValue: b[key] });
      } else {
        entries.push(...diffJsonValues(a[key], b[key], [...path, key]));
      }
    }
    return entries;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const entries: JsonDiffEntry[] = [];
    const maxLen = Math.max(a.length, b.length);
    for (let idx = 0; idx < maxLen; idx++) {
      if (idx >= a.length) {
        entries.push({ path: formatPath([...path, idx]), type: "added", newValue: b[idx] });
      } else if (idx >= b.length) {
        entries.push({ path: formatPath([...path, idx]), type: "removed", oldValue: a[idx] });
      } else {
        entries.push(...diffJsonValues(a[idx], b[idx], [...path, idx]));
      }
    }
    return entries;
  }

  return [{ path: formatPath(path), type: "changed", oldValue: a, newValue: b }];
}

export type TextDiffOpType = "equal" | "delete" | "insert";

export interface TextDiffOp {
  type: TextDiffOpType;
  line: string;
}

interface GenericDiffOp<T> {
  type: TextDiffOpType;
  value: T;
}

// Classic Myers O(ND) diff (Myers, 1986): a forward greedy search over edit
// distance `d`, recording each round's furthest-reaching x per diagonal `k`
// so the edit script can be recovered by backtracking through that history.
// Generic over the sequence element type so the same core serves both the
// line-level diff and the character-level diff used to highlight replaced
// lines.
function myersDiff<T>(a: T[], b: T[]): GenericDiffOp<T>[] {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max;
  const v: number[] = new Array(2 * max + 1).fill(0);
  const trace: number[][] = [];

  outer: for (let d = 0; d <= max; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
        x = v[offset + k + 1];
      } else {
        x = v[offset + k - 1] + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) break outer;
    }
  }

  const ops: GenericDiffOp<T>[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const vPrev = trace[d];
    const k = x - y;
    const prevK =
      k === -d || (k !== d && vPrev[offset + k - 1] < vPrev[offset + k + 1]) ? k + 1 : k - 1;
    const prevX = vPrev[offset + prevK];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      ops.push({ type: "equal", value: a[x - 1] });
      x--;
      y--;
    }

    if (d > 0) {
      if (x === prevX) {
        ops.push({ type: "insert", value: b[y - 1] });
        y--;
      } else {
        ops.push({ type: "delete", value: a[x - 1] });
        x--;
      }
    }
  }

  return ops.reverse();
}

export function diffLines(oldText: string, newText: string): TextDiffOp[] {
  return myersDiff(oldText.split("\n"), newText.split("\n")).map((op) => ({
    type: op.type,
    line: op.value,
  }));
}

export interface CharDiffPart {
  type: TextDiffOpType;
  text: string;
}

// Same algorithm as diffLines, applied character-by-character instead of
// line-by-line, with consecutive same-type ops merged into runs — a diff at
// character granularity is only readable once adjacent changed characters
// are grouped back into spans instead of one entry per character.
export function diffChars(oldStr: string, newStr: string): CharDiffPart[] {
  const ops = myersDiff(oldStr.split(""), newStr.split(""));
  const parts: CharDiffPart[] = [];
  for (const op of ops) {
    const last = parts[parts.length - 1];
    if (last && last.type === op.type) {
      last.text += op.value;
    } else {
      parts.push({ type: op.type, text: op.value });
    }
  }
  return parts;
}

export type DiffRow =
  | { type: "equal"; line: string }
  | { type: "delete"; line: string }
  | { type: "insert"; line: string }
  | {
      type: "replace";
      oldLine: string;
      newLine: string;
      oldParts: CharDiffPart[];
      newParts: CharDiffPart[];
    };

// Myers naturally represents a one-line edit as an adjacent delete-run then
// insert-run — this pairs those runs positionally (1:1, up to whichever run
// is shorter) into "replace" rows carrying a character-level diff, so the UI
// can highlight just the changed span instead of coloring the whole line.
// Leftover unpaired lines (when the runs are different lengths) stay as
// plain delete/insert rows.
export function groupLineDiff(ops: TextDiffOp[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let i = 0;

  while (i < ops.length) {
    if (ops[i].type === "equal") {
      rows.push({ type: "equal", line: ops[i].line });
      i++;
      continue;
    }

    const deletes: string[] = [];
    while (i < ops.length && ops[i].type === "delete") {
      deletes.push(ops[i].line);
      i++;
    }
    const inserts: string[] = [];
    while (i < ops.length && ops[i].type === "insert") {
      inserts.push(ops[i].line);
      i++;
    }

    const pairCount = Math.min(deletes.length, inserts.length);
    for (let p = 0; p < pairCount; p++) {
      const oldLine = deletes[p];
      const newLine = inserts[p];
      const parts = diffChars(oldLine, newLine);
      rows.push({
        type: "replace",
        oldLine,
        newLine,
        oldParts: parts.filter((part) => part.type !== "insert"),
        newParts: parts.filter((part) => part.type !== "delete"),
      });
    }
    for (let p = pairCount; p < deletes.length; p++) rows.push({ type: "delete", line: deletes[p] });
    for (let p = pairCount; p < inserts.length; p++) rows.push({ type: "insert", line: inserts[p] });
  }

  return rows;
}
