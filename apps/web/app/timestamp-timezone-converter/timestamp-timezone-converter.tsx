"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  TIMESTAMP_UNIT_LABELS,
  convertBatch,
  formatTimestamp,
  getAvailableTimeZones,
  parseTimestamp,
  type TimestampUnit,
} from "./lib";

const UNITS: TimestampUnit[] = ["auto", "unix-s", "unix-ms", "iso8601"];

function detectLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function TimestampTimezoneConverter() {
  const timeZones = useMemo(() => getAvailableTimeZones(), []);
  const [timeZone, setTimeZone] = useState(detectLocalTimeZone);
  const [unit, setUnit] = useState<TimestampUnit>("auto");
  const [value, setValue] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [batchInput, setBatchInput] = useState("");

  const parsed = useMemo(() => parseTimestamp(value, unit), [value, unit]);
  const result = useMemo(() => (parsed ? formatTimestamp(parsed, timeZone) : null), [parsed, timeZone]);
  const batchResults = useMemo(
    () => (batchInput.trim() ? convertBatch(batchInput, timeZone, unit) : []),
    [batchInput, timeZone, unit],
  );

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          Timestamp / Timezone Converter
        </h1>
        <p className="mt-2 text-muted-foreground">
          Convert between Unix timestamps, ISO 8601, and human-readable dates in any timezone — entirely in
          your browser.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  unit === u
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                {TIMESTAMP_UNIT_LABELS[u]}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <label htmlFor="value" className="text-xs font-medium text-muted-foreground">
                Timestamp
              </label>
              <input
                id="value"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                spellCheck={false}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground"
              />
            </div>

            <button
              type="button"
              onClick={() => setValue(String(Math.floor(Date.now() / 1000)))}
              className="rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Now
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label htmlFor="timezone" className="text-xs font-medium text-muted-foreground">
              Timezone
            </label>
            <select
              id="timezone"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
            >
              {timeZones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className={`mt-6 rounded-lg border p-5 ${
            result ? "border-border bg-card/70" : "border-accent-rose/50 bg-accent-rose/10"
          }`}
        >
          {result ? (
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Unix seconds</dt>
                <dd className="font-mono text-card-foreground">{result.unixSeconds}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Unix milliseconds</dt>
                <dd className="font-mono text-card-foreground">{result.unixMs}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">ISO 8601</dt>
                <dd className="font-mono text-card-foreground">{result.iso}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{timeZone}</dt>
                <dd className="text-right text-card-foreground">{result.human}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-accent-rose">Couldn&apos;t parse that value as a timestamp.</p>
          )}
        </div>

        <div className="mt-10 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-card-foreground">Batch mode</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste one timestamp per line — handy for a column pulled out of Docker or nginx logs.
          </p>
          <textarea
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            rows={5}
            spellCheck={false}
            placeholder={"1700000000\n1700000125\n1700000260"}
            className="mt-3 w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
          />

          {batchResults.length > 0 && (
            <ol className="mt-4 flex flex-col gap-1.5 text-sm">
              {batchResults.map((entry, i) => (
                <li key={`${entry.input}-${i}`} className="flex items-baseline gap-3 font-mono">
                  <span className="text-muted-foreground">{entry.input}</span>
                  <span className="text-muted-foreground">→</span>
                  {entry.result ? (
                    <span className="text-card-foreground">{entry.result.human}</span>
                  ) : (
                    <span className="text-accent-rose">unparseable</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
