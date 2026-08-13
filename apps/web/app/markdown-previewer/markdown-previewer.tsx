"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  EXAMPLE_INPUT,
  insertAtCursor,
  insertTable,
  markdownToHtml,
  toggleOrderedList,
  togglePrefix,
  wrapSelection,
  type EditResult,
} from "./lib";

type Edit = (value: string, start: number, end: number) => EditResult;

const TOOLBAR: { label: string; title: string; edit: Edit }[] = [
  { label: "B", title: "Bold", edit: (v, s, e) => wrapSelection(v, s, e, "**") },
  { label: "I", title: "Italic", edit: (v, s, e) => wrapSelection(v, s, e, "_") },
  { label: "S", title: "Strikethrough", edit: (v, s, e) => wrapSelection(v, s, e, "~~") },
  { label: "</>", title: "Inline code", edit: (v, s, e) => wrapSelection(v, s, e, "`") },
  { label: "H1", title: "Heading 1", edit: (v, s, e) => togglePrefix(v, s, e, "# ") },
  { label: "H2", title: "Heading 2", edit: (v, s, e) => togglePrefix(v, s, e, "## ") },
  { label: "H3", title: "Heading 3", edit: (v, s, e) => togglePrefix(v, s, e, "### ") },
  { label: "❝", title: "Quote", edit: (v, s, e) => togglePrefix(v, s, e, "> ") },
  { label: "• List", title: "Bullet list", edit: (v, s, e) => togglePrefix(v, s, e, "- ") },
  { label: "1. List", title: "Numbered list", edit: (v, s, e) => toggleOrderedList(v, s, e) },
  { label: "Link", title: "Link", edit: (v, s, e) => wrapSelection(v, s, e, "[", "](https://)") },
  { label: "Image", title: "Image", edit: (v, s, e) => wrapSelection(v, s, e, "![", "](https://)") },
  {
    label: "Code block",
    title: "Fenced code block",
    edit: (v, s, e) => {
      const selected = v.slice(s, e) || "code";
      return insertAtCursor(v, s, e, "```\n" + selected + "\n```");
    },
  },
  { label: "Table", title: "Insert table", edit: (v, s, e) => insertTable(v, s, e) },
  { label: "HR", title: "Horizontal rule", edit: (v, s, e) => insertAtCursor(v, s, e, "\n---\n") },
];

export function MarkdownPreviewer() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const html = useMemo(() => markdownToHtml(input), [input]);

  const applyEdit = useCallback(
    (edit: Edit) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const result = edit(input, ta.selectionStart, ta.selectionEnd);
      setInput(result.text);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(result.selectionStart, result.selectionEnd);
      });
    },
    [input],
  );

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-5xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Markdown Live Previewer</h1>
        <p className="mt-2 text-muted-foreground">
          Write Markdown with the toolbar or by hand and see the rendered HTML update live. Everything runs in
          your browser, nothing is sent anywhere.
        </p>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {TOOLBAR.map((btn) => (
              <button
                key={btn.title}
                type="button"
                title={btn.title}
                onClick={() => applyEdit(btn.edit)}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {btn.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setInput(EXAMPLE_INPUT)}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Load example
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="markdown-input" className="text-xs font-medium text-muted-foreground">
              Markdown
            </label>
            <textarea
              id="markdown-input"
              ref={textareaRef}
              rows={20}
              spellCheck={false}
              className="w-full flex-1 rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
              placeholder="# Start writing, or select text and use the toolbar above…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Preview</span>
              <button
                type="button"
                onClick={handleCopyHtml}
                disabled={!input}
                className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              >
                {copied ? "Copied!" : "Copy HTML"}
              </button>
            </div>
            <div
              className="min-h-[28rem] flex-1 overflow-auto rounded-md border border-border bg-card p-4 text-sm text-card-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:my-4 [&_hr]:border-border [&_img]:max-w-full [&_img]:rounded [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-secondary [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: html || "<span class='opacity-50'>Nothing to preview yet…</span>" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
