"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { generateTypeScript, generateZodSchema } from "./lib";

const MODES = ["typescript", "zod"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABELS: Record<Mode, string> = {
  typescript: "TypeScript",
  zod: "Zod schema",
};

const PLACEHOLDER = '[\n  { "id": 1, "name": "bob", "tags": ["a", "b"] },\n  { "id": 2, "name": "alice" }\n]';

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

export function JsonToTsZod() {
  const [mode, setMode] = useState<Mode>("typescript");
  const [input, setInput] = useState("");
  const [rootName, setRootName] = useState("Root");
  const { copied, copy } = useCopy();

  const effectiveName = rootName.trim() || "Root";
  const result = useMemo(() => {
    if (!input.trim()) return null;
    return mode === "typescript" ? generateTypeScript(input, effectiveName) : generateZodSchema(input, effectiveName);
  }, [input, mode, effectiveName]);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          JSON to TypeScript / Zod Schema Generator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Paste sample JSON and generate a matching TypeScript interface or Zod schema — entirely in your
          browser. Fields missing from some array elements are inferred as optional.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
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
          <div className="flex items-center gap-2">
            <label htmlFor="root-name" className="text-xs text-muted-foreground">
              Name
            </label>
            <input
              id="root-name"
              type="text"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="Root"
              className="w-32 rounded-md border border-border bg-secondary px-2 py-1 text-sm text-secondary-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="json-input" className="text-xs font-medium text-muted-foreground">
            Sample JSON
          </label>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder={PLACEHOLDER}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div
          className={`mt-4 rounded-lg border p-5 ${
            result && !result.ok ? "border-accent-rose/50 bg-accent-rose/10" : "border-border bg-card/70"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-card-foreground">{MODE_LABELS[mode]}</h2>
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
            <p className="mt-2 text-sm text-muted-foreground">Paste some sample JSON above to generate a schema.</p>
          ) : result.ok ? (
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-secondary-foreground">
              {result.output}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-accent-rose">{result.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
