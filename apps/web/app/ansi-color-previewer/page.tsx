import type { Metadata } from "next";
import { AnsiColorPreviewer } from "./ansi-color-previewer";

export const metadata: Metadata = {
  title: "ANSI / Terminal Color Previewer — Tools",
  description: "Paste raw ANSI escape codes and see them rendered with real terminal colors and styles.",
};

export default function AnsiColorPreviewerPage() {
  return <AnsiColorPreviewer />;
}
