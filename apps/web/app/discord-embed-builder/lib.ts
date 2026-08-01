export interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedAuthor {
  name: string;
  url: string;
  iconUrl: string;
}

export interface EmbedFooter {
  text: string;
  iconUrl: string;
}

export interface EmbedData {
  title: string;
  description: string;
  url: string;
  color: string; // hex, e.g. "#b03a2e"
  timestamp: boolean;
  author: EmbedAuthor;
  footer: EmbedFooter;
  imageUrl: string;
  thumbnailUrl: string;
  fields: EmbedField[];
}

export const DEFAULT_EMBED: EmbedData = {
  title: "",
  description: "",
  url: "",
  color: "#b03a2e",
  timestamp: false,
  author: { name: "", url: "", iconUrl: "" },
  footer: { text: "", iconUrl: "" },
  imageUrl: "",
  thumbnailUrl: "",
  fields: [],
};

// Discord's documented embed limits (https://discord.com/developers/docs/resources/message#embed-object-embed-limits).
export const LIMITS = {
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  fieldCount: 25,
  total: 6000,
} as const;

export function hexToDecimalColor(hex: string): number | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;
  return parseInt(match[1], 16);
}

// Sum of every character-limited string in the embed, per Discord's combined
// 6000-character cap across title/description/fields/footer/author.
export function totalCharacterCount(embed: EmbedData): number {
  return (
    embed.title.length +
    embed.description.length +
    embed.footer.text.length +
    embed.author.name.length +
    embed.fields.reduce((sum, f) => sum + f.name.length + f.value.length, 0)
  );
}

function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== "" && value !== undefined) result[key] = value;
  }
  return result;
}

// Builds the exact JSON body Discord's webhook API expects, dropping any
// field left blank rather than sending empty strings (Discord rejects some
// of those, e.g. an empty embed `title`).
export function buildPayload(params: {
  content: string;
  username: string;
  avatarUrl: string;
  embed: EmbedData;
}): Record<string, unknown> {
  const { content, username, avatarUrl, embed } = params;

  const author = omitEmpty({
    name: embed.author.name,
    url: embed.author.url,
    icon_url: embed.author.iconUrl,
  });
  const footer = omitEmpty({
    text: embed.footer.text,
    icon_url: embed.footer.iconUrl,
  });
  const color = hexToDecimalColor(embed.color);

  const embedPayload: Record<string, unknown> = {
    ...omitEmpty({
      title: embed.title,
      description: embed.description,
      url: embed.url,
    }),
    ...(color !== null ? { color } : {}),
    ...(embed.timestamp ? { timestamp: new Date().toISOString() } : {}),
    ...(Object.keys(author).length > 0 ? { author } : {}),
    ...(Object.keys(footer).length > 0 ? { footer } : {}),
    ...(embed.imageUrl ? { image: { url: embed.imageUrl } } : {}),
    ...(embed.thumbnailUrl ? { thumbnail: { url: embed.thumbnailUrl } } : {}),
    ...(embed.fields.length > 0
      ? {
          fields: embed.fields.map((f) => ({
            name: f.name,
            value: f.value,
            inline: f.inline,
          })),
        }
      : {}),
  };

  // color/timestamp alone don't count as "content" — every embed carries a
  // default color, so keying emptiness off the full payload would always
  // treat the embed as non-blank and send a content-free box to Discord.
  const isEmbedEmpty =
    !embed.title &&
    !embed.description &&
    !embed.url &&
    Object.keys(author).length === 0 &&
    Object.keys(footer).length === 0 &&
    !embed.imageUrl &&
    !embed.thumbnailUrl &&
    embed.fields.length === 0;

  return {
    ...omitEmpty({ content, username, avatar_url: avatarUrl }),
    ...(isEmbedEmpty ? {} : { embeds: [embedPayload] }),
  };
}

export interface SendResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export async function sendToWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>,
): Promise<SendResult> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: body || `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status };
  } catch {
    // Most commonly a network error or the webhook host rejecting the CORS
    // preflight — Discord's webhook endpoint itself allows browser POSTs,
    // but a mistyped/non-Discord URL won't.
    return { ok: false, error: "Request failed — check the webhook URL and your connection." };
  }
}

export function isDiscordWebhookUrl(url: string): boolean {
  return /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/.+/.test(url.trim());
}
