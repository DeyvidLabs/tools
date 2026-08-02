"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_NANOID_LENGTH,
  ID_TYPE_LABELS,
  generateBatch,
  toCsv,
  toJson,
  type IdType,
} from "./lib";

const ID_TYPES: IdType[] = ["uuid-v4", "uuid-v7", "ulid", "nanoid"];
const DEFAULT_COUNT = 10;

function download(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function IdGenerator() {
  const [type, setType] = useState<IdType>("uuid-v4");
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [nanoidLength, setNanoidLength] = useState(DEFAULT_NANOID_LENGTH);
  // Lazy initializer — computed once on first render rather than in a mount
  // effect, so there's no interactive-vs-initial batch to keep in sync.
  const [ids, setIds] = useState<string[]>(() =>
    generateBatch("uuid-v4", DEFAULT_COUNT, DEFAULT_NANOID_LENGTH),
  );
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setIds(generateBatch(type, count, nanoidLength));
  };

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopyAll = async () => {
    if (ids.length === 0) return;
    await navigator.clipboard.writeText(ids.join("\n"));
    setCopied(true);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">ID Generator</h1>
        <p className="mt-2 text-muted-foreground">
          Generate a batch of UUID v4/v7, ULID, or nanoid identifiers — entirely in your browser.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2">
            {ID_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  type === t
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                {ID_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="count" className="text-xs font-medium text-muted-foreground">
                How many
              </label>
              <input
                id="count"
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) => setCount(Math.min(1000, Math.max(1, Number(e.target.value) || 1)))}
                className="w-24 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
              />
            </div>

            {type === "nanoid" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="nanoid-length" className="text-xs font-medium text-muted-foreground">
                  Length
                </label>
                <input
                  id="nanoid-length"
                  type="number"
                  min={2}
                  max={36}
                  value={nanoidLength}
                  onChange={(e) =>
                    setNanoidLength(Math.min(36, Math.max(2, Number(e.target.value) || 2)))
                  }
                  className="w-24 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Generate
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-card-foreground">{ids.length} generated</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                disabled={ids.length === 0}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                {copied ? "Copied!" : "Copy all"}
              </button>
              <button
                type="button"
                onClick={() => download(`${type}.csv`, toCsv(ids), "text/csv")}
                disabled={ids.length === 0}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => download(`${type}.json`, toJson(ids), "application/json")}
                disabled={ids.length === 0}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                Download JSON
              </button>
            </div>
          </div>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-secondary-foreground">
            {ids.join("\n")}
          </pre>
        </div>
      </div>
    </div>
  );
}
