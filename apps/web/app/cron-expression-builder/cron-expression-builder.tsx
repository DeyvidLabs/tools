"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { describeCron, formatRunTime, nextRunTimes, parseCron } from "./lib";

const PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every weekday at 9am", value: "0 9 * * MON-FRI" },
  { label: "Every Monday at 9am", value: "0 9 * * MON" },
  { label: "First of every month", value: "0 0 1 * *" },
];

const FIELD_HINTS = [
  { name: "Minute", range: "0-59" },
  { name: "Hour", range: "0-23" },
  { name: "Day of month", range: "1-31" },
  { name: "Month", range: "1-12 or JAN-DEC" },
  { name: "Day of week", range: "0-7 or SUN-SAT" },
];

export function CronExpressionBuilder() {
  const [expression, setExpression] = useState("*/15 * * * *");

  const parsed = useMemo(() => parseCron(expression), [expression]);
  const description = useMemo(() => describeCron(expression), [expression]);
  const runs = useMemo(() => {
    if (!parsed.ok) return [];
    return nextRunTimes(parsed.data, new Date(), 5);
  }, [parsed]);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Cron Expression Builder</h1>
        <p className="mt-2 text-muted-foreground">
          Enter a standard 5-field cron expression to see it described in plain English and preview its next run
          times. Everything runs in your browser.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <label htmlFor="cron-input" className="text-xs font-medium text-muted-foreground">
            Expression
          </label>
          <input
            id="cron-input"
            type="text"
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
            placeholder="*/15 * * * *"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {FIELD_HINTS.map((f) => (
              <span key={f.name}>
                <span className="text-card-foreground">{f.name}</span> {f.range}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setExpression(preset.value)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div
            className={`rounded-lg border p-5 ${
              parsed.ok
                ? "border-border bg-card/70"
                : "border-accent-rose/50 bg-accent-rose/10"
            }`}
          >
            <h2 className="text-sm font-semibold text-card-foreground">Description</h2>
            <p className={`mt-2 text-sm ${parsed.ok ? "text-card-foreground" : "text-accent-rose"}`}>
              {description}
            </p>
          </div>

          {parsed.ok && (
            <div className="rounded-lg border border-border bg-card/70 p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Next run times</h2>
              {runs.length > 0 ? (
                <ol className="mt-3 flex flex-col gap-1.5 text-sm">
                  {runs.map((run, i) => (
                    <li key={run.getTime()} className="flex items-baseline gap-3">
                      <span className="text-xs text-muted-foreground">{i + 1}.</span>
                      <span className="text-card-foreground">{formatRunTime(run)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No upcoming run found in the next year — this expression may never match a real date.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
