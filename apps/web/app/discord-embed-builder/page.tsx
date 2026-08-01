import type { Metadata } from "next";
import { DiscordEmbedBuilder } from "./discord-embed-builder";

export const metadata: Metadata = {
  title: "Discord Embed Builder — Tools",
  description:
    "Build a Discord embed with a live preview, send it to your own webhook, or copy the raw JSON payload.",
};

export default function DiscordEmbedBuilderPage() {
  return <DiscordEmbedBuilder />;
}
