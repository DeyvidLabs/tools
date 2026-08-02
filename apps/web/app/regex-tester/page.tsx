import type { Metadata } from "next";
import { RegexTester } from "./regex-tester";

export const metadata: Metadata = {
  title: "Regex Tester — Tools",
  description:
    "Test a regular expression against sample text: highlighted matches, numbered/named capture groups, and a token-by-token explanation.",
};

export default function RegexTesterPage() {
  return <RegexTester />;
}
