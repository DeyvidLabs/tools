import Papa from "papaparse";
import { dump as dumpYaml, load as loadYaml } from "js-yaml";

export type DataFormat = "csv" | "json" | "yaml";

export interface CsvOptions {
  delimiter: string;
  hasHeader: boolean;
}

export const DEFAULT_CSV_OPTIONS: CsvOptions = { delimiter: ",", hasHeader: true };

export type ParseResult = { ok: true; value: unknown } | { ok: false; error: string };
export type SerializeResult = { ok: true; output: string } | { ok: false; error: string };

export function parseCsv(text: string, options: CsvOptions): ParseResult {
  const result = Papa.parse(text.trim(), {
    delimiter: options.delimiter,
    header: options.hasHeader,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0) {
    const err = result.errors[0];
    return { ok: false, error: err.row !== undefined ? `Row ${err.row + 1}: ${err.message}` : err.message };
  }
  return { ok: true, value: result.data };
}

// Papa.unparse renders whatever shape it's given, but a non-tabular value (a
// primitive, or an array of primitives) would silently produce a nonsensical
// single-column CSV rather than the "one object per row" a user expects, so
// that shape is rejected up front instead.
export function serializeCsv(value: unknown, options: CsvOptions): SerializeResult {
  let rows: unknown[];
  if (Array.isArray(value)) {
    rows = value;
  } else if (value !== null && typeof value === "object") {
    rows = [value];
  } else {
    return { ok: false, error: "Top-level data must be an object or an array of objects to convert to CSV" };
  }
  if (rows.some((row) => row === null || typeof row !== "object" || Array.isArray(row))) {
    return { ok: false, error: "Every item must be an object (with the same keys) to convert to CSV" };
  }
  try {
    const output = Papa.unparse(rows as Record<string, unknown>[], {
      delimiter: options.delimiter,
      header: options.hasHeader,
    });
    return { ok: true, output };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to build CSV" };
  }
}

export function parseJson(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
}

export function serializeJson(value: unknown, indent = 2): string {
  return JSON.stringify(value, null, indent);
}

export function parseYaml(text: string): ParseResult {
  try {
    return { ok: true, value: loadYaml(text) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid YAML" };
  }
}

export function serializeYaml(value: unknown): string {
  return dumpYaml(value);
}

function parseByFormat(format: DataFormat, text: string, csvOptions: CsvOptions): ParseResult {
  if (format === "csv") return parseCsv(text, csvOptions);
  if (format === "json") return parseJson(text);
  return parseYaml(text);
}

function serializeByFormat(format: DataFormat, value: unknown, csvOptions: CsvOptions): SerializeResult {
  if (format === "csv") return serializeCsv(value, csvOptions);
  if (format === "json") return { ok: true, output: serializeJson(value) };
  return { ok: true, output: serializeYaml(value) };
}

export function convert(
  sourceFormat: DataFormat,
  targetFormat: DataFormat,
  text: string,
  csvOptions: CsvOptions = DEFAULT_CSV_OPTIONS,
): SerializeResult {
  const parsed = parseByFormat(sourceFormat, text, csvOptions);
  if (!parsed.ok) return parsed;
  return serializeByFormat(targetFormat, parsed.value, csvOptions);
}
