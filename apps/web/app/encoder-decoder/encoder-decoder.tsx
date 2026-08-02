"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ENCODING_MODE_LABELS, convert, type Direction, type EncodingMode } from "./lib";

const MODES: EncodingMode[] = ["base64", "url", "html-entity"];

export function EncoderDecoder() {
  const [mode, setMode] = useState<EncodingMode>("base64");
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const [fileDataUri, setFileDataUri] = useState<{ name: string; uri: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => convert(mode, direction, input), [mode, direction, input]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopy = async () => {
    if (!result.ok) return;
    await navigator.clipboard.writeText(result.data);
    setCopied(true);
  };

  const handleSwap = () => {
    if (result.ok) setInput(result.data);
    setDirection((d) => (d === "encode" ? "decode" : "encode"));
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFileDataUri({ name: file.name, uri: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Encoder/Decoder</h1>
        <p className="mt-2 text-muted-foreground">
          Encode or decode text as Base64, URL, or HTML entities — entirely in your browser.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
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
                {ENCODING_MODE_LABELS[m]}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDirection("encode")}
              aria-pressed={direction === "encode"}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                direction === "encode"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              Encode
            </button>
            <button
              type="button"
              onClick={() => setDirection("decode")}
              aria-pressed={direction === "decode"}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                direction === "decode"
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              Decode
            </button>
            <button
              type="button"
              onClick={handleSwap}
              className="ml-auto rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              ⇅ Swap
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="input" className="text-xs font-medium text-muted-foreground">
              Input
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={5}
              spellCheck={false}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground"
            />
          </div>

          {mode === "base64" && direction === "encode" && (
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Or convert a file to a data URI</label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  Choose file
                </button>
                {fileDataUri && <span className="text-xs text-muted-foreground">{fileDataUri.name}</span>}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
              {fileDataUri && (
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-xs text-secondary-foreground">
                  {fileDataUri.uri}
                </pre>
              )}
            </div>
          )}
        </div>

        <div
          className={`mt-6 rounded-lg border p-5 ${
            result.ok ? "border-border bg-card/70" : "border-accent-rose/50 bg-accent-rose/10"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-card-foreground">Output</h2>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!result.ok}
              className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          {result.ok ? (
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-secondary-foreground">
              {result.data}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-accent-rose">{result.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
