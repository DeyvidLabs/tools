export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export interface Header {
  key: string;
  value: string;
}

export type AuthConfig =
  | { type: "none" }
  | { type: "basic"; username: string; password: string }
  | { type: "bearer"; token: string };

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: Header[];
  body: string;
  auth: AuthConfig;
}

// cmd.exe doesn't treat single quotes as a quoting mechanism at all — they'd
// be passed straight through to curl.exe as literal characters and break the
// URL — and its continuation character is ^, not \. PowerShell accepts the
// same backslash-continuation-free style but needs a backtick to continue a
// line. Each generated command has to match the shell it'll actually run in.
export type ShellTarget = "bash" | "powershell" | "cmd";

export const SHELL_TARGETS: ShellTarget[] = ["bash", "powershell", "cmd"];

function shellQuote(value: string, target: ShellTarget): string {
  if (target === "cmd") {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  if (target === "powershell") {
    return `'${value.replace(/'/g, "''")}'`;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function lineContinuation(target: ShellTarget): string {
  if (target === "cmd") return " ^\n  ";
  if (target === "powershell") return " `\n  ";
  return " \\\n  ";
}

function effectiveHeaders(config: RequestConfig): Header[] {
  const headers = config.headers.filter((h) => h.key.trim() !== "");
  if (config.auth.type === "bearer" && config.auth.token) {
    headers.push({ key: "Authorization", value: `Bearer ${config.auth.token}` });
  }
  return headers;
}

function hasBody(config: RequestConfig): boolean {
  return config.body.trim() !== "" && config.method !== "GET" && config.method !== "HEAD";
}

// ---------- curl ----------

export function buildCurlCommand(config: RequestConfig, target: ShellTarget = "bash"): string {
  const lines: string[] = [];

  const methodPart = config.method === "GET" ? "" : ` -X ${config.method}`;
  lines.push(`curl${methodPart} ${shellQuote(config.url, target)}`);

  for (const h of effectiveHeaders(config)) {
    lines.push(`-H ${shellQuote(`${h.key}: ${h.value}`, target)}`);
  }

  if (config.auth.type === "basic") {
    lines.push(`-u ${shellQuote(`${config.auth.username}:${config.auth.password}`, target)}`);
  }

  if (hasBody(config)) {
    lines.push(`-d ${shellQuote(config.body, target)}`);
  }

  return lines.join(lineContinuation(target));
}

// ---------- fetch() ----------

export function buildFetchSnippet(config: RequestConfig): string {
  const headers = [...config.headers.filter((h) => h.key.trim() !== "")];
  if (config.auth.type === "bearer" && config.auth.token) {
    headers.push({ key: "Authorization", value: `Bearer ${config.auth.token}` });
  }
  if (config.auth.type === "basic") {
    const encoded = btoa(`${config.auth.username}:${config.auth.password}`);
    headers.push({ key: "Authorization", value: `Basic ${encoded}` });
  }

  const lines = [`fetch(${JSON.stringify(config.url)}, {`, `  method: ${JSON.stringify(config.method)},`];

  if (headers.length > 0) {
    lines.push("  headers: {");
    headers.forEach((h, i) => {
      lines.push(
        `    ${JSON.stringify(h.key)}: ${JSON.stringify(h.value)}${i < headers.length - 1 ? "," : ""}`,
      );
    });
    lines.push("  },");
  }

  if (hasBody(config)) {
    lines.push(`  body: ${JSON.stringify(config.body)},`);
  }

  lines.push("})");
  lines.push("  .then((res) => res.json())");
  lines.push("  .then(console.log);");

  return lines.join("\n");
}

// ---------- httpie ----------

export function buildHttpieCommand(config: RequestConfig, target: ShellTarget = "bash"): string {
  const head = ["http"];
  if (config.auth.type === "basic") {
    head.push("-a", shellQuote(`${config.auth.username}:${config.auth.password}`, target));
  }
  if (config.method !== "GET") head.push(config.method);
  head.push(shellQuote(config.url, target));

  const lines = [head.join(" ")];

  for (const h of effectiveHeaders(config)) {
    lines.push(`${h.key}:${shellQuote(h.value, target)}`);
  }

  if (hasBody(config)) {
    lines.push(`--raw=${shellQuote(config.body, target)}`);
  }

  return lines.join(lineContinuation(target));
}

// ---------- Reverse parsing: curl -> RequestConfig ----------

function tokenizeShellCommand(rawInput: string): string[] {
  // \, ^, and ` are the bash, cmd, and PowerShell line-continuation
  // characters respectively (however buildCurlCommand/buildHttpieCommand
  // joined the multi-line output being pasted back in) — normalize all of
  // them to whitespace before tokenizing, otherwise the backslash-escape
  // branch below would swallow a `\<newline>` into the token and corrupt
  // whatever follows.
  const input = rawInput.replace(/[\\^`]\r?\n[ \t]*/g, " ");
  const tokens: string[] = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    while (i < n && /\s/.test(input[i])) i++;
    if (i >= n) break;

    let token = "";
    while (i < n && !/\s/.test(input[i])) {
      const ch = input[i];
      if (ch === "'") {
        i++;
        while (i < n && input[i] !== "'") {
          token += input[i];
          i++;
        }
        i++;
      } else if (ch === '"') {
        i++;
        while (i < n && input[i] !== '"') {
          if (input[i] === "\\" && i + 1 < n && (input[i + 1] === '"' || input[i + 1] === "\\")) {
            token += input[i + 1];
            i += 2;
          } else {
            token += input[i];
            i++;
          }
        }
        i++;
      } else if (ch === "\\" && i + 1 < n) {
        token += input[i + 1];
        i += 2;
      } else {
        token += ch;
        i++;
      }
    }
    tokens.push(token);
  }

  return tokens;
}

export function parseCurlCommand(input: string): RequestConfig | null {
  const tokens = tokenizeShellCommand(input.trim());
  let i = tokens[0] === "curl" ? 1 : 0;
  if (tokens.length === 0) return null;

  let method: HttpMethod | null = null;
  let url = "";
  const headers: Header[] = [];
  let body = "";
  let basicAuth: { username: string; password: string } | null = null;

  while (i < tokens.length) {
    const tok = tokens[i];

    if (tok === "-X" || tok === "--request") {
      method = (tokens[++i] ?? "GET").toUpperCase() as HttpMethod;
    } else if (tok === "-H" || tok === "--header") {
      const header = tokens[++i] ?? "";
      const idx = header.indexOf(":");
      if (idx !== -1) {
        headers.push({ key: header.slice(0, idx).trim(), value: header.slice(idx + 1).trim() });
      }
    } else if (tok === "-d" || tok === "--data" || tok === "--data-raw" || tok === "--data-binary" || tok === "--data-ascii") {
      const value = tokens[++i] ?? "";
      body = body ? `${body}&${value}` : value;
    } else if (tok === "-u" || tok === "--user") {
      const cred = tokens[++i] ?? "";
      const idx = cred.indexOf(":");
      basicAuth = idx !== -1 ? { username: cred.slice(0, idx), password: cred.slice(idx + 1) } : { username: cred, password: "" };
    } else if (tok === "--url") {
      url = tokens[++i] ?? "";
    } else if (!tok.startsWith("-")) {
      url = tok;
    }
    // Unrecognized flags (e.g. -s, -L, --compressed) are skipped without
    // consuming the next token, so they can't be mistaken for the URL.

    i++;
  }

  if (!url) return null;

  let auth: AuthConfig = { type: "none" };
  if (basicAuth) {
    auth = { type: "basic", ...basicAuth };
  } else {
    const authIdx = headers.findIndex((h) => h.key.toLowerCase() === "authorization");
    if (authIdx !== -1 && /^Bearer\s+/i.test(headers[authIdx].value)) {
      auth = { type: "bearer", token: headers[authIdx].value.replace(/^Bearer\s+/i, "") };
      headers.splice(authIdx, 1);
    }
  }

  return {
    method: method ?? (body ? "POST" : "GET"),
    url,
    headers,
    body,
    auth,
  };
}
