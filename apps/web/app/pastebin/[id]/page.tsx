import type { Metadata } from "next";
import { PastebinView } from "./pastebin-view";

export const metadata: Metadata = {
  title: "Paste — Tools",
  description: "View a shared paste.",
};

export default async function PastebinViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PastebinView id={id} />;
}
