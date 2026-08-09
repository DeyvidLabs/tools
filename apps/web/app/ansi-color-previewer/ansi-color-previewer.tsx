"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EXAMPLE_INPUT, parseAnsi, stripAnsi, type AnsiStyle } from "./lib";

const TERMINAL_BG = "#1e1e1e";
const TERMINAL_FG = "#d4d4d4";

function segmentStyle(style: AnsiStyle): React.CSSProperties {
  const fg = style.inverse ? (style.bg ?? TERMINAL_BG) : (style.fg ?? TERMINAL_FG);
  const bg = style.inverse ? (style.fg ?? TERMINAL_FG) : (style.bg ?? "transparent");
  const decorations = [style.underline && "underline", style.strikethrough && "line-through"].filter(Boolean);

  return {
    color: fg,
    backgroundColor: bg,
    fontWeight: style.bold ? 700 : undefined,
    fontStyle: style.italic ? "italic" : undefined,
    textDecorationLine: decorations.length > 0 ? decorations.join(" ") : undefined,
    opacity: style.dim ? 0.65 : undefined,
  };
}

export function AnsiColorPreviewer() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const segments = useMemo(() => parseAnsi(input), [input]);

  const handleCopyStripped = async () => {
    await navigator.clipboard.writeText(stripAnsi(input));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Reading a file bypasses the terminal entirely — a terminal emulator
  // (SSH client, etc.) interprets and consumes ANSI codes to render colors,
  // so copy-pasting from a *live* terminal session never carries the raw
  // escape bytes. A log file (e.g. `docker compose logs > file.log`) still
  // has them, since the app baked the codes into stdout at write time.
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInput(await file.text());
    e.target.value = "";
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          ANSI / Terminal Color Previewer
        </h1>
        <p className="mt-2 text-muted-foreground">
          Paste raw text with ANSI escape codes (CI logs, <code>docker compose logs</code>) and see it
          rendered with real colors and styles — 16-color, 256-color, and truecolor all supported.
          Nothing is sent anywhere, it all runs in your browser.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="ansi-input" className="text-xs font-medium text-muted-foreground">
              Raw input
            </label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="ansi-file"
                className="cursor-pointer rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                Load from file
              </label>
              <input
                id="ansi-file"
                type="file"
                accept=".log,.txt,text/plain"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => setInput(EXAMPLE_INPUT)}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                Load example
              </button>
            </div>
          </div>
          <textarea
            id="ansi-input"
            rows={8}
            spellCheck={false}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
            placeholder="Paste output containing \x1b[...m escape codes here…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xs font-medium text-muted-foreground">Rendered preview</h2>
          <button
            type="button"
            onClick={handleCopyStripped}
            disabled={!input}
            className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
          >
            {copied ? "Copied!" : "Copy with ANSI stripped"}
          </button>
        </div>
        <pre
          className="mt-2 min-h-32 overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border p-4 font-mono text-sm"
          style={{ backgroundColor: TERMINAL_BG, color: TERMINAL_FG }}
        >
          {input ? (
            segments.map((segment, i) => (
              <span key={i} style={segmentStyle(segment.style)}>
                {segment.text}
              </span>
            ))
          ) : (
            <span className="opacity-50">Paste something above, or load the example…</span>
          )}
        </pre>
      </div>
    </div>
  );
}
