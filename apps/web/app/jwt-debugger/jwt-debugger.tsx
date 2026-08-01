"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { decodeJwt, expiryStatus, formatDate, timeClaims, type ExpiryStatus } from "./lib";

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const badgeClass: Record<ExpiryStatus, string> = {
  expired: "border-accent-rose/50 bg-accent-rose/10 text-accent-rose",
  "not-yet-valid": "border-amber-500/50 bg-amber-500/10 text-amber-500",
  valid: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
  unknown: "border-border bg-secondary text-muted-foreground",
};

function JsonPanel({ title, data, accent }: { title: string; data: unknown; accent: string }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  return (
    <div className="rounded-lg border border-border bg-card/70 p-5">
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${accent}`}>{title}</h2>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm text-card-foreground">
        {text}
      </pre>
    </div>
  );
}

export function JwtDebugger() {
  const [token, setToken] = useState("");
  const result = useMemo(() => decodeJwt(token), [token]);

  const expiry = result.ok ? expiryStatus(result.data.payload) : null;
  const times = result.ok ? timeClaims(result.data.payload) : [];
  const usesNoneAlg =
    result.ok && typeof result.data.header.alg === "string" && result.data.header.alg.toLowerCase() === "none";

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">JWT Debugger</h1>
        <p className="mt-2 text-muted-foreground">
          Decode a JSON Web Token&apos;s header and payload, and check its expiration. Everything runs in your
          browser — the token is never sent anywhere.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="jwt-input" className="text-xs font-medium text-muted-foreground">
              Token
            </label>
            <button
              type="button"
              onClick={() => setToken(SAMPLE_JWT)}
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              Use sample token
            </button>
          </div>
          <textarea
            id="jwt-input"
            className="min-h-28 w-full resize-y rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            spellCheck={false}
          />
        </div>

        {!result.ok && token.trim() && (
          <p className="mt-3 text-sm text-accent-rose">{result.error}</p>
        )}

        {result.ok && (
          <div className="mt-6 flex flex-col gap-4">
            {expiry && (
              <div className={`rounded-md border px-4 py-2 text-sm font-medium ${badgeClass[expiry.status]}`}>
                {expiry.message}
              </div>
            )}
            {usesNoneAlg && (
              <div className="rounded-md border border-accent-rose/50 bg-accent-rose/10 px-4 py-2 text-sm text-accent-rose">
                alg is &quot;none&quot; — this token carries no signature and should never be trusted.
              </div>
            )}

            <JsonPanel title="Header" data={result.data.header} accent="text-sky-400" />
            <JsonPanel title="Payload" data={result.data.payload} accent="text-fuchsia-400" />

            {times.length > 0 && (
              <div className="rounded-lg border border-border bg-card/70 p-5">
                <h2 className="text-sm font-semibold text-card-foreground">Time claims</h2>
                <dl className="mt-3 flex flex-col gap-2 text-sm">
                  {times.map((t) => (
                    <div key={t.key} className="flex items-baseline justify-between gap-4">
                      <dt className="text-muted-foreground">
                        {t.label} <span className="text-xs">({t.key})</span>
                      </dt>
                      <dd className="text-card-foreground">{formatDate(t.date)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card/70 p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Signature</h2>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{result.data.signature}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Signature verification isn&apos;t performed — this tool only decodes the token.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
