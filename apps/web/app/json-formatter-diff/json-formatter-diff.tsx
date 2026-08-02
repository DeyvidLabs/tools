"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildJsonLines,
  diffJsonValues,
  diffLines,
  formatJson,
  groupLineDiff,
  minifyJson,
  parseJsonStrict,
  type CharDiffPart,
  type JsonDiffEntry,
} from "./lib";

const MODES = ["format", "json-diff", "text-diff"] as const;
type ToolMode = (typeof MODES)[number];

const MODE_LABELS: Record<ToolMode, string> = {
  format: "Format / Validate",
  "json-diff": "JSON diff",
  "text-diff": "Text diff",
};

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

function FormatPanel() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState(2);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const { copied, copy } = useCopy();
  const { copied: pathCopied, copy: copyPath } = useCopy();

  const parsed = useMemo(() => parseJsonStrict(input), [input]);
  const formatted = useMemo(() => (parsed.ok ? formatJson(parsed.value, indent) : null), [parsed, indent]);
  const jsonLines = useMemo(
    () => (parsed.ok ? buildJsonLines(parsed.value, indent) : null),
    [parsed, indent],
  );
  // Validated against the current lines rather than cleared via an effect on
  // every input edit — a path that still exists after a small edit stays
  // selected, and one that no longer does just stops rendering the bar.
  const currentPaths = useMemo(
    () => new Set(jsonLines?.filter((l) => l.path).map((l) => l.path)),
    [jsonLines],
  );
  const displayedPath = selectedPath && currentPaths.has(selectedPath) ? selectedPath : null;

  return (
    <>
      <div className="mt-6 flex flex-col gap-2">
        <label htmlFor="format-input" className="text-xs font-medium text-muted-foreground">
          JSON
        </label>
        <textarea
          id="format-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          spellCheck={false}
          placeholder='{"key": "value"}'
          className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
        />
        <div>
          <button
            type="button"
            onClick={() => parsed.ok && setInput(minifyJson(parsed.value))}
            disabled={!parsed.ok}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            Minify in place
          </button>
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg border p-5 ${
          parsed.ok ? "border-border bg-card/70" : "border-accent-rose/50 bg-accent-rose/10"
        }`}
      >
        {parsed.ok ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-card-foreground">Valid JSON</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="indent" className="text-xs font-medium text-muted-foreground">
                  Indent
                </label>
                <input
                  id="indent"
                  type="number"
                  min={0}
                  max={8}
                  value={indent}
                  onChange={(e) => setIndent(Math.min(8, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-14 rounded-md border border-border bg-secondary px-2 py-1 text-sm text-secondary-foreground"
                />
                <button
                  type="button"
                  onClick={() => formatted && copy(formatted)}
                  className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Click a key to see its path.</p>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-secondary-foreground">
              {jsonLines?.map((line, i) =>
                line.path ? (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPath(line.path!)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedPath(line.path!)}
                    className={`cursor-pointer rounded-sm transition-colors hover:bg-primary/15 ${
                      displayedPath === line.path ? "bg-primary/20 text-primary" : ""
                    }`}
                  >
                    {line.text}
                  </div>
                ) : (
                  <div key={i}>{line.text}</div>
                ),
              )}
            </pre>
            {displayedPath && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-2">
                <span className="font-mono text-sm text-primary">{displayedPath}</span>
                <button
                  type="button"
                  onClick={() => copyPath(displayedPath!)}
                  className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {pathCopied ? "Copied!" : "Copy path"}
                </button>
              </div>
            )}
          </>
        ) : input.trim() ? (
          <p className="text-sm text-accent-rose">
            Line {parsed.error.line}, column {parsed.error.column}: {parsed.error.message}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Paste some JSON above to validate it.</p>
        )}
      </div>
    </>
  );
}

function JsonDiffPanel() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const leftParsed = useMemo(() => parseJsonStrict(left), [left]);
  const rightParsed = useMemo(() => parseJsonStrict(right), [right]);
  const diff = useMemo<JsonDiffEntry[] | null>(() => {
    if (!leftParsed.ok || !rightParsed.ok) return null;
    return diffJsonValues(leftParsed.value, rightParsed.value);
  }, [leftParsed, rightParsed]);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="left-json" className="text-xs font-medium text-muted-foreground">
            JSON A
          </label>
          <textarea
            id="left-json"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="right-json" className="text-xs font-medium text-muted-foreground">
            JSON B
          </label>
          <textarea
            id="right-json"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground"
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card/70 p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Structural diff</h2>
        {!leftParsed.ok ? (
          <p className="mt-2 text-sm text-accent-rose">
            JSON A — line {leftParsed.error.line}, column {leftParsed.error.column}: {leftParsed.error.message}
          </p>
        ) : !rightParsed.ok ? (
          <p className="mt-2 text-sm text-accent-rose">
            JSON B — line {rightParsed.error.line}, column {rightParsed.error.column}: {rightParsed.error.message}
          </p>
        ) : diff && diff.length > 0 ? (
          <ol className="mt-3 flex flex-col gap-1.5 text-sm">
            {diff.map((entry, i) => (
              <li key={i} className="font-mono">
                {entry.type === "added" && (
                  <span className="text-emerald-500">
                    + {entry.path}: {JSON.stringify(entry.newValue)}
                  </span>
                )}
                {entry.type === "removed" && (
                  <span className="text-accent-rose">
                    - {entry.path}: {JSON.stringify(entry.oldValue)}
                  </span>
                )}
                {entry.type === "changed" && (
                  <span className="text-card-foreground">
                    ~ {entry.path}: {JSON.stringify(entry.oldValue)} → {JSON.stringify(entry.newValue)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {left.trim() && right.trim() ? "No differences." : "Paste JSON in both boxes above to diff them."}
          </p>
        )}
      </div>
    </>
  );
}

function CharDiffLine({
  parts,
  highlightType,
}: {
  parts: CharDiffPart[];
  highlightType: "delete" | "insert";
}) {
  const highlightClass =
    highlightType === "delete"
      ? "rounded-sm bg-accent-rose/25 text-accent-rose"
      : "rounded-sm bg-emerald-500/25 text-emerald-500";

  return (
    <>
      {parts.map((part, i) =>
        part.type === highlightType ? (
          <mark key={i} className={highlightClass}>
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function TextDiffPanel() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const rows = useMemo(() => groupLineDiff(diffLines(left, right)), [left, right]);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="left-text" className="text-xs font-medium text-muted-foreground">
            Text A
          </label>
          <textarea
            id="left-text"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="right-text" className="text-xs font-medium text-muted-foreground">
            Text B
          </label>
          <textarea
            id="right-text"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground"
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card/70 p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Line diff</h2>
        {left || right ? (
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-secondary-foreground">
            {rows.map((row, i) => {
              if (row.type === "equal") {
                return <div key={i}>{"  "}{row.line}</div>;
              }
              if (row.type === "delete") {
                return (
                  <div key={i} className="text-accent-rose">
                    - {row.line}
                  </div>
                );
              }
              if (row.type === "insert") {
                return (
                  <div key={i} className="text-emerald-500">
                    + {row.line}
                  </div>
                );
              }
              return (
                <div key={i}>
                  <div className="text-accent-rose">
                    - <CharDiffLine parts={row.oldParts} highlightType="delete" />
                  </div>
                  <div className="text-emerald-500">
                    + <CharDiffLine parts={row.newParts} highlightType="insert" />
                  </div>
                </div>
              );
            })}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Paste text in both boxes above to diff them.</p>
        )}
      </div>
    </>
  );
}

export function JsonFormatterDiff() {
  const [mode, setMode] = useState<ToolMode>("format");

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          JSON Formatter / Validator / Diff
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pretty-print and validate JSON, diff two JSON documents key by key, or diff plain text line by
          line — entirely in your browser.
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

        {mode === "format" && <FormatPanel />}
        {mode === "json-diff" && <JsonDiffPanel />}
        {mode === "text-diff" && <TextDiffPanel />}
      </div>
    </div>
  );
}
