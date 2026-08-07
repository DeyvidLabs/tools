"use client";

import { useState } from "react";
import Link from "next/link";
import { NumberStepperInput } from "@/components/number-stepper-input";
import {
  MAX_DELAY_MS,
  MAX_STATUS_CODE,
  MIN_STATUS_CODE,
  createMockEndpoint,
  formatExpiry,
  headerRowsToRecord,
  parseResponseBody,
  type CreateMockEndpointResponse,
  type HeaderRow,
} from "./lib";

function CopyField({ label, value, warning }: { label: string; value: string; warning?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="mt-1 break-all rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground">
        {value}
      </p>
      {warning && <p className="mt-1 text-xs text-accent-rose">{warning}</p>}
    </div>
  );
}

export function MockEndpointTool() {
  const [statusCode, setStatusCode] = useState(200);
  const [delayMs, setDelayMs] = useState(0);
  const [responseBodyText, setResponseBodyText] = useState("");
  const [headerRows, setHeaderRows] = useState<HeaderRow[]>([{ key: "", value: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateMockEndpointResponse | null>(null);

  const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
    setHeaderRows((prev) => {
      const next = prev.map((h, i) => (i === index ? { ...h, [field]: value } : h));
      const last = next[next.length - 1];
      if (last && (last.key !== "" || last.value !== "")) next.push({ key: "", value: "" });
      return next;
    });
  };

  const removeHeaderRow = (index: number) => {
    setHeaderRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let responseBody: unknown;
    try {
      responseBody = parseResponseBody(responseBodyText);
    } catch {
      setError("Response body must be valid JSON, or left empty.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createMockEndpoint({
        statusCode,
        delayMs,
        responseBody,
        responseHeaders: headerRowsToRecord(headerRows),
      });
      setResult(created);
    } catch {
      setError("Couldn't create the mock endpoint — check your response headers and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setStatusCode(200);
    setDelayMs(0);
    setResponseBodyText("");
    setHeaderRows([{ key: "", value: "" }]);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const hitUrl = result ? `${origin}/api/mock/hit/${result.id}` : "";
  const detailsUrl = result ? `/mock-endpoint/${result.id}` : "";

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          API Mock / Sandbox Endpoint
        </h1>
        <p className="mt-2 text-muted-foreground">
          Get a URL that responds with whatever status code, body, headers, and delay you configure —
          for testing how a client handles errors and timeouts without a real backend.
        </p>

        {result ? (
          <div className="mt-8 flex flex-col gap-4">
            <CopyField label="Hit URL — point your client at this" value={hitUrl} />
            <CopyField
              label="Delete token"
              value={result.deleteToken}
              warning="Save this now — it won't be shown again, and it's the only way to delete this endpoint early."
            />
            <p className="text-xs text-muted-foreground">
              Responds {result.statusCode}
              {result.delayMs > 0 ? ` after a ${result.delayMs}ms delay` : ""} · {formatExpiry(result.expiresAt)}
            </p>
            <div className="flex items-center gap-3">
              <Link
                href={detailsUrl}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                View details →
              </Link>
              <button
                type="button"
                onClick={reset}
                className="self-start rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                Create another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="status-code" className="text-xs font-medium text-muted-foreground">
                  Status code
                </label>
                <NumberStepperInput
                  value={statusCode}
                  onChange={setStatusCode}
                  min={MIN_STATUS_CODE}
                  max={MAX_STATUS_CODE}
                  className="w-24"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="delay-ms" className="text-xs font-medium text-muted-foreground">
                  Delay (ms)
                </label>
                <NumberStepperInput value={delayMs} onChange={setDelayMs} min={0} max={MAX_DELAY_MS} className="w-28" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="response-body" className="text-xs font-medium text-muted-foreground">
                Response body (JSON, optional)
              </label>
              <textarea
                id="response-body"
                rows={5}
                spellCheck={false}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
                placeholder='{"error":"Service unavailable"}'
                value={responseBodyText}
                onChange={(e) => setResponseBodyText(e.target.value)}
              />
            </div>

            <div>
              <h2 className="text-xs font-medium text-muted-foreground">Response headers</h2>
              <div className="mt-2 flex flex-col gap-2">
                {headerRows.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={h.key}
                      onChange={(e) => handleHeaderChange(i, "key", e.target.value)}
                      placeholder="Header"
                      className="w-1/3 rounded-md border border-border bg-secondary px-2 py-1.5 font-mono text-xs text-secondary-foreground placeholder:text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={(e) => handleHeaderChange(i, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1 rounded-md border border-border bg-secondary px-2 py-1.5 font-mono text-xs text-secondary-foreground placeholder:text-muted-foreground"
                    />
                    {i < headerRows.length - 1 && (
                      <button
                        type="button"
                        onClick={() => removeHeaderRow(i)}
                        aria-label="Remove header"
                        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-accent-rose/50 hover:text-accent-rose"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-accent-rose">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="self-start rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:pointer-events-none disabled:opacity-40"
            >
              {submitting ? "Creating…" : "Create mock endpoint"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
