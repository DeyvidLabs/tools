import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMBED,
  LIMITS,
  buildPayload,
  hexToDecimalColor,
  isDiscordWebhookUrl,
  totalCharacterCount,
  type EmbedData,
} from "./lib";

describe("hexToDecimalColor", () => {
  it("converts a hex color to its decimal equivalent", () => {
    expect(hexToDecimalColor("#b03a2e")).toBe(0xb03a2e);
    expect(hexToDecimalColor("ffffff")).toBe(0xffffff);
    expect(hexToDecimalColor("#000000")).toBe(0);
  });

  it("returns null for malformed input", () => {
    expect(hexToDecimalColor("not-a-color")).toBeNull();
    expect(hexToDecimalColor("#fff")).toBeNull();
    expect(hexToDecimalColor("")).toBeNull();
  });
});

describe("totalCharacterCount", () => {
  it("sums every character-limited string in the embed", () => {
    const embed: EmbedData = {
      ...DEFAULT_EMBED,
      title: "abc",
      description: "defgh",
      footer: { text: "ij", iconUrl: "" },
      author: { name: "kl", url: "", iconUrl: "" },
      fields: [{ name: "m", value: "no", inline: false }],
    };
    expect(totalCharacterCount(embed)).toBe(3 + 5 + 2 + 2 + 1 + 2);
  });

  it("is zero for a blank embed", () => {
    expect(totalCharacterCount(DEFAULT_EMBED)).toBe(0);
  });
});

describe("buildPayload", () => {
  it("omits empty top-level fields", () => {
    const payload = buildPayload({
      content: "",
      username: "",
      avatarUrl: "",
      embed: DEFAULT_EMBED,
    });
    expect(payload).not.toHaveProperty("content");
    expect(payload).not.toHaveProperty("username");
    expect(payload).not.toHaveProperty("avatar_url");
    expect(payload).not.toHaveProperty("embeds");
  });

  it("includes content/username/avatar_url when set", () => {
    const payload = buildPayload({
      content: "hello",
      username: "Bot",
      avatarUrl: "https://example.com/a.png",
      embed: DEFAULT_EMBED,
    });
    expect(payload).toMatchObject({
      content: "hello",
      username: "Bot",
      avatar_url: "https://example.com/a.png",
    });
  });

  it("builds a full embed with color, author, footer, image, thumbnail and fields", () => {
    const embed: EmbedData = {
      title: "Title",
      description: "Desc",
      url: "https://example.com",
      color: "#ff0000",
      timestamp: false,
      author: { name: "Author", url: "https://a.com", iconUrl: "https://a.com/i.png" },
      footer: { text: "Footer", iconUrl: "https://f.com/i.png" },
      imageUrl: "https://example.com/img.png",
      thumbnailUrl: "https://example.com/thumb.png",
      fields: [{ name: "Field", value: "Value", inline: true }],
    };
    const payload = buildPayload({ content: "", username: "", avatarUrl: "", embed });
    expect(payload.embeds).toEqual([
      {
        title: "Title",
        description: "Desc",
        url: "https://example.com",
        color: 0xff0000,
        author: { name: "Author", url: "https://a.com", icon_url: "https://a.com/i.png" },
        footer: { text: "Footer", icon_url: "https://f.com/i.png" },
        image: { url: "https://example.com/img.png" },
        thumbnail: { url: "https://example.com/thumb.png" },
        fields: [{ name: "Field", value: "Value", inline: true }],
      },
    ]);
  });

  it("stamps the current time as an ISO timestamp when timestamp is enabled", () => {
    const payload = buildPayload({
      content: "",
      username: "",
      avatarUrl: "",
      embed: { ...DEFAULT_EMBED, title: "x", timestamp: true },
    });
    const embeds = payload.embeds as Record<string, unknown>[];
    expect(typeof embeds[0].timestamp).toBe("string");
    expect(new Date(embeds[0].timestamp as string).toString()).not.toBe("Invalid Date");
  });

  it("drops embeds entirely when every embed field is blank", () => {
    const payload = buildPayload({
      content: "just text",
      username: "",
      avatarUrl: "",
      embed: DEFAULT_EMBED,
    });
    expect(payload).not.toHaveProperty("embeds");
    expect(payload.content).toBe("just text");
  });
});

describe("isDiscordWebhookUrl", () => {
  it("accepts a well-formed discord.com webhook URL", () => {
    expect(
      isDiscordWebhookUrl("https://discord.com/api/webhooks/123456789/abcDEF-token"),
    ).toBe(true);
  });

  it("accepts the legacy discordapp.com host", () => {
    expect(
      isDiscordWebhookUrl("https://discordapp.com/api/webhooks/123456789/abcDEF-token"),
    ).toBe(true);
  });

  it("rejects non-Discord URLs", () => {
    expect(isDiscordWebhookUrl("https://example.com/api/webhooks/123/abc")).toBe(false);
    expect(isDiscordWebhookUrl("not a url")).toBe(false);
    expect(isDiscordWebhookUrl("")).toBe(false);
  });
});

describe("LIMITS", () => {
  it("matches Discord's documented embed limits", () => {
    expect(LIMITS).toEqual({
      title: 256,
      description: 4096,
      fieldName: 256,
      fieldValue: 1024,
      footerText: 2048,
      authorName: 256,
      fieldCount: 25,
      total: 6000,
    });
  });
});
