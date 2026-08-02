"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { REGEX_PRESETS, buildRegex, explainRegex, findMatches, highlightText } from "./lib";

const FLAGS = ["i", "m", "s", "u", "y"] as const;
const FLAG_LABELS: Record<(typeof FLAGS)[number], string> = {
  i: "i — case insensitive",
  m: "m — multiline (^/$ match per line)",
  s: "s — dotAll (. also matches newline)",
  u: "u — unicode",
  y: "y — sticky",
};

export function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");

  const toggleFlag = (flag: string) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  };

  const applyPreset = (preset: (typeof REGEX_PRESETS)[number]) => {
    setPattern(preset.pattern);
    setFlags(new Set(preset.flags.split("")));
    setText(preset.sampleText);
  };

  const flagsString = useMemo(() => FLAGS.filter((f) => flags.has(f)).join(""), [flags]);
  const built = useMemo(() => buildRegex(pattern, flagsString), [pattern, flagsString]);
  const matches = useMemo(
    () => (built.ok && pattern ? findMatches(built.regex, text) : []),
    [built, pattern, text],
  );
  const segments = useMemo(() => highlightText(text, matches), [text, matches]);
  const tokens = useMemo(() => (pattern ? explainRegex(pattern) : []), [pattern]);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Regex Tester</h1>
        <p className="mt-2 text-muted-foreground">
          Test a regular expression against sample text — entirely in your browser.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {REGEX_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <label htmlFor="pattern" className="text-xs font-medium text-muted-foreground">
            Pattern
          </label>
          <div className="mt-2 flex items-center gap-2 font-mono text-sm">
            <span className="text-muted-foreground">/</span>
            <input
              id="pattern"
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              spellCheck={false}
              placeholder="\d+"
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-secondary-foreground placeholder:text-muted-foreground"
            />
            <span className="text-muted-foreground">/{flagsString}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {FLAGS.map((flag) => (
              <button
                key={flag}
                type="button"
                onClick={() => toggleFlag(flag)}
                aria-pressed={flags.has(flag)}
                title={FLAG_LABELS[flag]}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  flags.has(flag)
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                {flag}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="test-text" className="text-xs font-medium text-muted-foreground">
              Test text
            </label>
            <textarea
              id="test-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              spellCheck={false}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground"
            />
          </div>
        </div>

        <div
          className={`mt-6 rounded-lg border p-5 ${
            built.ok ? "border-border bg-card/70" : "border-accent-rose/50 bg-accent-rose/10"
          }`}
        >
          {!built.ok ? (
            <p className="text-sm text-accent-rose">{built.error}</p>
          ) : !pattern ? (
            <p className="text-sm text-muted-foreground">Enter a pattern above to test it.</p>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-card-foreground">
                {matches.length} match{matches.length === 1 ? "" : "es"}
              </h2>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-secondary-foreground">
                {text ? (
                  segments.map((seg, i) =>
                    seg.matchIndex !== null ? (
                      <mark key={i} className="rounded-sm bg-primary/25 text-primary">
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    ),
                  )
                ) : (
                  <span className="text-muted-foreground">Paste some test text above.</span>
                )}
              </pre>

              {matches.length > 0 && (
                <ol className="mt-3 flex flex-col gap-2 text-sm">
                  {matches.map((m, i) => (
                    <li key={i} className="rounded-md border border-border bg-secondary px-3 py-2">
                      <div className="font-mono text-card-foreground">
                        Match {i + 1}: <span className="text-primary">{JSON.stringify(m.match)}</span>{" "}
                        <span className="text-xs text-muted-foreground">at index {m.index}</span>
                      </div>
                      {m.groups.length > 0 && (
                        <ul className="mt-1 flex flex-col gap-0.5 pl-4 font-mono text-xs text-muted-foreground">
                          {m.groups.map((g, gi) => (
                            <li key={gi}>
                              Group {g.name}: {g.value === undefined ? "(no match)" : JSON.stringify(g.value)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>

        {pattern && built.ok && tokens.length > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-card/70 p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Token-by-token explanation</h2>
            <ol className="mt-3 flex flex-col gap-1.5 text-sm">
              {tokens.map((t, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <code className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-xs text-secondary-foreground">
                    {t.token}
                  </code>
                  <span className="text-card-foreground">{t.description}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
