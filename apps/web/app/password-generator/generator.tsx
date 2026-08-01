"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ALL_SYMBOLS,
  DEFAULT_OPTIONS,
  calculateEntropyBits,
  generatePassword,
  getStrength,
  hasAnyCharacters,
  type CharsetKey,
  type GeneratorOptions,
} from "./lib";

const CHARSET_TOGGLES: { key: CharsetKey; label: string; sample: string }[] = [
  { key: "uppercase", label: "Uppercase", sample: "ABC" },
  { key: "lowercase", label: "Lowercase", sample: "abc" },
  { key: "numbers", label: "Numbers", sample: "123" },
];

export function PasswordGenerator() {
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);
  // Bumped by the regenerate button to force a fresh draw from generatePassword
  // even when `options` itself hasn't changed.
  const [regenKey, setRegenKey] = useState(0);
  const [copied, setCopied] = useState(false);

  // Applies an options update unless it would leave zero characters to draw
  // from — the single guard every toggle/chip below relies on.
  const updateOptions = (updater: (prev: GeneratorOptions) => GeneratorOptions) => {
    setOptions((prev) => {
      const next = updater(prev);
      if (hasAnyCharacters(prev) && !hasAnyCharacters(next)) return prev;
      return next;
    });
  };

  // Derived from options + regenKey — computed during render rather than in
  // an effect, since it's a pure function of state with no external system
  // to synchronize with (see https://react.dev/learn/you-might-not-need-an-effect).
  const password = useMemo(
    () => generatePassword(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenKey deliberately forces a re-draw
    [options, regenKey],
  );

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const entropyBits = useMemo(() => calculateEntropyBits(options), [options]);
  const strength = useMemo(() => getStrength(entropyBits), [entropyBits]);

  const symbolsOn = options.symbolsEnabled;

  const toggleCharset = (key: CharsetKey) => {
    updateOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSymbolsMaster = () => {
    // Only flips whether symbols count toward generation — never touches
    // symbolChars, so re-enabling restores whatever subset was picked before
    // instead of resetting to "all symbols".
    updateOptions((prev) => ({ ...prev, symbolsEnabled: !prev.symbolsEnabled }));
  };

  const toggleSymbolChar = (char: string) => {
    updateOptions((prev) => {
      const symbolChars = prev.symbolChars.includes(char)
        ? prev.symbolChars.replace(char, "")
        : [...ALL_SYMBOLS].filter((c) => prev.symbolChars.includes(c) || c === char).join("");
      return { ...prev, symbolChars };
    });
  };

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          Password Generator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Generated locally with the Web Crypto API — nothing is ever sent to a server.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <output
              aria-label="Generated password"
              className="min-h-40 min-w-0 flex-1 break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-lg text-secondary-foreground"
            >
              {password || "Select at least one character set"}
            </output>
            <button
              type="button"
              onClick={() => setRegenKey((k) => k + 1)}
              title="Regenerate"
              aria-label="Regenerate password"
              className="shrink-0 rounded-md border border-border p-3 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <RefreshIcon />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!password}
              title="Copy to clipboard"
              aria-label="Copy password to clipboard"
              className="shrink-0 rounded-md border border-border p-3 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex flex-1 gap-1" role="img" aria-label={`Strength: ${strength.label}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      i < strength.segments ? strength.colorVar : "var(--border)",
                  }}
                />
              ))}
            </div>
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: strength.colorVar }}
            >
              {strength.label}
              {entropyBits > 0 ? ` · ${Math.round(entropyBits)} bits` : ""}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <label htmlFor="length" className="text-sm font-medium text-card-foreground">
              Length
            </label>
            <span className="font-mono text-sm text-muted-foreground">
              {options.length}
            </span>
          </div>
          <input
            id="length"
            type="range"
            min={4}
            max={128}
            value={options.length}
            onChange={(e) =>
              updateOptions((prev) => ({ ...prev, length: Number(e.target.value) }))
            }
            style={{ accentColor: "var(--primary)" }}
            className="mt-2 w-full cursor-pointer"
          />

          <div className="mt-5 grid grid-cols-2 gap-3">
            {CHARSET_TOGGLES.map(({ key, label, sample }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2.5 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={() => toggleCharset(key)}
                  style={{ accentColor: "var(--primary)" }}
                />
                <span className="text-sm text-card-foreground">{label}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {sample}
                </span>
              </label>
            ))}

            <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2.5 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
              <input
                type="checkbox"
                checked={symbolsOn}
                onChange={toggleSymbolsMaster}
                style={{ accentColor: "var(--primary)" }}
              />
              <span className="text-sm text-card-foreground">Symbols</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                !@#
              </span>
            </label>
          </div>

          <div
            className={`mt-3 rounded-md border border-border p-3 transition-opacity ${
              symbolsOn ? "" : "pointer-events-none opacity-40"
            }`}
          >
              <p className="text-xs text-muted-foreground">
                Some sites only accept a few symbols — pick exactly which ones are allowed.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...ALL_SYMBOLS].map((char) => {
                  const selected = options.symbolChars.includes(char);
                  const isLastChar = selected && options.symbolChars.length === 1;
                  const onlyActiveCategory =
                    isLastChar && !options.uppercase && !options.lowercase && !options.numbers;
                  return (
                    <button
                      key={char}
                      type="button"
                      onClick={() => toggleSymbolChar(char)}
                      disabled={!symbolsOn || onlyActiveCategory}
                      aria-pressed={selected}
                      title={selected ? `Remove ${char}` : `Allow ${char}`}
                      className={`h-8 w-8 rounded-md border font-mono text-sm transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                        selected
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setOptions((prev) => ({ ...prev, symbolChars: ALL_SYMBOLS }))}
                  disabled={!symbolsOn}
                  className="text-muted-foreground underline-offset-2 hover:text-primary hover:underline disabled:pointer-events-none"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => updateOptions((prev) => ({ ...prev, symbolChars: "" }))}
                  disabled={!symbolsOn}
                  className="text-muted-foreground underline-offset-2 hover:text-primary hover:underline disabled:pointer-events-none"
                >
                  Clear
                </button>
              </div>
          </div>

          <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2.5 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/5">
            <input
              type="checkbox"
              checked={options.excludeAmbiguous}
              onChange={() =>
                setOptions((prev) => ({
                  ...prev,
                  excludeAmbiguous: !prev.excludeAmbiguous,
                }))
              }
              style={{ accentColor: "var(--primary)" }}
            />
            <span className="text-sm text-card-foreground">
              Exclude ambiguous characters
            </span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              I l 1 O 0
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
