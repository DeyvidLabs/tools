import { describe, expect, it } from "vitest";
import { diffEnv, lintEnv, parseEnv } from "./lib";

describe("parseEnv", () => {
  it("parses plain KEY=VALUE pairs", () => {
    expect(parseEnv("PORT=3000")).toEqual([{ line: 1, key: "PORT", value: "3000", quote: null }]);
  });

  it("skips blank lines and comments", () => {
    expect(parseEnv("# a comment\n\nPORT=3000")).toEqual([
      { line: 3, key: "PORT", value: "3000", quote: null },
    ]);
  });

  it("strips a leading export keyword", () => {
    expect(parseEnv("export PORT=3000")).toEqual([
      { line: 1, key: "PORT", value: "3000", quote: null },
    ]);
  });

  it("unwraps double- and single-quoted values", () => {
    expect(parseEnv('NAME="my app"')).toEqual([
      { line: 1, key: "NAME", value: "my app", quote: '"' },
    ]);
    expect(parseEnv("NAME='my app'")).toEqual([
      { line: 1, key: "NAME", value: "my app", quote: "'" },
    ]);
  });

  it("strips a trailing inline comment on unquoted values only", () => {
    expect(parseEnv("PORT=3000 # default port")).toEqual([
      { line: 1, key: "PORT", value: "3000", quote: null },
    ]);
    expect(parseEnv('NAME="value # not a comment"')).toEqual([
      { line: 1, key: "NAME", value: "value # not a comment", quote: '"' },
    ]);
  });

  it("ignores lines with no '='", () => {
    expect(parseEnv("just some text")).toEqual([]);
  });
});

describe("lintEnv", () => {
  it("flags an invalid key name", () => {
    const issues = lintEnv("1PORT=3000");
    expect(issues).toContainEqual({
      line: 1,
      key: "1PORT",
      severity: "error",
      message: expect.stringContaining("isn't a valid key"),
    });
  });

  it("flags a duplicate key against the line it first appeared on", () => {
    const issues = lintEnv("PORT=3000\nHOST=localhost\nPORT=4000");
    expect(issues).toContainEqual({
      line: 3,
      key: "PORT",
      severity: "warning",
      message: expect.stringContaining("already defined on line 1"),
    });
  });

  it("flags an empty value", () => {
    const issues = lintEnv("SECRET=");
    expect(issues).toContainEqual({
      line: 1,
      key: "SECRET",
      severity: "warning",
      message: expect.stringContaining("empty value"),
    });
  });

  it("flags the minority quote style when both are used", () => {
    const issues = lintEnv('A="1"\nB="2"\nC="3"\nD=\'4\'');
    expect(issues).toContainEqual({
      line: 4,
      key: "D",
      severity: "warning",
      message: expect.stringContaining("most of the file uses"),
    });
  });

  it("doesn't flag quoting when only one style is used", () => {
    const issues = lintEnv('A="1"\nB="2"');
    expect(issues).toEqual([]);
  });

  it("returns no issues for a clean file", () => {
    expect(lintEnv("PORT=3000\nHOST=localhost")).toEqual([]);
  });
});

describe("diffEnv", () => {
  it("finds keys missing from the file but present in the sample", () => {
    const result = diffEnv("PORT=3000", "PORT=\nHOST=\nAPI_KEY=");
    expect(result.missingKeys).toEqual(["HOST", "API_KEY"]);
  });

  it("finds keys present in the file but absent from the sample", () => {
    const result = diffEnv("PORT=3000\nDEBUG=true", "PORT=");
    expect(result.extraKeys).toEqual(["DEBUG"]);
  });

  it("returns empty arrays when the key sets match", () => {
    const result = diffEnv("PORT=3000\nHOST=x", "PORT=\nHOST=");
    expect(result).toEqual({ missingKeys: [], extraKeys: [] });
  });
});
