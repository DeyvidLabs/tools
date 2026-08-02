export interface EnvEntry {
  line: number;
  key: string;
  value: string;
  quote: '"' | "'" | null;
}

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function stripInlineComment(value: string): string {
  const hashIndex = value.indexOf("#");
  return hashIndex === -1 ? value : value.slice(0, hashIndex).trimEnd();
}

// A pragmatic subset of the dotenv format: KEY=VALUE per line, an optional
// leading "export ", '#' comment lines, and single/double-quoted values.
// Unquoted values get their trailing "# comment" stripped, matching how
// most dotenv parsers (and the reference Node dotenv package) behave.
export function parseEnv(text: string): EnvEntry[] {
  const entries: EnvEntry[] = [];

  text.split("\n").forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) return;

    const withoutExport = line.replace(/^export\s+/, "");
    const eqIndex = withoutExport.indexOf("=");
    if (eqIndex === -1) return;

    const key = withoutExport.slice(0, eqIndex).trim();
    let value = withoutExport.slice(eqIndex + 1).trim();

    let quote: '"' | "'" | null = null;
    if (
      value.length >= 2 &&
      (value[0] === '"' || value[0] === "'") &&
      value[value.length - 1] === value[0]
    ) {
      quote = value[0] as '"' | "'";
      value = value.slice(1, -1);
    } else {
      value = stripInlineComment(value);
    }

    entries.push({ line: i + 1, key, value, quote });
  });

  return entries;
}

export type LintSeverity = "error" | "warning";

export interface LintIssue {
  line: number;
  key: string;
  severity: LintSeverity;
  message: string;
}

export function lintEnv(text: string): LintIssue[] {
  const entries = parseEnv(text);
  const issues: LintIssue[] = [];
  const firstSeenAt = new Map<string, number>();

  for (const entry of entries) {
    if (!KEY_PATTERN.test(entry.key)) {
      issues.push({
        line: entry.line,
        key: entry.key,
        severity: "error",
        message: `"${entry.key}" isn't a valid key — use letters, digits, and underscores, starting with a letter or underscore.`,
      });
    }

    if (firstSeenAt.has(entry.key)) {
      issues.push({
        line: entry.line,
        key: entry.key,
        severity: "warning",
        message: `Duplicate key — "${entry.key}" was already defined on line ${firstSeenAt.get(entry.key)}.`,
      });
    } else {
      firstSeenAt.set(entry.key, entry.line);
    }

    if (entry.value === "") {
      issues.push({
        line: entry.line,
        key: entry.key,
        severity: "warning",
        message: `"${entry.key}" has an empty value.`,
      });
    }
  }

  // Flag whichever quote style is the minority, rather than every quoted
  // value, so a file that's 95% double-quoted only gets called out on the
  // handful of single-quoted outliers.
  const quoteCounts = { '"': 0, "'": 0 };
  for (const entry of entries) {
    if (entry.quote) quoteCounts[entry.quote]++;
  }
  if (quoteCounts['"'] > 0 && quoteCounts["'"] > 0) {
    const majority = quoteCounts['"'] >= quoteCounts["'"] ? '"' : "'";
    for (const entry of entries) {
      if (entry.quote && entry.quote !== majority) {
        issues.push({
          line: entry.line,
          key: entry.key,
          severity: "warning",
          message: `"${entry.key}" uses ${entry.quote} quotes, but most of the file uses ${majority} quotes.`,
        });
      }
    }
  }

  return issues.sort((a, b) => a.line - b.line);
}

export interface EnvDiff {
  missingKeys: string[];
  extraKeys: string[];
}

export function diffEnv(text: string, sampleText: string): EnvDiff {
  const keys = new Set(parseEnv(text).map((e) => e.key));
  const sampleKeys = new Set(parseEnv(sampleText).map((e) => e.key));

  return {
    missingKeys: [...sampleKeys].filter((k) => !keys.has(k)),
    extraKeys: [...keys].filter((k) => !sampleKeys.has(k)),
  };
}
