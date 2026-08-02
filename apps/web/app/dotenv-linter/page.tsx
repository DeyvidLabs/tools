import type { Metadata } from "next";
import { DotenvLinter } from "./dotenv-linter";

export const metadata: Metadata = {
  title: ".env Linter — Tools",
  description:
    "Paste a .env file to catch duplicate keys, empty values, mixed quoting, and invalid characters. Diff against a .env.sample to find missing or extra keys.",
};

export default function DotenvLinterPage() {
  return <DotenvLinter />;
}
