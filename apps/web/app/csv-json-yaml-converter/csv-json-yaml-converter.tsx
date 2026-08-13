"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { convert, type CsvOptions, type DataFormat } from "./lib";

const FORMATS: DataFormat[] = ["csv", "json", "yaml"];

const FORMAT_LABELS: Record<DataFormat, string> = {
  csv: "CSV",
  json: "JSON",
  yaml: "YAML",
};

const PLACEHOLDERS: Record<DataFormat, string> = {
  csv: "name,age\nbob,30\nalice,25",
  json: '[\n  { "name": "bob", "age": 30 }\n]',
  yaml: "- name: bob\n  age: 30\n",
};

const DELIMITERS = [
  { label: "Comma ( , )", value: "," },
  { label: "Semicolon ( ; )", value: ";" },
  { label: "Tab", value: "\t" },
  { label: "Pipe ( | )", value: "|" },
];

function useCopy() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  };
  return { copied, copy };
}

function OutputPanel({ format, input, sourceFormat, csvOptions }: {
  format: DataFormat;
  input: string;
  sourceFormat: DataFormat;
  csvOptions: CsvOptions;
}) {
  const { copied, copy } = useCopy();
  const result = useMemo(
    () => (input.trim() ? convert(sourceFormat, format, input, csvOptions) : null),
    [input, sourceFormat, format, csvOptions],
  );

  return (
    <div
      className={`rounded-lg border p-5 ${
        result && !result.ok ? "border-accent-rose/50 bg-accent-rose/10" : "border-border bg-card/70"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-card-foreground">{FORMAT_LABELS[format]}</h2>
        {result?.ok && (
          <button
            type="button"
            onClick={() => copy(result.output)}
            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      {!result ? (
        <p className="mt-2 text-sm text-muted-foreground">Paste some {FORMAT_LABELS[sourceFormat]} above to convert it.</p>
      ) : result.ok ? (
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-secondary-foreground">
          {result.output}
        </pre>
      ) : (
        <p className="mt-2 text-sm text-accent-rose">{result.error}</p>
      )}
    </div>
  );
}

export function CsvJsonYamlConverter() {
  const [sourceFormat, setSourceFormat] = useState<DataFormat>("csv");
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(true);

  const csvOptions: CsvOptions = { delimiter, hasHeader };
  const targetFormats = FORMATS.filter((f) => f !== sourceFormat);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          CSV / JSON / YAML Converter
        </h1>
        <p className="mt-2 text-muted-foreground">
          Paste data in one format and get it converted to the other two — entirely in your browser.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSourceFormat(f)}
              aria-pressed={sourceFormat === f}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                sourceFormat === f
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              {FORMAT_LABELS[f]} input
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="source-input" className="text-xs font-medium text-muted-foreground">
            {FORMAT_LABELS[sourceFormat]}
          </label>
          <textarea
            id="source-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder={PLACEHOLDERS[sourceFormat]}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 rounded-md border border-border bg-card/70 px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">CSV options</span>
          <div className="flex items-center gap-2">
            <label htmlFor="delimiter" className="text-xs text-muted-foreground">
              Delimiter
            </label>
            <select
              id="delimiter"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground"
            >
              {DELIMITERS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border"
            />
            First row is header
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {targetFormats.map((f) => (
            <OutputPanel key={f} format={f} input={input} sourceFormat={sourceFormat} csvOptions={csvOptions} />
          ))}
        </div>
      </div>
    </div>
  );
}
