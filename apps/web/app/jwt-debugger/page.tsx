import type { Metadata } from "next";
import { JwtDebugger } from "./jwt-debugger";

export const metadata: Metadata = {
  title: "JWT Debugger — Tools",
  description:
    "Decode a JSON Web Token's header and payload and check its expiration, entirely in your browser.",
};

export default function JwtDebuggerPage() {
  return <JwtDebugger />;
}
