"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  HTTP_METHODS,
  SHELL_TARGETS,
  buildCurlCommand,
  buildFetchSnippet,
  buildHttpieCommand,
  parseCurlCommand,
  type AuthConfig,
  type Header,
  type HttpMethod,
  type RequestConfig,
  type ShellTarget,
} from "./lib";

type AuthType = AuthConfig["type"];
type OutputFormat = "curl" | "fetch" | "httpie";

const OUTPUT_LABELS: Record<OutputFormat, string> = {
  curl: "curl",
  fetch: "fetch()",
  httpie: "HTTPie",
};

const SHELL_LABELS: Record<ShellTarget, string> = {
  bash: "Bash / zsh",
  powershell: "PowerShell",
  cmd: "cmd.exe",
};

function tabButtonClass(active: boolean) {
  return `rounded-md border px-3 py-1.5 text-sm transition-colors ${
    active
      ? "border-primary/50 bg-primary/10 text-primary"
      : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
  }`;
}

export function HttpRequestBuilder() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://example.com/api/users");
  const [headers, setHeaders] = useState<Header[]>([{ key: "Content-Type", value: "application/json" }]);
  const [body, setBody] = useState("");
  const [authType, setAuthType] = useState<AuthType>("none");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("curl");
  const [shellTarget, setShellTarget] = useState<ShellTarget>("bash");
  const [copied, setCopied] = useState(false);
  const [pasteInput, setPasteInput] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const auth: AuthConfig = useMemo(() => {
    if (authType === "basic") return { type: "basic", username, password };
    if (authType === "bearer") return { type: "bearer", token };
    return { type: "none" };
  }, [authType, username, password, token]);

  const config: RequestConfig = useMemo(
    () => ({
      method,
      url,
      headers: headers.filter((h) => h.key.trim() !== ""),
      body,
      auth,
    }),
    [method, url, headers, body, auth],
  );

  const output = useMemo(() => {
    if (outputFormat === "curl") return buildCurlCommand(config, shellTarget);
    if (outputFormat === "fetch") return buildFetchSnippet(config);
    return buildHttpieCommand(config, shellTarget);
  }, [outputFormat, shellTarget, config]);

  const handleHeaderChange = (index: number, field: "key" | "value", value: string) => {
    setHeaders((prev) => {
      const next = prev.map((h, i) => (i === index ? { ...h, [field]: value } : h));
      const last = next[next.length - 1];
      if (last && (last.key !== "" || last.value !== "")) next.push({ key: "", value: "" });
      return next;
    });
  };

  const removeHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePaste = () => {
    const parsed = parseCurlCommand(pasteInput);
    if (!parsed) {
      setPasteError("Couldn't find a URL in that curl command.");
      return;
    }
    setPasteError(null);
    setMethod(parsed.method);
    setUrl(parsed.url);
    setHeaders([...parsed.headers, { key: "", value: "" }]);
    setBody(parsed.body);
    if (parsed.auth.type === "basic") {
      setAuthType("basic");
      setUsername(parsed.auth.username);
      setPassword(parsed.auth.password);
    } else if (parsed.auth.type === "bearer") {
      setAuthType("bearer");
      setToken(parsed.auth.token);
    } else {
      setAuthType("none");
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          HTTP Request Builder
        </h1>
        <p className="mt-2 text-muted-foreground">
          Build a request and get a ready curl / fetch() / HTTPie command, live — no request is
          ever sent from the browser.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="rounded-md border border-border bg-secondary px-2 py-2 text-sm text-secondary-foreground"
            >
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              spellCheck={false}
              placeholder="https://example.com/api/users"
              className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-5">
            <h2 className="text-xs font-medium text-muted-foreground">Headers</h2>
            <div className="mt-2 flex flex-col gap-2">
              {headers.map((h, i) => (
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
                  {i < headers.length - 1 && (
                    <button
                      type="button"
                      onClick={() => removeHeader(i)}
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

          <div className="mt-5">
            <h2 className="text-xs font-medium text-muted-foreground">Auth</h2>
            <div className="mt-2 flex gap-2">
              {(["none", "basic", "bearer"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAuthType(t)}
                  aria-pressed={authType === t}
                  className={tabButtonClass(authType === t)}
                >
                  {t === "none" ? "None" : t === "basic" ? "Basic" : "Bearer"}
                </button>
              ))}
            </div>
            {authType === "basic" && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="flex-1 rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-secondary-foreground placeholder:text-muted-foreground"
                />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="flex-1 rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-secondary-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
            {authType === "bearer" && (
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Token"
                className="mt-2 w-full rounded-md border border-border bg-secondary px-2 py-1.5 font-mono text-xs text-secondary-foreground placeholder:text-muted-foreground"
              />
            )}
          </div>

          {method !== "GET" && method !== "HEAD" && (
            <div className="mt-5">
              <h2 className="text-xs font-medium text-muted-foreground">Body</h2>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                spellCheck={false}
                placeholder={"{\n  \"foo\": \"bar\"\n}"}
                className="mt-2 w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs text-secondary-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {(Object.keys(OUTPUT_LABELS) as OutputFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setOutputFormat(f)}
                  aria-pressed={outputFormat === f}
                  className={tabButtonClass(outputFormat === f)}
                >
                  {OUTPUT_LABELS[f]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          {outputFormat !== "fetch" && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Shell</span>
              <select
                value={shellTarget}
                onChange={(e) => setShellTarget(e.target.value as ShellTarget)}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground"
              >
                {SHELL_TARGETS.map((t) => (
                  <option key={t} value={t}>
                    {SHELL_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          )}
          <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs text-secondary-foreground">
            {output}
          </pre>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card/70 p-5">
          <h2 className="text-sm font-semibold text-card-foreground">Paste a curl command</h2>
          <p className="mt-1 text-xs text-muted-foreground">Populates the form above.</p>
          <textarea
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            rows={3}
            spellCheck={false}
            placeholder="curl -X POST 'https://example.com/api' -H 'Content-Type: application/json' -d '{}'"
            className="mt-2 w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs text-secondary-foreground placeholder:text-muted-foreground"
          />
          {pasteError && <p className="mt-2 text-sm text-accent-rose">{pasteError}</p>}
          <button
            type="button"
            onClick={handlePaste}
            className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Parse
          </button>
        </div>
      </div>
    </div>
  );
}
