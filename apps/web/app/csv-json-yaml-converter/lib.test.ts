import { describe, expect, it } from "vitest";
import {
  convert,
  parseCsv,
  parseJson,
  parseYaml,
  serializeCsv,
  serializeJson,
  serializeYaml,
} from "./lib";

describe("parseCsv", () => {
  it("parses rows into objects when hasHeader is true", () => {
    const result = parseCsv("name,age\nbob,30\nalice,25", { delimiter: ",", hasHeader: true });
    expect(result).toEqual({
      ok: true,
      value: [
        { name: "bob", age: 30 },
        { name: "alice", age: 25 },
      ],
    });
  });

  it("parses rows into arrays when hasHeader is false", () => {
    const result = parseCsv("bob,30\nalice,25", { delimiter: ",", hasHeader: false });
    expect(result).toEqual({ ok: true, value: [["bob", 30], ["alice", 25]] });
  });

  it("respects a custom delimiter", () => {
    const result = parseCsv("name;age\nbob;30", { delimiter: ";", hasHeader: true });
    expect(result).toEqual({ ok: true, value: [{ name: "bob", age: 30 }] });
  });

  it("reports an error for a malformed row", () => {
    const result = parseCsv('a,b\n"unterminated,1', { delimiter: ",", hasHeader: true });
    expect(result.ok).toBe(false);
  });
});

describe("serializeCsv", () => {
  it("builds a header + rows CSV from an array of objects", () => {
    const result = serializeCsv(
      [
        { name: "bob", age: 30 },
        { name: "alice", age: 25 },
      ],
      { delimiter: ",", hasHeader: true },
    );
    expect(result).toEqual({ ok: true, output: "name,age\r\nbob,30\r\nalice,25" });
  });

  it("wraps a single top-level object into a one-row CSV", () => {
    const result = serializeCsv({ name: "bob", age: 30 }, { delimiter: ",", hasHeader: true });
    expect(result).toEqual({ ok: true, output: "name,age\r\nbob,30" });
  });

  it("omits the header row when hasHeader is false", () => {
    const result = serializeCsv([{ name: "bob" }], { delimiter: ",", hasHeader: false });
    expect(result).toEqual({ ok: true, output: "bob" });
  });

  it("rejects an array of primitives", () => {
    const result = serializeCsv([1, 2, 3], { delimiter: ",", hasHeader: true });
    expect(result.ok).toBe(false);
  });

  it("rejects a top-level primitive", () => {
    const result = serializeCsv(42, { delimiter: ",", hasHeader: true });
    expect(result.ok).toBe(false);
  });
});

describe("parseJson / serializeJson", () => {
  it("round-trips an object", () => {
    expect(parseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
    expect(serializeJson({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it("reports an error for invalid JSON", () => {
    const result = parseJson("{a:1}");
    expect(result.ok).toBe(false);
  });
});

describe("parseYaml / serializeYaml", () => {
  it("round-trips an object", () => {
    expect(parseYaml("a: 1\nb: two\n")).toEqual({ ok: true, value: { a: 1, b: "two" } });
    expect(serializeYaml({ a: 1, b: "two" })).toBe("a: 1\nb: two\n");
  });

  it("reports an error for invalid YAML", () => {
    const result = parseYaml("a: [1, 2\n");
    expect(result.ok).toBe(false);
  });
});

describe("convert", () => {
  it("converts CSV to JSON", () => {
    const result = convert("csv", "json", "name,age\nbob,30", { delimiter: ",", hasHeader: true });
    expect(result).toEqual({ ok: true, output: '[\n  {\n    "name": "bob",\n    "age": 30\n  }\n]' });
  });

  it("converts CSV to YAML", () => {
    const result = convert("csv", "yaml", "name,age\nbob,30", { delimiter: ",", hasHeader: true });
    expect(result).toEqual({ ok: true, output: "- name: bob\n  age: 30\n" });
  });

  it("converts JSON to CSV", () => {
    const result = convert("json", "csv", '[{"name":"bob","age":30}]', { delimiter: ",", hasHeader: true });
    expect(result).toEqual({ ok: true, output: "name,age\r\nbob,30" });
  });

  it("converts YAML to JSON", () => {
    const result = convert("yaml", "json", "name: bob\nage: 30\n", { delimiter: ",", hasHeader: true });
    expect(result).toEqual({ ok: true, output: '{\n  "name": "bob",\n  "age": 30\n}' });
  });

  it("converts JSON to YAML", () => {
    const result = convert("json", "yaml", '{"name":"bob"}', { delimiter: ",", hasHeader: true });
    expect(result).toEqual({ ok: true, output: "name: bob\n" });
  });

  it("propagates a parse error from the source format instead of serializing", () => {
    const result = convert("json", "yaml", "{not valid json", { delimiter: ",", hasHeader: true });
    expect(result.ok).toBe(false);
  });

  it("propagates a serialize error from the target format", () => {
    const result = convert("json", "csv", "[1,2,3]", { delimiter: ",", hasHeader: true });
    expect(result.ok).toBe(false);
  });
});
