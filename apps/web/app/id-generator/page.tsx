import type { Metadata } from "next";
import { IdGenerator } from "./id-generator";

export const metadata: Metadata = {
  title: "ID Generator — Tools",
  description: "Generate a batch of UUID v4/v7, ULID, or nanoid identifiers and export them as CSV or JSON.",
};

export default function IdGeneratorPage() {
  return <IdGenerator />;
}
