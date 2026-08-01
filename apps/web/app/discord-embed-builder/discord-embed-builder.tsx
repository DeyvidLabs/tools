"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_EMBED,
  LIMITS,
  buildPayload,
  isDiscordWebhookUrl,
  sendToWebhook,
  totalCharacterCount,
  type EmbedData,
  type EmbedField,
} from "./lib";

const inputClass =
  "min-w-0 flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground placeholder:text-muted-foreground disabled:opacity-60";
const labelClass = "text-xs font-medium text-muted-foreground";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelClass}>
        {label}
        {hint && <span className="ml-1 text-muted-foreground/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function DiscordEmbedBuilder() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [embed, setEmbed] = useState<EmbedData>(DEFAULT_EMBED);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const payload = useMemo(
    () => buildPayload({ content, username, avatarUrl, embed }),
    [content, username, avatarUrl, embed],
  );
  const charCount = useMemo(() => totalCharacterCount(embed), [embed]);
  const overLimit = charCount > LIMITS.total;

  const updateEmbed = (patch: Partial<EmbedData>) => setEmbed((prev) => ({ ...prev, ...patch }));

  const updateField = (index: number, patch: Partial<EmbedField>) => {
    updateEmbed({
      fields: embed.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    });
  };

  const addField = () => {
    if (embed.fields.length >= LIMITS.fieldCount) return;
    updateEmbed({ fields: [...embed.fields, { name: "", value: "", inline: false }] });
  };

  const removeField = (index: number) => {
    updateEmbed({ fields: embed.fields.filter((_, i) => i !== index) });
  };

  const handleSend = async () => {
    setSending(true);
    setSendResult(null);
    const result = await sendToWebhook(webhookUrl, payload);
    setSendResult(
      result.ok
        ? { ok: true, message: "Sent — check your Discord channel." }
        : { ok: false, message: result.error ?? `Failed (HTTP ${result.status ?? "?"})` },
    );
    setSending(false);
  };

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const canSend = isDiscordWebhookUrl(webhookUrl) && !overLimit && !sending;

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-5xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          Discord Embed Builder
        </h1>
        <p className="mt-2 text-muted-foreground">
          Build a Discord embed with a live preview, then send it straight to your own webhook
          or copy the raw JSON payload for your own bot/integration.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-border bg-card/70 p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Webhook</h2>
              <div className="mt-3 flex flex-col gap-3">
                <Field label="Webhook URL">
                  <input
                    className={inputClass}
                    placeholder="https://discord.com/api/webhooks/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </Field>
                <div className="flex gap-3">
                  <Field label="Username override" hint="(optional)">
                    <input
                      className={inputClass}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </Field>
                  <Field label="Avatar URL override" hint="(optional)">
                    <input
                      className={inputClass}
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Message content" hint="(optional, shown above the embed)">
                  <textarea
                    className={`${inputClass} min-h-16 resize-y`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card/70 p-5">
              <h2 className="text-sm font-semibold text-card-foreground">Embed</h2>
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex gap-3">
                  <Field label="Title" hint={`(${embed.title.length}/${LIMITS.title})`}>
                    <input
                      className={inputClass}
                      maxLength={LIMITS.title}
                      value={embed.title}
                      onChange={(e) => updateEmbed({ title: e.target.value })}
                    />
                  </Field>
                  <Field label="Color">
                    <input
                      type="color"
                      className="h-9 w-14 shrink-0 rounded-md border border-border bg-secondary p-1"
                      value={embed.color}
                      onChange={(e) => updateEmbed({ color: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Title URL" hint="(optional, makes the title a link)">
                  <input
                    className={inputClass}
                    value={embed.url}
                    onChange={(e) => updateEmbed({ url: e.target.value })}
                  />
                </Field>
                <Field
                  label="Description"
                  hint={`(${embed.description.length}/${LIMITS.description})`}
                >
                  <textarea
                    className={`${inputClass} min-h-24 resize-y`}
                    maxLength={LIMITS.description}
                    value={embed.description}
                    onChange={(e) => updateEmbed({ description: e.target.value })}
                  />
                </Field>

                <div className="flex gap-3">
                  <Field label="Author name">
                    <input
                      className={inputClass}
                      maxLength={LIMITS.authorName}
                      value={embed.author.name}
                      onChange={(e) => updateEmbed({ author: { ...embed.author, name: e.target.value } })}
                    />
                  </Field>
                  <Field label="Author icon URL">
                    <input
                      className={inputClass}
                      value={embed.author.iconUrl}
                      onChange={(e) =>
                        updateEmbed({ author: { ...embed.author, iconUrl: e.target.value } })
                      }
                    />
                  </Field>
                </div>

                <div className="flex gap-3">
                  <Field label="Image URL">
                    <input
                      className={inputClass}
                      value={embed.imageUrl}
                      onChange={(e) => updateEmbed({ imageUrl: e.target.value })}
                    />
                  </Field>
                  <Field label="Thumbnail URL">
                    <input
                      className={inputClass}
                      value={embed.thumbnailUrl}
                      onChange={(e) => updateEmbed({ thumbnailUrl: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="flex gap-3">
                  <Field label="Footer text" hint={`(${embed.footer.text.length}/${LIMITS.footerText})`}>
                    <input
                      className={inputClass}
                      maxLength={LIMITS.footerText}
                      value={embed.footer.text}
                      onChange={(e) => updateEmbed({ footer: { ...embed.footer, text: e.target.value } })}
                    />
                  </Field>
                  <Field label="Footer icon URL">
                    <input
                      className={inputClass}
                      value={embed.footer.iconUrl}
                      onChange={(e) =>
                        updateEmbed({ footer: { ...embed.footer, iconUrl: e.target.value } })
                      }
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-sm text-card-foreground">
                  <input
                    type="checkbox"
                    checked={embed.timestamp}
                    onChange={(e) => updateEmbed({ timestamp: e.target.checked })}
                  />
                  Add current timestamp
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card/70 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-card-foreground">
                  Fields ({embed.fields.length}/{LIMITS.fieldCount})
                </h2>
                <button
                  type="button"
                  onClick={addField}
                  disabled={embed.fields.length >= LIMITS.fieldCount}
                  className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                >
                  + Add field
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {embed.fields.map((field, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    <div className="flex gap-2">
                      <input
                        className={inputClass}
                        placeholder="Name"
                        maxLength={LIMITS.fieldName}
                        value={field.name}
                        onChange={(e) => updateField(i, { name: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => removeField(i)}
                        className="shrink-0 rounded-md border border-border px-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      className={`${inputClass} mt-2 min-h-12 resize-y`}
                      placeholder="Value"
                      maxLength={LIMITS.fieldValue}
                      value={field.value}
                      onChange={(e) => updateField(i, { value: e.target.value })}
                    />
                    <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={field.inline}
                        onChange={(e) => updateField(i, { inline: e.target.checked })}
                      />
                      Inline
                    </label>
                  </div>
                ))}
                {embed.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">No fields yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Preview + actions */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <DiscordPreview content={content} username={username} avatarUrl={avatarUrl} embed={embed} />

            <div className="rounded-lg border border-border bg-card/70 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className={overLimit ? "font-medium text-accent-rose" : "text-muted-foreground"}>
                  {charCount}/{LIMITS.total} characters
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send to webhook"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="rounded-md border border-border px-4 py-1.5 text-sm text-card-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {copied ? "Copied!" : "Copy JSON payload"}
                </button>
              </div>
              {webhookUrl && !isDiscordWebhookUrl(webhookUrl) && (
                <p className="mt-2 text-xs text-accent-rose">
                  That doesn&apos;t look like a Discord webhook URL.
                </p>
              )}
              {sendResult && (
                <p
                  className={`mt-2 text-xs ${sendResult.ok ? "text-muted-foreground" : "text-accent-rose"}`}
                >
                  {sendResult.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Deliberately styled with Discord's own fixed dark palette (not the site's
// theme vars) — this needs to resemble what actually renders in Discord's
// client, which is dark-themed regardless of the visitor's OS preference.
function DiscordPreview({
  content,
  username,
  avatarUrl,
  embed,
}: {
  content: string;
  username: string;
  avatarUrl: string;
  embed: EmbedData;
}) {
  const hasEmbedContent =
    embed.title ||
    embed.description ||
    embed.author.name ||
    embed.footer.text ||
    embed.imageUrl ||
    embed.thumbnailUrl ||
    embed.fields.length > 0;

  return (
    <div className="rounded-lg bg-[#313338] p-4">
      <p className="mb-2 text-xs font-medium text-[#949ba4]">Preview</p>
      <div className="flex gap-3">
        <img
          src={avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png"}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-white">{username || "Webhook"}</span>
            <span className="text-[10px] text-[#949ba4]">Today at 12:00</span>
          </div>
          {content && (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-[#dbdee1]">
              {content}
            </p>
          )}
          {hasEmbedContent && (
            <div
              className="relative mt-1 max-w-md rounded border-l-4 bg-[#2b2d31] p-3"
              style={{ borderColor: embed.color || "#4e5058" }}
            >
              {embed.author.name && (
                <div className="mb-1 flex items-center gap-2">
                  {embed.author.iconUrl && (
                    <img src={embed.author.iconUrl} alt="" className="h-5 w-5 rounded-full" />
                  )}
                  <span className="text-xs font-medium text-white">{embed.author.name}</span>
                </div>
              )}
              {embed.title && (
                <p className="text-sm font-semibold text-white break-words">{embed.title}</p>
              )}
              {embed.description && (
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#dbdee1]">
                  {embed.description}
                </p>
              )}
              {embed.fields.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {embed.fields.map((f, i) => (
                    <div
                      key={i}
                      className={f.inline ? "col-span-1" : "col-span-2"}
                    >
                      <p className="text-xs font-semibold text-white break-words">{f.name}</p>
                      <p className="text-xs whitespace-pre-wrap break-words text-[#dbdee1]">
                        {f.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {embed.imageUrl && (
                <img src={embed.imageUrl} alt="" className="mt-2 max-h-64 rounded object-cover" />
              )}
              {embed.thumbnailUrl && (
                <img
                  src={embed.thumbnailUrl}
                  alt=""
                  className="absolute right-3 top-3 h-16 w-16 rounded object-cover"
                />
              )}
              {embed.footer.text && (
                <div className="mt-2 flex items-center gap-2">
                  {embed.footer.iconUrl && (
                    <img src={embed.footer.iconUrl} alt="" className="h-4 w-4 rounded-full" />
                  )}
                  <span className="text-xs text-[#949ba4]">{embed.footer.text}</span>
                </div>
              )}
            </div>
          )}
          {!content && !hasEmbedContent && (
            <p className="mt-0.5 text-sm text-[#949ba4]">Nothing to preview yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
