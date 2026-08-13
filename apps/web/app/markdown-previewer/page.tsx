import type { Metadata } from "next";
import { MarkdownPreviewer } from "./markdown-previewer";

export const metadata: Metadata = {
  title: "Markdown Live Previewer — Tools",
  description: "Write Markdown with a formatting toolbar and see the rendered HTML update live, right in your browser.",
};

export default function MarkdownPreviewerPage() {
  return <MarkdownPreviewer />;
}
