import { format } from "sql-formatter";

export type SqlDialect = "sql" | "postgresql" | "mysql";

export const DIALECT_LABELS: Record<SqlDialect, string> = {
  sql: "Generic",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
};

export type FormatResult = { ok: true; output: string } | { ok: false; error: string };

export function formatSql(query: string, dialect: SqlDialect, uppercaseKeywords: boolean): FormatResult {
  try {
    const output = format(query, {
      language: dialect,
      keywordCase: uppercaseKeywords ? "upper" : "preserve",
      tabWidth: 2,
    });
    return { ok: true, output };
  } catch (err) {
    // sql-formatter's parse errors include a full grammar dump after the
    // first line — only the first line ("Parse error at token: ... at line
    // X column Y") is useful to show a user.
    const message = err instanceof Error ? err.message.split("\n")[0] : "Failed to format SQL";
    return { ok: false, error: message };
  }
}

const OPEN_QUOTES: Record<string, string> = { "'": "'", '"': '"', "`": "`" };

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

// Whether a space should be kept between the text emitted so far and the
// start of the next token — dropped before `,` `)` `;` and after `(`, kept
// everywhere else, so a multi-line formatted query collapses into a single
// tight line without losing the spacing that keeps tokens like `a` and `b`
// in `a and b` apart.
function needsSpaceBefore(emitted: string, nextChar: string): boolean {
  const prevChar = emitted[emitted.length - 1];
  if (nextChar === "," || nextChar === ")" || nextChar === ";") return false;
  if (prevChar === "(") return false;
  return true;
}

// Strips comments and collapses all whitespace/newlines to single spaces
// (only where actually needed), while leaving the contents of string
// literals and quoted identifiers untouched — a hand-rolled scanner rather
// than a regex substitution, since regex can't reliably tell "this looks
// like a comment start" apart from "this is inside a string" without the
// same state tracking anyway.
export function minifySql(sql: string): string {
  let i = 0;
  const n = sql.length;
  let out = "";
  let pendingSpace = false;

  while (i < n) {
    const ch = sql[i];

    if (isWhitespace(ch)) {
      pendingSpace = true;
      i++;
      continue;
    }

    if (ch === "-" && sql[i + 1] === "-") {
      i += 2;
      while (i < n && sql[i] !== "\n") i++;
      pendingSpace = true;
      continue;
    }

    if (ch === "/" && sql[i + 1] === "*") {
      i += 2;
      while (i < n && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i = Math.min(n, i + 2);
      pendingSpace = true;
      continue;
    }

    if (ch in OPEN_QUOTES) {
      const quote = ch;
      let token = quote;
      i++;
      while (i < n) {
        if (sql[i] === quote && sql[i + 1] === quote) {
          token += quote + quote;
          i += 2;
          continue;
        }
        if (sql[i] === quote) {
          token += quote;
          i++;
          break;
        }
        token += sql[i];
        i++;
      }
      if (pendingSpace && out.length > 0 && needsSpaceBefore(out, token[0])) out += " ";
      out += token;
      pendingSpace = false;
      continue;
    }

    let token = "";
    while (
      i < n &&
      !isWhitespace(sql[i]) &&
      !(sql[i] in OPEN_QUOTES) &&
      !(sql[i] === "-" && sql[i + 1] === "-") &&
      !(sql[i] === "/" && sql[i + 1] === "*")
    ) {
      token += sql[i];
      i++;
    }
    if (token) {
      if (pendingSpace && out.length > 0 && needsSpaceBefore(out, token[0])) out += " ";
      out += token;
      pendingSpace = false;
    }
  }

  return out.trim();
}
