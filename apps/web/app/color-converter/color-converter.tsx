"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  analogous,
  complementary,
  formatHex,
  formatHsl,
  formatOklch,
  formatRgb,
  generateShades,
  generateTints,
  parseColor,
  triadic,
  type RGB,
} from "./lib";

const DEFAULT_COLOR = "#228be6";

function Swatch({ rgb, label }: { rgb: RGB; label: string }) {
  const [copied, setCopied] = useState(false);
  const hex = formatHex(rgb);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={label}
      className="group flex flex-col items-center gap-1.5"
    >
      <span
        className="h-12 w-12 rounded-md border border-border shadow-sm transition-transform group-hover:scale-105"
        style={{ backgroundColor: hex }}
      />
      <span className="text-[11px] text-muted-foreground group-hover:text-primary">
        {copied ? "Copied!" : hex}
      </span>
    </button>
  );
}

function PaletteRow({ title, colors }: { title: string; colors: RGB[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-3">
        {colors.map((c, i) => (
          <Swatch key={i} rgb={c} label={title} />
        ))}
      </div>
    </div>
  );
}

export function ColorConverter() {
  const [input, setInput] = useState(DEFAULT_COLOR);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const rgb = useMemo(() => parseColor(input), [input]);

  const handleCopy = async (field: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1200);
  };

  const formats = rgb
    ? [
        { label: "HEX", value: formatHex(rgb) },
        { label: "RGB", value: formatRgb(rgb) },
        { label: "HSL", value: formatHsl(rgb) },
        { label: "OKLCH", value: formatOklch(rgb) },
      ]
    : [];

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          Color Converter
        </h1>
        <p className="mt-2 text-muted-foreground">
          Convert between HEX, RGB, HSL, and OKLCH, and generate derived palettes — entirely in
          your browser.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={rgb ? formatHex(rgb) : DEFAULT_COLOR}
              onChange={(e) => setInput(e.target.value)}
              className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0"
              aria-label="Pick a color"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder="#228be6, rgb(34, 139, 230), hsl(207, 74%, 52%), oklch(...)"
              className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
            />
          </div>
          {!rgb && input.trim() !== "" && (
            <p className="mt-2 text-sm text-accent-rose">
              Couldn&apos;t parse that as a color. Try HEX, RGB, HSL, or OKLCH notation.
            </p>
          )}
        </div>

        {rgb && (
          <>
            <div className="mt-6 rounded-lg border border-border bg-card/70 p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Formats</h2>
              <dl className="mt-3 flex flex-col gap-3 text-sm">
                {formats.map((f) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                      <button
                        type="button"
                        onClick={() => handleCopy(f.label, f.value)}
                        className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        {copiedField === f.label ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <dd className="mt-1 break-all rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs text-secondary-foreground">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6 flex flex-col gap-5 rounded-lg border border-border bg-card/70 p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Palette</h2>
              <PaletteRow title="Shades" colors={generateShades(rgb, 5)} />
              <PaletteRow title="Tints" colors={generateTints(rgb, 5)} />
              <PaletteRow title="Complementary" colors={[complementary(rgb)]} />
              <PaletteRow title="Analogous" colors={analogous(rgb)} />
              <PaletteRow title="Triadic" colors={triadic(rgb)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
