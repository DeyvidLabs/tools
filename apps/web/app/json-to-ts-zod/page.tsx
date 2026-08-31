import type { Metadata } from "next";
import { JsonToTsZod } from "./json-to-ts-zod";

export const metadata: Metadata = {
  title: "JSON to TypeScript / Zod Schema Generator — Tools",
  description: "Paste sample JSON and generate a matching TypeScript interface or Zod schema in your browser, with array and optional-field inference.",
};

export default function JsonToTsZodPage() {
  return <JsonToTsZod />;
}
