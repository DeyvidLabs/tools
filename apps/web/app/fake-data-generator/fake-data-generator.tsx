"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { DownloadButton } from "@/components/download-button";
import { NumberStepperInput } from "@/components/number-stepper-input";
import { FIELD_DEFS, generateRows, toCsv, toJson, toTypeScript, type Column, type FieldType } from "./lib";

const DEFAULT_COLUMNS: Column[] = [
  { key: "fullName", type: "fullName" },
  { key: "email", type: "email" },
  { key: "city", type: "city" },
];
const DEFAULT_COUNT = 10;
const MAX_COUNT = 1000;

function download(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function FakeDataGenerator() {
  const [columns, setColumns] = useState<Column[]>([...DEFAULT_COLUMNS, { key: "", type: "firstName" }]);
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [seedInput, setSeedInput] = useState("");
  const [copied, setCopied] = useState<"csv" | "json" | "ts" | null>(null);

  const activeColumns = useMemo(() => columns.filter((c) => c.key.trim() !== ""), [columns]);

  const seed = seedInput.trim() === "" ? undefined : Number(seedInput);
  const seedIsInvalid = seedInput.trim() !== "" && !Number.isFinite(seed);

  const duplicateKeys = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const c of activeColumns) {
      if (seen.has(c.key)) dupes.add(c.key);
      seen.add(c.key);
    }
    return dupes;
  }, [activeColumns]);

  // Generated once at the max size and then sliced by `count`, rather than
  // regenerated at the exact count on every render: regenerating from
  // scratch on each stepper click reshuffled every row's random content
  // (different text lengths, different table-row heights), producing a
  // jarring full-page reflow on every click instead of just adding/removing
  // the last row.
  const rowPool = useMemo(() => {
    if (activeColumns.length === 0 || duplicateKeys.size > 0) return [];
    return generateRows({ columns: activeColumns, count: MAX_COUNT, seed: seedIsInvalid ? undefined : seed });
  }, [activeColumns, seed, seedIsInvalid, duplicateKeys]);

  const rows = useMemo(() => rowPool.slice(0, count), [rowPool, count]);

  const updateColumn = (index: number, patch: Partial<Column>) => {
    setColumns((prev) => {
      const next = prev.map((c, i) => (i === index ? { ...c, ...patch } : c));
      const last = next[next.length - 1];
      if (last && last.key !== "") next.push({ key: "", type: "firstName" });
      return next;
    });
  };

  const removeColumn = (index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopy = async (format: "csv" | "json" | "ts") => {
    const text =
      format === "csv" ? toCsv(rows, activeColumns) : format === "json" ? toJson(rows) : toTypeScript(rows, activeColumns);
    await navigator.clipboard.writeText(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          Fake Data Generator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Generate batches of fake names, emails, addresses, lorem ipsum, and dates — entirely in
          your browser. Set a seed for reproducible results.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <h2 className="text-xs font-medium text-muted-foreground">Columns</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Name each column however you like and pick what kind of value it should hold.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {columns.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={c.key}
                  onChange={(e) => updateColumn(i, { key: e.target.value })}
                  placeholder="Column name (e.g. Nombre)"
                  className={`w-1/2 rounded-md border bg-secondary px-2 py-1.5 font-mono text-xs text-secondary-foreground placeholder:text-muted-foreground ${
                    c.key.trim() !== "" && duplicateKeys.has(c.key)
                      ? "border-accent-rose/50"
                      : "border-border"
                  }`}
                />
                <select
                  value={c.type}
                  onChange={(e) => updateColumn(i, { type: e.target.value as FieldType })}
                  className="flex-1 rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-secondary-foreground"
                >
                  {FIELD_DEFS.map((d) => (
                    <option key={d.type} value={d.type}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {i < columns.length - 1 && (
                  <button
                    type="button"
                    onClick={() => removeColumn(i)}
                    aria-label="Remove column"
                    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-accent-rose/50 hover:text-accent-rose"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {duplicateKeys.size > 0 && (
            <p className="mt-2 text-sm text-accent-rose">
              Column names must be unique: {Array.from(duplicateKeys).join(", ")}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              Rows
              <NumberStepperInput value={count} onChange={setCount} min={1} max={MAX_COUNT} className="w-24" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              Seed (optional)
              <input
                type="text"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder="random"
                className="w-32 rounded-md border border-border bg-secondary px-2 py-1.5 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
              />
            </label>
          </div>
          {seedIsInvalid && (
            <p className="mt-2 text-sm text-accent-rose">Seed must be a number.</p>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-card-foreground">
              Preview ({rows.length} row{rows.length === 1 ? "" : "s"})
            </h2>
            <div className="flex flex-wrap gap-2">
              <CopyButton label="Copy CSV" copied={copied === "csv"} onClick={() => handleCopy("csv")} />
              <CopyButton label="Copy JSON" copied={copied === "json"} onClick={() => handleCopy("json")} />
              <CopyButton
                label="Copy TypeScript"
                copied={copied === "ts"}
                onClick={() => handleCopy("ts")}
              />
              <DownloadButton
                label="Download CSV"
                onClick={() => download("fake-data.csv", toCsv(rows, activeColumns), "text/csv")}
              />
              <DownloadButton
                label="Download JSON"
                onClick={() => download("fake-data.json", toJson(rows), "application/json")}
              />
              <DownloadButton
                label="Download .ts"
                onClick={() => download("fake-data.ts", toTypeScript(rows, activeColumns), "text/typescript")}
              />
            </div>
          </div>

          {activeColumns.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Name at least one column above.</p>
          ) : (
            <div className="mt-4 h-[420px] overflow-auto">
              {/* Fixed height (not max-height) with its own scroll, instead
                  of sizing to `count` rows: max-height still shrinks to fit
                  content under the cap, so the page's total height would
                  still change below ~10 rows. A fixed height means the page
                  never resizes at all, so it can't force the browser to
                  clamp/re-adjust scrollY while scrolled down — which is what
                  was yanking the page (and the cursor's target) out from
                  under a click mid-interaction on the Rows stepper above. */}
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-card text-xs text-muted-foreground [&>th]:sticky [&>th]:top-0 [&>th]:bg-card">
                    {activeColumns.map((c) => (
                      <th key={c.key} className="pb-2 pr-4 font-medium">
                        {c.key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-b-0">
                      {activeColumns.map((c) => (
                        <td key={c.key} className="py-2 pr-4 font-mono text-xs text-secondary-foreground">
                          {row[c.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing 50 of {rows.length} rows — use Copy/Download for the full batch.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
