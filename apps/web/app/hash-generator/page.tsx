import type { Metadata } from "next";
import { HashGenerator } from "./hash-generator";

export const metadata: Metadata = {
  title: "Hash Generator — Tools",
  description: "Hash text or files with MD5, SHA-1, SHA-256, or SHA-512 — entirely in your browser.",
};

export default function HashGeneratorPage() {
  return <HashGenerator />;
}
