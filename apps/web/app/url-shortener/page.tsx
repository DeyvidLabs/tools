import type { Metadata } from "next";
import { UrlShortener } from "./url-shortener";

export const metadata: Metadata = {
  title: "URL Shortener — Tools",
  description: "Turn a long URL into a short self-hosted link. Expires automatically.",
};

export default function UrlShortenerPage() {
  return <UrlShortener />;
}
