"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { diffEnv, lintEnv } from "./lib";

const PLACEHOLDER = `PORT=3000\nDATABASE_URL="postgres://localhost/app"\nDEBUG=`;

export function DotenvLinter() {
  const [text, setText] = useState("");
  const [diffMode, setDiffMode] = useState(false);
  const [sampleText, setSampleText] = useState("");

  const issues = useMemo(() => lintEnv(text), [text]);
  const diff = useMemo(
    () => (diffMode ? diffEnv(text, sampleText) : null),
    [diffMode, text, sampleText],
  );

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">.env Linter</h1>
        <p className="mt-2 text-muted-foreground">
          Paste a .env file to catch duplicate keys, empty values, mixed quoting, and invalid characters —
          entirely in your browser.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <label htmlFor="env-input" className="text-xs font-medium text-muted-foreground">
            .env
          </label>
          <textarea
            id="env-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            spellCheck={false}
            placeholder={PLACEHOLDER}
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card/70 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-card-foreground">Lint results</h2>
            <span className="text-xs text-muted-foreground">
              {errorCount} error{errorCount === 1 ? "" : "s"}, {warningCount} warning
              {warningCount === 1 ? "" : "s"}
            </span>
          </div>

          {issues.length > 0 ? (
            <ol className="mt-3 flex flex-col gap-1.5 text-sm">
              {issues.map((issue, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <span className="text-xs text-muted-foreground">L{issue.line}</span>
                  <span
                    className={issue.severity === "error" ? "text-accent-rose" : "text-card-foreground"}
                  >
                    {issue.message}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {text.trim() ? "No issues found." : "Paste a .env above to lint it."}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDiffMode((d) => !d)}
            aria-pressed={diffMode}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              diffMode
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
            }`}
          >
            Diff against .env.sample
          </button>
        </div>

        {diffMode && (
          <>
            <div className="mt-4 flex flex-col gap-2">
              <label htmlFor="sample-input" className="text-xs font-medium text-muted-foreground">
                .env.sample
              </label>
              <textarea
                id="sample-input"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                rows={6}
                spellCheck={false}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground"
              />
            </div>

            <div className="mt-4 rounded-lg border border-border bg-card/70 p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Key diff</h2>
              <div className="mt-3 flex flex-col gap-3 text-sm">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Missing (in sample, not in .env)
                  </h3>
                  {diff && diff.missingKeys.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-2 font-mono text-accent-rose">
                      {diff.missingKeys.map((k) => (
                        <li key={k}>{k}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-muted-foreground">None.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Extra (in .env, not in sample)
                  </h3>
                  {diff && diff.extraKeys.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-2 font-mono text-card-foreground">
                      {diff.extraKeys.map((k) => (
                        <li key={k}>{k}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-muted-foreground">None.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
