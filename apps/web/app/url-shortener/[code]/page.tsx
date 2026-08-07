import type { Metadata } from "next";
import { ShortLinkView } from "./short-link-view";

export const metadata: Metadata = {
  title: "Short link — Tools",
  description: "View a short link's details.",
};

export default async function ShortLinkViewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ShortLinkView code={code} />;
}
