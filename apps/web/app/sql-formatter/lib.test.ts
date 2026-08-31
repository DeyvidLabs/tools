import { describe, expect, it } from "vitest";
import { formatSql, minifySql } from "./lib";

describe("formatSql", () => {
  it("pretty-prints a simple query with uppercase keywords", () => {
    const result = formatSql("select a, b from foo where a = 1", "sql", true);
    expect(result).toEqual({
      ok: true,
      output: "SELECT\n  a,\n  b\nFROM\n  foo\nWHERE\n  a = 1",
    });
  });

  it("preserves original keyword case when uppercaseKeywords is false", () => {
    const result = formatSql("select a from foo", "sql", false);
    expect(result).toEqual({ ok: true, output: "select\n  a\nfrom\n  foo" });
  });

  it("formats using the postgresql dialect", () => {
    const result = formatSql("select a::int from foo", "postgresql", true);
    expect(result.ok).toBe(true);
  });

  it("formats using the mysql dialect", () => {
    const result = formatSql("select `a` from `foo`", "mysql", true);
    expect(result.ok).toBe(true);
  });

  it("returns an empty output for empty input", () => {
    expect(formatSql("", "sql", true)).toEqual({ ok: true, output: "" });
  });

  it("reports a concise error for invalid SQL, without the grammar dump", () => {
    const result = formatSql("select * from foo where )))", "postgresql", true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toContain("\n");
      expect(result.error.length).toBeLessThan(200);
    }
  });
});

describe("minifySql", () => {
  it("collapses a pretty-printed query onto one line", () => {
    const input = "SELECT\n  a,\n  b\nFROM\n  foo\nWHERE\n  a = 1";
    expect(minifySql(input)).toBe("SELECT a, b FROM foo WHERE a = 1");
  });

  it("strips line comments", () => {
    expect(minifySql("SELECT a -- this is a comment\nFROM foo")).toBe("SELECT a FROM foo");
  });

  it("strips block comments", () => {
    expect(minifySql("SELECT a /* block\nspanning lines */ FROM foo")).toBe("SELECT a FROM foo");
  });

  it("drops the space before a comma, close paren, and semicolon", () => {
    const input = "SELECT a\n     , b\nFROM foo\n WHERE a IN (\n  1\n  , 2\n)\n;";
    expect(minifySql(input)).toBe("SELECT a, b FROM foo WHERE a IN (1, 2);");
  });

  it("drops the space right after an open paren", () => {
    expect(minifySql("foo(\n  a,\n  b\n)")).toBe("foo(a, b)");
  });

  it("preserves whitespace inside a single-quoted string literal", () => {
    expect(minifySql("SELECT 'a   b\nc' AS x")).toBe("SELECT 'a   b\nc' AS x");
  });

  it("preserves a doubled single quote inside a string literal", () => {
    expect(minifySql("SELECT 'it''s'  FROM foo")).toBe("SELECT 'it''s' FROM foo");
  });

  it("preserves whitespace inside a double-quoted identifier", () => {
    expect(minifySql('SELECT "weird   name" FROM foo')).toBe('SELECT "weird   name" FROM foo');
  });

  it("preserves whitespace inside a backtick identifier", () => {
    expect(minifySql("SELECT `weird   name` FROM foo")).toBe("SELECT `weird   name` FROM foo");
  });

  it("does not treat -- inside a string literal as a comment", () => {
    expect(minifySql("SELECT '--not a comment' FROM foo")).toBe("SELECT '--not a comment' FROM foo");
  });

  it("returns an empty string for empty input", () => {
    expect(minifySql("")).toBe("");
    expect(minifySql("   \n  \t  ")).toBe("");
  });
});
