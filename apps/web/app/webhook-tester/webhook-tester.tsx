"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LOCAL_STORAGE_BIN_KEY,
  POLL_INTERVAL_MS,
  buildCaptureUrl,
  createBin,
  displayBody,
  fetchBin,
  fetchRequests,
  formatRelativeTime,
  sameRequestIds,
  type CapturedRequest,
  type WebhookBin,
} from "./lib";

const METHOD_COLORS: Record<string, string> = {
  GET: "var(--primary)",
  POST: "var(--accent-amber)",
  PUT: "var(--accent-orange)",
  PATCH: "var(--accent-purple)",
  DELETE: "var(--accent-rose)",
};

export function WebhookTester() {
  const [bin, setBin] = useState<WebhookBin | null>(null);
  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Guards the poll interval against acting on a stale bin after "New bin"
  // swaps `bin` out from under an in-flight fetch.
  const binIdRef = useRef<string | null>(null);

  // Stable across renders so RequestRow's memo() actually skips unaffected
  // rows instead of every row re-rendering because its onToggle prop is a
  // fresh closure each time.
  const handleToggle = useCallback((id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  }, []);

  const startNewBin = useCallback(async () => {
    setLoading(true);
    const created = await createBin();
    localStorage.setItem(LOCAL_STORAGE_BIN_KEY, created.id);
    binIdRef.current = created.id;
    setBin(created);
    setRequests([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const existingId = localStorage.getItem(LOCAL_STORAGE_BIN_KEY);
    (async () => {
      if (existingId) {
        const existing = await fetchBin(existingId);
        if (existing) {
          binIdRef.current = existing.id;
          setBin(existing);
          setLoading(false);
          return;
        }
      }
      await startNewBin();
    })();
    // Only ever runs once on mount — startNewBin is stable (empty deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bin) return;
    const poll = async () => {
      const list = await fetchRequests(bin.id);
      if (binIdRef.current !== bin.id) return;
      // Skip the state update (and the re-render it'd trigger for every row)
      // when this tick brought back the exact same requests as last time.
      setRequests((prev) => (sameRequestIds(prev, list) ? prev : list));
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [bin]);

  const captureUrl = bin
    ? buildCaptureUrl(typeof window !== "undefined" ? window.location.origin : "", bin.id)
    : "";

  const handleCopy = async () => {
    if (!captureUrl) return;
    await navigator.clipboard.writeText(captureUrl);
    setCopied(true);
  };

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-24">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          Webhook Tester
        </h1>
        <p className="mt-2 text-muted-foreground">
          Send any HTTP request to your unique URL below and watch it show up here.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <output
              aria-label="Capture URL"
              className="min-w-0 flex-1 break-all rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-secondary-foreground"
            >
              {loading ? "Creating bin…" : captureUrl}
            </output>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!captureUrl}
              title="Copy capture URL"
              aria-label="Copy capture URL"
              className="shrink-0 rounded-md border border-border p-3 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {bin ? `Expires ${new Date(bin.expiresAt).toLocaleString()}` : ""}
            </span>
            <button
              type="button"
              onClick={() => void startNewBin()}
              className="underline-offset-2 hover:text-primary hover:underline"
            >
              New bin
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {requests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Waiting for requests — send anything to the URL above.
            </div>
          ) : (
            requests.map((req) => (
              <RequestRow
                key={req.id}
                request={req}
                expanded={expandedId === req.id}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const RequestRow = memo(function RequestRow({
  request,
  expanded,
  onToggle,
}: {
  request: CapturedRequest;
  expanded: boolean;
  onToggle: (id: string) => void;
}) {
  const { text: bodyText } = displayBody(request);
  const methodColor = METHOD_COLORS[request.method] ?? "var(--muted-foreground)";

  return (
    // No backdrop-blur here (unlike the static card above): this renders
    // once per captured request, and backdrop-filter is one of the most
    // expensive CSS properties to keep recomputing on every scroll frame —
    // fine for one or two static cards, not for a scrolling list of them.
    <div className="rounded-lg border border-border bg-card/70">
      <button
        type="button"
        onClick={() => onToggle(request.id)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className="w-16 shrink-0 text-center font-mono text-xs font-semibold tabular-nums"
          style={{ color: methodColor }}
        >
          {request.method}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
          {request.contentType ?? "no content-type"}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeTime(request.receivedAt)}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border px-4 py-3 text-sm">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Source IP</p>
            <p className="font-mono text-xs text-card-foreground">
              {request.sourceIp ?? "unknown"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Query</p>
            <pre className="overflow-x-auto rounded-md bg-secondary p-2 font-mono text-xs text-secondary-foreground">
              {Object.keys(request.query).length > 0
                ? JSON.stringify(request.query, null, 2)
                : "(none)"}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Headers</p>
            <pre className="overflow-x-auto rounded-md bg-secondary p-2 font-mono text-xs text-secondary-foreground">
              {JSON.stringify(request.headers, null, 2)}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Body</p>
            <pre className="overflow-x-auto rounded-md bg-secondary p-2 font-mono text-xs text-secondary-foreground">
              {bodyText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
});

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
