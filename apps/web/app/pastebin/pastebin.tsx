"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EXPIRATION_OPTIONS,
  createPaste,
  type CreatePasteResponse,
  type PasteExpiration,
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

export function Pastebin() {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("");
  const [content, setContent] = useState("");
  const [expiresIn, setExpiresIn] = useState<PasteExpiration>("1d");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatePasteResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createPaste({
        content,
        title: title.trim() || undefined,
        language: language.trim() || undefined,
        expiresIn,
      });
      setResult(created);
    } catch {
      setError("Couldn't create the paste — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTitle("");
    setLanguage("");
    setContent("");
    setError(null);
  };

  const shareUrl = result
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/pastebin/${result.id}`
    : "";

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Pastebin</h1>
        <p className="mt-2 text-muted-foreground">
          Share a snippet of text via a link. Pastes expire automatically — save the delete token if you want to
          remove one early.
        </p>

        {result ? (
          <div className="mt-8 flex flex-col gap-4">
            <CopyField label="Share link" value={shareUrl} />
            <CopyField
              label="Delete token"
              value={result.deleteToken}
              warning="Save this now — it won't be shown again, and it's the only way to delete this paste early."
            />
            <button
              type="button"
              onClick={reset}
              className="self-start rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              Create another paste
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 flex-col gap-2">
                <label htmlFor="paste-title" className="text-xs font-medium text-muted-foreground">
                  Title (optional)
                </label>
                <input
                  id="paste-title"
                  type="text"
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground placeholder:text-muted-foreground"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <label htmlFor="paste-language" className="text-xs font-medium text-muted-foreground">
                  Language label (optional)
                </label>
                <input
                  id="paste-language"
                  type="text"
                  placeholder="e.g. typescript"
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground placeholder:text-muted-foreground"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  maxLength={40}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="paste-content" className="text-xs font-medium text-muted-foreground">
                Content
              </label>
              <textarea
                id="paste-content"
                className="min-h-64 w-full resize-y rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
                placeholder="Paste your text here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={262_144}
                spellCheck={false}
                required
              />
            </div>

            <div className="flex flex-col gap-2 sm:w-48">
              <label htmlFor="paste-expiry" className="text-xs font-medium text-muted-foreground">
                Expires after
              </label>
              <select
                id="paste-expiry"
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value as PasteExpiration)}
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
              disabled={submitting || !content.trim()}
              className="self-start rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:pointer-events-none disabled:opacity-40"
            >
              {submitting ? "Creating…" : "Create paste"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
