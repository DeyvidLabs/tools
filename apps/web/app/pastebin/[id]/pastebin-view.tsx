"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPaste, formatExpiry, type Paste } from "../lib";

export function PastebinView({ id }: { id: string }) {
  const [paste, setPaste] = useState<Paste | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPaste(id).then((result) => {
      if (!cancelled) setPaste(result);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCopy = async () => {
    if (!paste) return;
    await navigator.clipboard.writeText(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/pastebin" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← New paste
        </Link>

        {paste === undefined && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}

        {paste === null && (
          <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
            <h1 className="text-lg font-semibold text-foreground">Paste not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              It may have expired, been deleted, or never existed.
            </p>
          </div>
        )}

        {paste && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {paste.title || "Untitled paste"}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {paste.language && (
                  <span className="rounded-md border border-border px-2 py-0.5 font-mono">{paste.language}</span>
                )}
                <span>{formatExpiry(paste.expiresAt)}</span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card/70 p-5">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm text-card-foreground">
                {paste.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
