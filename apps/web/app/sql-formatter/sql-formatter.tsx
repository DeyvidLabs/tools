"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DIALECT_LABELS, formatSql, minifySql, type SqlDialect } from "./lib";

const DIALECTS: SqlDialect[] = ["sql", "postgresql", "mysql"];
const MODES = ["format", "minify"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABELS: Record<Mode, string> = {
  format: "Format",
  minify: "Minify",
};

const PLACEHOLDER = "select id, name from users where active = true order by name;";

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

export function SqlFormatter() {
  const [mode, setMode] = useState<Mode>("format");
  const [input, setInput] = useState("");
  const [dialect, setDialect] = useState<SqlDialect>("sql");
  const [uppercaseKeywords, setUppercaseKeywords] = useState(true);
  const { copied, copy } = useCopy();

  const result = useMemo(() => {
    if (!input.trim()) return null;
    if (mode === "minify") return { ok: true as const, output: minifySql(input) };
    return formatSql(input, dialect, uppercaseKeywords);
  }, [input, mode, dialect, uppercaseKeywords]);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          SQL Formatter / Minifier
        </h1>
        <p className="mt-2 text-muted-foreground">
          Paste a SQL query and pretty-print or minify it — entirely in your browser.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                mode === m
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="sql-input" className="text-xs font-medium text-muted-foreground">
            SQL
          </label>
          <textarea
            id="sql-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder={PLACEHOLDER}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
          />
        </div>

        {mode === "format" && (
          <div className="mt-3 flex flex-wrap items-center gap-4 rounded-md border border-border bg-card/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <label htmlFor="dialect" className="text-xs text-muted-foreground">
                Dialect
              </label>
              <select
                id="dialect"
                value={dialect}
                onChange={(e) => setDialect(e.target.value as SqlDialect)}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground"
              >
                {DIALECTS.map((d) => (
                  <option key={d} value={d}>
                    {DIALECT_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={uppercaseKeywords}
                onChange={(e) => setUppercaseKeywords(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border"
              />
              Uppercase keywords
            </label>
          </div>
        )}

        <div
          className={`mt-4 rounded-lg border p-5 ${
            result && !result.ok ? "border-accent-rose/50 bg-accent-rose/10" : "border-border bg-card/70"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-card-foreground">Output</h2>
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
            <p className="mt-2 text-sm text-muted-foreground">Paste a SQL query above to get started.</p>
          ) : result.ok ? (
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-secondary-foreground">
              {result.output || "(empty)"}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-accent-rose">{result.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
