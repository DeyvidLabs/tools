import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  insertAtCursor,
  insertTable,
  markdownToHtml,
  sanitizeUrl,
  toggleOrderedList,
  togglePrefix,
  wrapSelection,
} from "./lib";

describe("markdownToHtml", () => {
  it("renders headings", () => {
    expect(markdownToHtml("# Title")).toBe("<h1>Title</h1>");
    expect(markdownToHtml("### Sub")).toBe("<h3>Sub</h3>");
  });

  it("renders a paragraph with bold, italic, and strikethrough", () => {
    expect(markdownToHtml("**bold** *italic* ~~gone~~")).toBe(
      "<p><strong>bold</strong> <em>italic</em> <del>gone</del></p>",
    );
  });

  it("renders inline code without interpreting markdown inside it", () => {
    expect(markdownToHtml("`*not italic*`")).toBe("<p><code>*not italic*</code></p>");
  });

  it("renders links with a sanitized href", () => {
    expect(markdownToHtml("[text](https://example.com)")).toBe(
      '<p><a href="https://example.com" rel="noopener noreferrer">text</a></p>',
    );
  });

  it("blocks javascript: URLs in links", () => {
    expect(markdownToHtml("[click me](javascript:alert(1))")).toBe(
      '<p><a href="#" rel="noopener noreferrer">click me</a></p>',
    );
  });

  it("escapes raw HTML in the input instead of executing it", () => {
    expect(markdownToHtml("<script>alert(1)</script>")).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  });

  it("renders unordered and ordered lists", () => {
    expect(markdownToHtml("- one\n- two")).toBe("<ul><li>one</li><li>two</li></ul>");
    expect(markdownToHtml("1. one\n2. two")).toBe("<ol><li>one</li><li>two</li></ol>");
  });

  it("renders a fenced code block with the language class, unformatted", () => {
    expect(markdownToHtml("```js\nconst x = 1;\n```")).toBe(
      '<pre><code class="language-js">const x = 1;</code></pre>',
    );
  });

  it("renders a blockquote", () => {
    expect(markdownToHtml("> quoted text")).toBe("<blockquote><p>quoted text</p></blockquote>");
  });

  it("renders a horizontal rule", () => {
    expect(markdownToHtml("---")).toBe("<hr />");
  });
});

describe("escapeHtml / sanitizeUrl", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });

  it("allows http, https, mailto, and relative URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
    expect(sanitizeUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(sanitizeUrl("/relative")).toBe("/relative");
  });

  it("neutralizes dangerous schemes", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
    expect(sanitizeUrl("data:text/html,<script>1</script>")).toBe("#");
  });
});

describe("toolbar edit helpers", () => {
  it("wrapSelection wraps the selected text with the marker", () => {
    const result = wrapSelection("hello world", 0, 5, "**");
    expect(result.text).toBe("**hello** world");
    expect(result.selectionStart).toBe(2);
    expect(result.selectionEnd).toBe(7);
  });

  it("wrapSelection inserts a placeholder when nothing is selected", () => {
    const result = wrapSelection("", 0, 0, "**");
    expect(result.text).toBe("**text**");
  });

  it("wrapSelection toggles the marker off when already wrapped", () => {
    const result = wrapSelection("**bold**", 0, 8, "**");
    expect(result.text).toBe("bold");
  });

  it("togglePrefix adds a prefix to every line, then removes it", () => {
    const added = togglePrefix("one\ntwo", 0, 7, "> ");
    expect(added.text).toBe("> one\n> two");

    const removed = togglePrefix(added.text, 0, added.text.length, "> ");
    expect(removed.text).toBe("one\ntwo");
  });

  it("toggleOrderedList numbers lines, then strips numbering", () => {
    const numbered = toggleOrderedList("one\ntwo\nthree", 0, 13);
    expect(numbered.text).toBe("1. one\n2. two\n3. three");

    const stripped = toggleOrderedList(numbered.text, 0, numbered.text.length);
    expect(stripped.text).toBe("one\ntwo\nthree");
  });

  it("insertAtCursor inserts text at the cursor and replaces a selection", () => {
    expect(insertAtCursor("hello", 5, 5, " world").text).toBe("hello world");
    expect(insertAtCursor("hello world", 0, 5, "bye").text).toBe("bye world");
  });

  it("insertTable inserts a markdown table with the requested dimensions", () => {
    const result = insertTable("", 0, 0, 1, 2);
    expect(result.text).toBe("| Header 1 | Header 2 |\n| --- | --- |\n| Cell | Cell |\n");
  });
});
