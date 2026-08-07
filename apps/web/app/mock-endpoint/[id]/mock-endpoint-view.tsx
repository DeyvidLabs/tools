"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMockEndpoint, formatExpiry, type MockEndpoint } from "../lib";

export function MockEndpointView({ id }: { id: string }) {
  const [endpoint, setEndpoint] = useState<MockEndpoint | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMockEndpoint(id).then((result) => {
      if (!cancelled) setEndpoint(result);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const hitUrl = `${origin}/api/mock/hit/${id}`;
  const headerEntries = endpoint ? Object.entries(endpoint.responseHeaders) : [];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/mock-endpoint" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← New mock endpoint
        </Link>

        {endpoint === undefined && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}

        {endpoint === null && (
          <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
            <h1 className="text-lg font-semibold text-foreground">Mock endpoint not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">It may have expired or never existed.</p>
          </div>
        )}

        {endpoint && (
          <div className="mt-6 flex flex-col gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mock endpoint</h1>

            <div className="rounded-lg border border-border bg-card/70 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Hit URL</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="mt-1 break-all font-mono text-sm text-card-foreground">{hitUrl}</p>

              <p className="mt-4 text-xs font-medium text-muted-foreground">Responds</p>
              <p className="mt-1 font-mono text-sm text-card-foreground">
                {endpoint.statusCode}
                {endpoint.delayMs > 0 ? ` after ${endpoint.delayMs}ms` : ""}
              </p>

              {headerEntries.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-medium text-muted-foreground">Headers</p>
                  <dl className="mt-1 flex flex-col gap-0.5 font-mono text-sm text-card-foreground">
                    {headerEntries.map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <dt className="text-muted-foreground">{key}:</dt>
                        <dd className="break-all">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}

              {endpoint.responseBody !== null && (
                <>
                  <p className="mt-4 text-xs font-medium text-muted-foreground">Body</p>
                  <pre className="mt-1 overflow-x-auto rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs text-secondary-foreground">
                    {JSON.stringify(endpoint.responseBody, null, 2)}
                  </pre>
                </>
              )}

              <p className="mt-4 text-xs text-muted-foreground">{formatExpiry(endpoint.expiresAt)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
