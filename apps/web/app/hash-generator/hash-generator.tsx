"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HASH_ALGORITHMS, hashBytes, type HashAlgorithm } from "./lib";

type InputMode = "text" | "file";

export function HashGenerator() {
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<Partial<Record<HashAlgorithm, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<HashAlgorithm | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const bytes =
        mode === "text"
          ? text
            ? new TextEncoder().encode(text)
            : null
          : file
            ? new Uint8Array(await file.arrayBuffer())
            : null;

      if (cancelled) return;

      if (!bytes) {
        setResults({});
        setError(null);
        return;
      }

      try {
        const entries = await Promise.all(
          HASH_ALGORITHMS.map(async (algo) => [algo, await hashBytes(algo, bytes)] as const),
        );
        if (!cancelled) {
          setResults(Object.fromEntries(entries));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setResults({});
          setError(err instanceof Error ? err.message : "Couldn't hash that input.");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [mode, text, file]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopy = async (algo: HashAlgorithm, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(algo);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Hash Generator</h1>
        <p className="mt-2 text-muted-foreground">
          Hash text or a file with MD5, SHA-1, SHA-256, and SHA-512 — entirely in your browser.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("text")}
              aria-pressed={mode === "text"}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                mode === "text"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setMode("file")}
              aria-pressed={mode === "file"}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                mode === "file"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              File
            </button>
          </div>

          {mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              spellCheck={false}
              placeholder="Type or paste text to hash"
              className="mt-4 w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
            />
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground"
              />
              {file && <span className="text-xs text-muted-foreground">{file.name}</span>}
            </div>
          )}
        </div>

        <div
          className={`mt-6 rounded-lg border p-5 ${
            error ? "border-accent-rose/50 bg-accent-rose/10" : "border-border bg-card/70"
          }`}
        >
          <h2 className="text-sm font-semibold text-card-foreground">Digests</h2>
          {error ? (
            <p className="mt-2 text-sm text-accent-rose">{error}</p>
          ) : Object.keys(results).length > 0 ? (
            <dl className="mt-3 flex flex-col gap-3 text-sm">
              {HASH_ALGORITHMS.map((algo) => (
                <div key={algo}>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-xs font-medium text-muted-foreground">{algo}</dt>
                    <button
                      type="button"
                      onClick={() => handleCopy(algo, results[algo] ?? "")}
                      className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {copied === algo ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <dd className="mt-1 break-all rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs text-secondary-foreground">
                    {results[algo]}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "text" ? "Type some text above to hash it." : "Choose a file above to hash it."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
