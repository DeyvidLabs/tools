import type { Metadata } from "next";
import { JsonFormatterDiff } from "./json-formatter-diff";

export const metadata: Metadata = {
  title: "JSON Formatter / Validator / Diff — Tools",
  description:
    "Pretty-print and validate JSON with line/column error reporting, diff two JSON documents key by key, or diff plain text line by line.",
};

export default function JsonFormatterDiffPage() {
  return <JsonFormatterDiff />;
}
