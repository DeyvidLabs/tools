import type { Metadata } from "next";
import { Pastebin } from "./pastebin";

export const metadata: Metadata = {
  title: "Pastebin — Tools",
  description: "Share a snippet of text via a link. Expires automatically; delete it early with your token.",
};

export default function PastebinPage() {
  return <Pastebin />;
}
