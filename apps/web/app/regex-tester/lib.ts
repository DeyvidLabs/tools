export interface RegexPreset {
  name: string;
  pattern: string;
  flags: string;
  sampleText: string;
}

export const REGEX_PRESETS: RegexPreset[] = [
  {
    name: "Email",
    pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.-]+",
    flags: "g",
    sampleText: "Contact us at hello@example.com or support@sub.example.co.uk",
  },
  {
    name: "URL",
    pattern: "https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&'()*+,;=.]*",
    flags: "g",
    sampleText: "Visit https://example.com/path?query=1 or http://sub.example.org",
  },
  {
    name: "IPv4",
    pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b",
    flags: "g",
    sampleText: "Server at 192.168.1.1 or 10.0.0.255",
  },
  {
    name: "Hex color",
    pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
    flags: "g",
    sampleText: "Colors: #fff, #123abc, #FF00FF",
  },
  {
    name: "Phone number (US)",
    pattern: "\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}",
    flags: "g",
    sampleText: "Call (555) 123-4567 or 555-987-6543",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "\\d{4}-\\d{2}-\\d{2}",
    flags: "g",
    sampleText: "Event on 2024-05-01 and 2024-12-31",
  },
  {
    name: "Whitespace runs",
    pattern: "\\s{2,}",
    flags: "g",
    sampleText: "Too   many    spaces  here",
  },
];

export type RegexBuildResult = { ok: true; regex: RegExp } | { ok: false; error: string };

export function buildRegex(pattern: string, flags: string): RegexBuildResult {
  try {
    return { ok: true, regex: new RegExp(pattern, flags) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid regular expression" };
  }
}

export interface MatchGroup {
  name: string;
  value: string | undefined;
}

export interface RegexMatch {
  index: number;
  match: string;
  groups: MatchGroup[];
}

// matchAll requires the global flag; the tester always wants every match
// regardless of whether the user toggled `g`, so a global copy is used just
// for enumeration without changing the flags shown/applied elsewhere.
export function findMatches(regex: RegExp, text: string): RegexMatch[] {
  const globalRegex = regex.global ? regex : new RegExp(regex.source, regex.flags + "g");
  const matches: RegexMatch[] = [];

  for (const m of text.matchAll(globalRegex)) {
    const groups: MatchGroup[] = [];
    for (let i = 1; i < m.length; i++) {
      groups.push({ name: String(i), value: m[i] });
    }
    if (m.groups) {
      for (const [name, value] of Object.entries(m.groups)) {
        groups.push({ name, value });
      }
    }
    matches.push({ index: m.index ?? 0, match: m[0], groups });
  }

  return matches;
}

export interface HighlightSegment {
  text: string;
  matchIndex: number | null;
}

export function highlightText(text: string, matches: RegexMatch[]): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  matches.forEach((m, i) => {
    if (m.index > cursor) {
      segments.push({ text: text.slice(cursor, m.index), matchIndex: null });
    }
    segments.push({ text: m.match, matchIndex: i });
    cursor = m.index + m.match.length;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matchIndex: null });
  }

  return segments;
}

export interface RegexToken {
  token: string;
  description: string;
}

interface TokenizerState {
  i: number;
}

function readQuantifierSuffix(pattern: string, state: TokenizerState): string {
  let suffix = "";
  const ch = pattern[state.i];
  if (ch === "*" || ch === "+" || ch === "?") {
    suffix += ch;
    state.i++;
  } else if (ch === "{") {
    const m = /^\{\d+(,\d*)?\}/.exec(pattern.slice(state.i));
    if (m) {
      suffix += m[0];
      state.i += m[0].length;
    }
  }
  if (suffix && pattern[state.i] === "?") {
    suffix += "?";
    state.i++;
  }
  return suffix;
}

function quantifierDescription(suffix: string): string {
  if (!suffix) return "";
  const lazy = suffix.endsWith("?") && suffix !== "?";
  const base = lazy ? suffix.slice(0, -1) : suffix;

  let desc: string;
  if (base === "*") {
    desc = "zero or more times";
  } else if (base === "+") {
    desc = "one or more times";
  } else if (base === "?") {
    desc = "zero or one time (optional)";
  } else {
    const m = /^\{(\d+)(,(\d*))?\}$/.exec(base) as RegExpExecArray;
    const min = m[1];
    if (m[2] === undefined) desc = `exactly ${min} times`;
    else if (m[3] === "") desc = `at least ${min} times`;
    else desc = `${min} to ${m[3]} times`;
  }
  return lazy ? `${desc} (lazy, as few as possible)` : desc;
}

const ESCAPE_DESCRIPTIONS: Record<string, string> = {
  d: "a digit (0-9)",
  D: "a character that is not a digit",
  w: "a word character (alphanumeric or underscore)",
  W: "a character that is not a word character",
  s: "a whitespace character (space, tab, newline...)",
  S: "a character that is not whitespace",
  b: "a word boundary",
  B: "a position that is not a word boundary",
  n: "a newline character",
  t: "a tab character",
  r: "a carriage return character",
};

// Walks the *pattern string itself* (not the matched text) token by token,
// producing a plain-English explanation for each — covers the constructs
// that show up in common patterns (character classes, quantifiers, groups,
// lookaround, backreferences) rather than the full regex grammar.
export function explainRegex(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  const state: TokenizerState = { i: 0 };

  function push(token: string, description: string) {
    tokens.push({ token, description });
  }

  while (state.i < pattern.length) {
    const ch = pattern[state.i];

    if (ch === "\\") {
      const next = pattern[state.i + 1];

      if (next && /[1-9]/.test(next)) {
        const m = /^\\(\d+)/.exec(pattern.slice(state.i)) as RegExpExecArray;
        const raw = m[0];
        state.i += raw.length;
        const suffix = readQuantifierSuffix(pattern, state);
        push(
          raw + suffix,
          `backreference to group ${m[1]}${suffix ? ", " + quantifierDescription(suffix) : ""}`,
        );
        continue;
      }

      if (next === "k" && pattern[state.i + 2] === "<") {
        const m = /^\\k<([^>]+)>/.exec(pattern.slice(state.i));
        if (m) {
          state.i += m[0].length;
          const suffix = readQuantifierSuffix(pattern, state);
          push(
            m[0] + suffix,
            `backreference to named group "${m[1]}"${suffix ? ", " + quantifierDescription(suffix) : ""}`,
          );
          continue;
        }
      }

      if (next && ESCAPE_DESCRIPTIONS[next]) {
        const raw = "\\" + next;
        state.i += 2;
        const suffix = readQuantifierSuffix(pattern, state);
        push(raw + suffix, ESCAPE_DESCRIPTIONS[next] + (suffix ? `, ${quantifierDescription(suffix)}` : ""));
        continue;
      }

      const raw = "\\" + (next ?? "");
      state.i += raw.length;
      const suffix = readQuantifierSuffix(pattern, state);
      push(raw + suffix, `the literal character "${next}"` + (suffix ? `, ${quantifierDescription(suffix)}` : ""));
      continue;
    }

    if (ch === "^") {
      push("^", "start of the string (or of the line, with the m flag)");
      state.i++;
      continue;
    }
    if (ch === "$") {
      push("$", "end of the string (or of the line, with the m flag)");
      state.i++;
      continue;
    }
    if (ch === ".") {
      state.i++;
      const suffix = readQuantifierSuffix(pattern, state);
      push(
        "." + suffix,
        "any character (except newline, unless the s flag is set)" +
          (suffix ? `, ${quantifierDescription(suffix)}` : ""),
      );
      continue;
    }
    if (ch === "|") {
      push("|", "or (alternation)");
      state.i++;
      continue;
    }
    if (ch === "[") {
      const m = /^\[(\^?)((?:\\.|[^\]\\])*)\]/.exec(pattern.slice(state.i));
      if (m) {
        const raw = m[0];
        state.i += raw.length;
        const suffix = readQuantifierSuffix(pattern, state);
        const negated = m[1] === "^";
        const content = m[2];
        push(
          raw + suffix,
          `${negated ? "none of the characters" : "one of the characters"} "${content}"` +
            (suffix ? `, ${quantifierDescription(suffix)}` : ""),
        );
        continue;
      }
    }
    if (ch === "(") {
      let raw = "(";
      let desc: string;
      if (pattern.startsWith("(?:", state.i)) {
        raw = "(?:";
        desc = "start of a non-capturing group";
      } else if (pattern.startsWith("(?=", state.i)) {
        raw = "(?=";
        desc = "start of a positive lookahead (must follow, without consuming text)";
      } else if (pattern.startsWith("(?!", state.i)) {
        raw = "(?!";
        desc = "start of a negative lookahead (must not follow)";
      } else if (pattern.startsWith("(?<=", state.i)) {
        raw = "(?<=";
        desc = "start of a positive lookbehind (must precede)";
      } else if (pattern.startsWith("(?<!", state.i)) {
        raw = "(?<!";
        desc = "start of a negative lookbehind (must not precede)";
      } else {
        const named = /^\(\?<([^>]+)>/.exec(pattern.slice(state.i));
        if (named) {
          raw = named[0];
          desc = `start of a named capturing group "${named[1]}"`;
        } else {
          desc = "start of a capturing group";
        }
      }
      state.i += raw.length;
      push(raw, desc);
      continue;
    }
    if (ch === ")") {
      state.i++;
      const suffix = readQuantifierSuffix(pattern, state);
      push(")" + suffix, "end of group" + (suffix ? `, the group repeats ${quantifierDescription(suffix)}` : ""));
      continue;
    }

    state.i++;
    const suffix = readQuantifierSuffix(pattern, state);
    push(ch + suffix, `the literal character "${ch}"` + (suffix ? `, ${quantifierDescription(suffix)}` : ""));
  }

  return tokens;
}
