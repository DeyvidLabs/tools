// Hand-rolled Markdown → HTML, matching the project's "no runtime deps for
// self-contained tools" pattern (see the ANSI previewer's own escape parser).
// Deliberately does NOT pass raw HTML in the input through untouched — all
// literal text is escaped, so someone pasting a <script> tag sees it as text
// rather than getting it executed against the rendered preview.

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

// Only allow schemes that can't execute script (blocks javascript:, data:,
// vbscript:, etc.) — anything else, including bare relative paths, is fine.
const SAFE_URL = /^(https?:|mailto:|#|\/|\.\/|\.\.\/)/i;

export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // Browsers drop C0 controls/space around the scheme and tab/CR/LF inside it,
  // so "\u0001javascript:" or "java\tscript:" still run — check the stripped form.
  const normalized = trimmed.replace(/[\u0000- \u007f-\u009f]/g, "");
  if (/^[a-z][a-z0-9+.-]*:/i.test(normalized) && !SAFE_URL.test(normalized)) return "#";
  return escapeHtml(trimmed);
}

function renderInline(text: string): string {
  // Inline code first, and stash its (already-escaped, un-formatted) content
  // behind a placeholder so later regexes for bold/italic/links don't reach
  // inside a code span.
  const codeSpans: string[] = [];
  let out = text.replace(/`([^`]+)`/g, (_, code: string) => {
    codeSpans.push(`<code>${escapeHtml(code)}</code>`);
    return `@${codeSpans.length - 1}@`;
  });

  out = escapeHtml(out);

  // URL part allows one level of nested parens (e.g. "javascript:alert(1)",
  // or real-world URLs with a "(disambiguation)" segment) so the match
  // doesn't truncate at the first inner ")" and leak a stray ")" into the text.
  const URL_PATTERN = String.raw`((?:[^()\s]|\([^()]*\))+)`;
  out = out.replace(
    new RegExp(String.raw`!\[([^\]]*)\]\(${URL_PATTERN}(?:\s+"([^"]*)")?\)`, "g"),
    (_, alt: string, url: string, title: string | undefined) =>
      `<img src="${sanitizeUrl(url)}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ""} />`,
  );
  out = out.replace(
    new RegExp(String.raw`\[([^\]]+)\]\(${URL_PATTERN}(?:\s+"([^"]*)")?\)`, "g"),
    (_, label: string, url: string, title: string | undefined) =>
      `<a href="${sanitizeUrl(url)}"${title ? ` title="${escapeHtml(title)}"` : ""} rel="noopener noreferrer">${label}</a>`,
  );

  out = out.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, a: string, b: string) => `<strong>${a ?? b}</strong>`);
  out = out.replace(/\*([^*]+)\*|(?<![a-zA-Z0-9])_([^_]+)_(?![a-zA-Z0-9])/g, (_, a: string, b: string) => `<em>${a ?? b}</em>`);
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  out = out.replace(/@(\d+)@/g, (_, i: string) => codeSpans[Number(i)]);

  return out;
}

interface Block {
  type: "h" | "hr" | "quote" | "ul" | "ol" | "code" | "p";
  level?: number;
  lang?: string;
  lines: string[];
}

function groupBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: "code", lang: fence[1], lines: codeLines });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: "h", level: heading[1].length, lines: [heading[2]] });
      i++;
      continue;
    }

    const hrChars = line.trim().replace(/\s+/g, "");
    if (hrChars.length >= 3 && /^-+$|^\*+$|^_+$/.test(hrChars)) {
      blocks.push({ type: "hr", lines: [] });
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", lines: quoteLines });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const itemLines: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        itemLines.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", lines: itemLines });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const itemLines: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        itemLines.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", lines: itemLines });
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6})\s+|^```|^>\s?|^\s*[-*+]\s+|^\s*\d+[.)]\s+/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", lines: paraLines });
  }

  return blocks;
}

export function markdownToHtml(markdown: string): string {
  return groupBlocks(markdown)
    .map((block) => {
      switch (block.type) {
        case "h":
          return `<h${block.level}>${renderInline(block.lines[0])}</h${block.level}>`;
        case "hr":
          return "<hr />";
        case "quote":
          return `<blockquote>${markdownToHtml(block.lines.join("\n"))}</blockquote>`;
        case "ul":
          return `<ul>${block.lines.map((l) => `<li>${renderInline(l)}</li>`).join("")}</ul>`;
        case "ol":
          return `<ol>${block.lines.map((l) => `<li>${renderInline(l)}</li>`).join("")}</ol>`;
        case "code":
          return `<pre><code${block.lang ? ` class="language-${escapeHtml(block.lang)}"` : ""}>${escapeHtml(block.lines.join("\n"))}</code></pre>`;
        case "p":
          return `<p>${block.lines.map(renderInline).join("<br />")}</p>`;
      }
    })
    .join("\n");
}

// --- Toolbar editing helpers -------------------------------------------
// Pure textarea-selection transforms: given the current value and the
// selection range, return the new value plus where the selection should
// land afterward. Kept separate from DOM concerns so they're unit-testable
// and the component just wires them to a <textarea> ref.

export interface EditResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export function wrapSelection(value: string, start: number, end: number, marker: string, markerEnd: string = marker): EditResult {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  // Toggle off if the selection is already exactly wrapped in the marker.
  if (selected.length >= marker.length + markerEnd.length && selected.startsWith(marker) && selected.endsWith(markerEnd)) {
    const inner = selected.slice(marker.length, selected.length - markerEnd.length);
    return { text: before + inner + after, selectionStart: start, selectionEnd: start + inner.length };
  }

  const content = selected || "text";
  const text = before + marker + content + markerEnd + after;
  const selectionStart = start + marker.length;
  return { text, selectionStart, selectionEnd: selectionStart + content.length };
}

function expandToLines(value: string, start: number, end: number): { lineStart: number; lineEnd: number } {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = value.indexOf("\n", end);
  return { lineStart, lineEnd: nextBreak === -1 ? value.length : nextBreak };
}

export function togglePrefix(value: string, start: number, end: number, prefix: string): EditResult {
  const { lineStart, lineEnd } = expandToLines(value, start, end);
  const before = value.slice(0, lineStart);
  const after = value.slice(lineEnd);
  const lines = value.slice(lineStart, lineEnd).split("\n");

  const allPrefixed = lines.every((l) => l === "" || l.startsWith(prefix));
  const newBlock = lines.map((l) => (l === "" ? l : allPrefixed ? l.slice(prefix.length) : prefix + l)).join("\n");

  return { text: before + newBlock + after, selectionStart: lineStart, selectionEnd: lineStart + newBlock.length };
}

export function toggleOrderedList(value: string, start: number, end: number): EditResult {
  const { lineStart, lineEnd } = expandToLines(value, start, end);
  const before = value.slice(0, lineStart);
  const after = value.slice(lineEnd);
  const lines = value.slice(lineStart, lineEnd).split("\n");

  const isNumbered = lines.every((l) => l === "" || /^\d+\.\s/.test(l));
  let n = 0;
  const newBlock = lines
    .map((l) => {
      if (l === "") return l;
      if (isNumbered) return l.replace(/^\d+\.\s/, "");
      n += 1;
      return `${n}. ${l}`;
    })
    .join("\n");

  return { text: before + newBlock + after, selectionStart: lineStart, selectionEnd: lineStart + newBlock.length };
}

export function insertAtCursor(value: string, start: number, end: number, insertion: string): EditResult {
  const text = value.slice(0, start) + insertion + value.slice(end);
  const cursor = start + insertion.length;
  return { text, selectionStart: cursor, selectionEnd: cursor };
}

export function insertTable(value: string, start: number, end: number, rows = 2, cols = 3): EditResult {
  const header = Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(" | ");
  const divider = Array.from({ length: cols }, () => "---").join(" | ");
  const bodyRow = Array.from({ length: cols }, () => "Cell").join(" | ");
  const body = Array.from({ length: rows }, () => `| ${bodyRow} |`).join("\n");
  const table = `| ${header} |\n| ${divider} |\n${body}\n`;
  return insertAtCursor(value, start, end, table);
}

export const EXAMPLE_INPUT = `# Markdown Live Previewer

Type on the left, see rendered **HTML** on the right — everything runs *in your browser*, nothing is uploaded anywhere.

## Features

- Headings, lists, and blockquotes
- \`inline code\` and fenced code blocks
- [Links](https://example.com) and images
- ~~Strikethrough~~ and **bold** and *italic*

## Example code block

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> Blockquotes work too, including across
> multiple lines.

1. First item
2. Second item
3. Third item

---

Built for quick READMEs and PR descriptions.
`;
