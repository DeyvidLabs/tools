import { describe, expect, it } from "vitest";
import {
  buildJsonLines,
  diffChars,
  diffJsonValues,
  diffLines,
  formatJson,
  groupLineDiff,
  minifyJson,
  parseJsonStrict,
} from "./lib";

describe("parseJsonStrict", () => {
  it("parses a valid object", () => {
    expect(parseJsonStrict('{"a": 1, "b": [true, false, null], "c": "x"}')).toEqual({
      ok: true,
      value: { a: 1, b: [true, false, null], c: "x" },
    });
  });

  it("parses numbers, including negatives, decimals, and exponents", () => {
    expect(parseJsonStrict("[-1, 0, 3.14, 1e10, -2.5e-3]")).toEqual({
      ok: true,
      value: [-1, 0, 3.14, 1e10, -2.5e-3],
    });
  });

  it("parses escape sequences and unicode escapes in strings", () => {
    expect(parseJsonStrict('"a\\nb\\t\\u00e9"')).toEqual({ ok: true, value: "a\nb\té" });
  });

  it("reports the line and column of a missing comma", () => {
    const result = parseJsonStrict('{\n  "a": 1\n  "b": 2\n}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.line).toBe(3);
      expect(result.error.column).toBe(3);
    }
  });

  it("reports an error for a trailing comma", () => {
    const result = parseJsonStrict('{"a": 1,}');
    expect(result.ok).toBe(false);
  });

  it("reports an error for unquoted keys", () => {
    const result = parseJsonStrict("{a: 1}");
    expect(result.ok).toBe(false);
  });

  it("reports an error for trailing content", () => {
    const result = parseJsonStrict("{}{}");
    expect(result.ok).toBe(false);
  });

  it("reports an error for empty input", () => {
    const result = parseJsonStrict("");
    expect(result.ok).toBe(false);
  });
});

describe("formatJson / minifyJson", () => {
  it("pretty-prints with the given indent", () => {
    expect(formatJson({ a: 1 }, 2)).toBe('{\n  "a": 1\n}');
  });

  it("minifies to a single line", () => {
    expect(minifyJson({ a: 1, b: [1, 2] })).toBe('{"a":1,"b":[1,2]}');
  });
});

describe("diffJsonValues", () => {
  it("returns no entries for equal values regardless of key order", () => {
    expect(diffJsonValues({ a: 1, b: 2 }, { b: 2, a: 1 })).toEqual([]);
  });

  it("flags an added key", () => {
    expect(diffJsonValues({ a: 1 }, { a: 1, b: 2 })).toEqual([
      { path: "b", type: "added", newValue: 2 },
    ]);
  });

  it("flags a removed key", () => {
    expect(diffJsonValues({ a: 1, b: 2 }, { a: 1 })).toEqual([
      { path: "b", type: "removed", oldValue: 2 },
    ]);
  });

  it("flags a changed value at a nested path", () => {
    expect(diffJsonValues({ a: { b: 1 } }, { a: { b: 2 } })).toEqual([
      { path: "a.b", type: "changed", oldValue: 1, newValue: 2 },
    ]);
  });

  it("flags array element changes with bracket-index paths", () => {
    expect(diffJsonValues({ items: [1, 2] }, { items: [1, 3] })).toEqual([
      { path: "items[1]", type: "changed", oldValue: 2, newValue: 3 },
    ]);
  });

  it("flags array elements added past the shorter array's length", () => {
    expect(diffJsonValues([1], [1, 2])).toEqual([{ path: "[1]", type: "added", newValue: 2 }]);
  });

  it("reports a root-level type change with the (root) placeholder", () => {
    expect(diffJsonValues(1, "1")).toEqual([{ path: "(root)", type: "changed", oldValue: 1, newValue: "1" }]);
  });
});

describe("diffLines", () => {
  it("returns all-equal ops for identical text", () => {
    expect(diffLines("a\nb", "a\nb")).toEqual([
      { type: "equal", line: "a" },
      { type: "equal", line: "b" },
    ]);
  });

  it("finds a single-line replacement", () => {
    expect(diffLines("a\nb\nc", "a\nx\nc")).toEqual([
      { type: "equal", line: "a" },
      { type: "delete", line: "b" },
      { type: "insert", line: "x" },
      { type: "equal", line: "c" },
    ]);
  });

  it("handles a pure insertion", () => {
    expect(diffLines("a\nb", "a\nb\nc")).toEqual([
      { type: "equal", line: "a" },
      { type: "equal", line: "b" },
      { type: "insert", line: "c" },
    ]);
  });

  it("handles a pure deletion", () => {
    expect(diffLines("a\nb\nc", "a\nc")).toEqual([
      { type: "equal", line: "a" },
      { type: "delete", line: "b" },
      { type: "equal", line: "c" },
    ]);
  });

  it("handles completely disjoint text", () => {
    expect(diffLines("a\nb", "c\nd")).toEqual([
      { type: "delete", line: "a" },
      { type: "delete", line: "b" },
      { type: "insert", line: "c" },
      { type: "insert", line: "d" },
    ]);
  });

  it("handles empty input on either side", () => {
    expect(diffLines("", "a")).toEqual([{ type: "delete", line: "" }, { type: "insert", line: "a" }]);
  });
});

describe("buildJsonLines", () => {
  it("attaches a dotted path to each nested object key line", () => {
    const lines = buildJsonLines({ data: { info: { user: { id: 42, name: "bob" } } } });
    const withPaths = lines.filter((l) => l.path).map((l) => l.path);
    expect(withPaths).toEqual(["data", "data.info", "data.info.user", "data.info.user.id", "data.info.user.name"]);
  });

  it("uses bracket-index paths for array items, including nested objects/arrays", () => {
    const lines = buildJsonLines([1, 2, { x: 1 }, [3, 4]]);
    const withPaths = lines.filter((l) => l.path).map((l) => l.path);
    expect(withPaths).toEqual(["[0]", "[1]", "[2]", "[2].x", "[3]", "[3][0]", "[3][1]"]);
  });

  it("doesn't attach a path to an empty nested object/array's line", () => {
    const lines = buildJsonLines({ a: 1, d: {}, e: [] });
    const dLine = lines.find((l) => l.text.includes('"d"'));
    const eLine = lines.find((l) => l.text.includes('"e"'));
    expect(dLine?.path).toBe("d");
    expect(eLine?.path).toBe("e");
    // and no extra lines were produced for the empty containers
    expect(lines.map((l) => l.text.trim())).toEqual(['{', '"a": 1,', '"d": {},', '"e": []', '}']);
  });

  it("doesn't attach a path to closing-bracket lines", () => {
    const lines = buildJsonLines({ a: { b: 1 } });
    const closingLines = lines.filter((l) => /^[}\]],?$/.test(l.text.trim()));
    expect(closingLines.every((l) => l.path === undefined)).toBe(true);
  });

  it("returns a single unpathed line for a root primitive", () => {
    expect(buildJsonLines(42)).toEqual([{ text: "42" }]);
    expect(buildJsonLines("hello")).toEqual([{ text: '"hello"' }]);
  });

  it("handles an escaped quote in a key name", () => {
    const lines = buildJsonLines({ 'weird"key': 1 });
    expect(lines.find((l) => l.path === 'weird"key')).toBeTruthy();
  });
});

describe("diffChars", () => {
  it("returns a single equal run for identical strings", () => {
    expect(diffChars("abc", "abc")).toEqual([{ type: "equal", text: "abc" }]);
  });

  it("finds a single-character substitution", () => {
    expect(diffChars("abc", "axc")).toEqual([
      { type: "equal", text: "a" },
      { type: "delete", text: "b" },
      { type: "insert", text: "x" },
      { type: "equal", text: "c" },
    ]);
  });

  it("merges adjacent same-type characters into runs", () => {
    expect(diffChars("hello world", "hello there")).toEqual([
      { type: "equal", text: "hello " },
      { type: "delete", text: "wo" },
      { type: "insert", text: "the" },
      { type: "equal", text: "r" },
      { type: "delete", text: "ld" },
      { type: "insert", text: "e" },
    ]);
  });
});

describe("groupLineDiff", () => {
  it("passes equal lines through unchanged", () => {
    expect(groupLineDiff(diffLines("a\nb", "a\nb"))).toEqual([
      { type: "equal", line: "a" },
      { type: "equal", line: "b" },
    ]);
  });

  it("pairs a 1:1 delete/insert run into a replace row with a char diff", () => {
    const rows = groupLineDiff(diffLines("foo\nbar\nbaz", "foo\nbxr\nbaz"));
    expect(rows).toEqual([
      { type: "equal", line: "foo" },
      {
        type: "replace",
        oldLine: "bar",
        newLine: "bxr",
        oldParts: [
          { type: "equal", text: "b" },
          { type: "delete", text: "a" },
          { type: "equal", text: "r" },
        ],
        newParts: [
          { type: "equal", text: "b" },
          { type: "insert", text: "x" },
          { type: "equal", text: "r" },
        ],
      },
      { type: "equal", line: "baz" },
    ]);
  });

  it("leaves unmatched runs as plain delete/insert rows", () => {
    const rows = groupLineDiff(diffLines("a\nb", "a\nb\nc"));
    expect(rows).toEqual([
      { type: "equal", line: "a" },
      { type: "equal", line: "b" },
      { type: "insert", line: "c" },
    ]);
  });

  it("pairs same-length delete/insert runs positionally even with 2+ lines", () => {
    const rows = groupLineDiff(diffLines("x\ny", "p\nq"));
    expect(rows).toEqual([
      {
        type: "replace",
        oldLine: "x",
        newLine: "p",
        oldParts: [{ type: "delete", text: "x" }],
        newParts: [{ type: "insert", text: "p" }],
      },
      {
        type: "replace",
        oldLine: "y",
        newLine: "q",
        oldParts: [{ type: "delete", text: "y" }],
        newParts: [{ type: "insert", text: "q" }],
      },
    ]);
  });
});
