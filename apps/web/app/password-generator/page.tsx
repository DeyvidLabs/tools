import type { Metadata } from "next";
import { PasswordGenerator } from "./generator";

export const metadata: Metadata = {
  title: "Password Generator — Tools",
  description:
    "Generate cryptographically secure passwords entirely in your browser, with the Web Crypto API. Nothing is sent to a server.",
};

export default function PasswordGeneratorPage() {
  return <PasswordGenerator />;
}
