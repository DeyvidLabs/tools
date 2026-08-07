"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EXPIRATION_OPTIONS,
  createShortLink,
  type CreateShortLinkResponse,
  type ShortLinkExpiration,
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

export function UrlShortener() {
  const [targetUrl, setTargetUrl] = useState("");
  const [expiresIn, setExpiresIn] = useState<ShortLinkExpiration>("1d");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateShortLinkResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createShortLink({ targetUrl: targetUrl.trim(), expiresIn });
      setResult(created);
    } catch {
      setError("Couldn't shorten that URL — check it's a valid http(s) link and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTargetUrl("");
    setError(null);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shortUrl = result ? `${origin}/s/${result.code}` : "";
  const detailsUrl = result ? `/url-shortener/${result.code}` : "";

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">URL Shortener</h1>
        <p className="mt-2 text-muted-foreground">
          Turn a long URL into a short link. Links expire automatically — save the delete token if you want
          to remove one early.
        </p>

        {result ? (
          <div className="mt-8 flex flex-col gap-4">
            <CopyField label="Short link" value={shortUrl} />
            <CopyField
              label="Delete token"
              value={result.deleteToken}
              warning="Save this now — it won't be shown again, and it's the only way to delete this link early."
            />
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
                Shorten another URL
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="target-url" className="text-xs font-medium text-muted-foreground">
                URL to shorten
              </label>
              <input
                id="target-url"
                type="url"
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
                placeholder="https://example.com/some/very/long/path"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                maxLength={2048}
                required
              />
            </div>

            <div className="flex flex-col gap-2 sm:w-48">
              <label htmlFor="link-expiry" className="text-xs font-medium text-muted-foreground">
                Expires after
              </label>
              <select
                id="link-expiry"
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value as ShortLinkExpiration)}
              >
                {EXPIRATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-accent-rose">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !targetUrl.trim()}
              className="self-start rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:pointer-events-none disabled:opacity-40"
            >
              {submitting ? "Shortening…" : "Shorten URL"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
