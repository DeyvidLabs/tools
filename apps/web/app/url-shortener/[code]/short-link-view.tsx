"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchShortLink, formatExpiry, type ShortLink } from "../lib";

export function ShortLinkView({ code }: { code: string }) {
  const [link, setLink] = useState<ShortLink | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchShortLink(code).then((result) => {
      if (!cancelled) setLink(result);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shortUrl = `${origin}/s/${code}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/url-shortener" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← New short link
        </Link>

        {link === undefined && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}

        {link === null && (
          <div className="mt-8 rounded-lg border border-dashed border-border p-8 text-center">
            <h1 className="text-lg font-semibold text-foreground">Short link not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              It may have expired, been deleted, or never existed.
            </p>
          </div>
        )}

        {link && (
          <div className="mt-6 flex flex-col gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Short link</h1>

            <div className="rounded-lg border border-border bg-card/70 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Short link</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="mt-1 break-all font-mono text-sm text-card-foreground">{shortUrl}</p>

              <p className="mt-4 text-xs font-medium text-muted-foreground">Target URL</p>
              <p className="mt-1 break-all font-mono text-sm text-card-foreground">{link.targetUrl}</p>

              <p className="mt-4 text-xs text-muted-foreground">{formatExpiry(link.expiresAt)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
