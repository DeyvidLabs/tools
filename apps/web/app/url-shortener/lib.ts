export interface ShortLink {
  id: string;
  code: string;
  targetUrl: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface CreateShortLinkResponse extends ShortLink {
  deleteToken: string;
}

export type ShortLinkExpiration = "1h" | "1d" | "1w" | "1m";

export interface CreateShortLinkInput {
  targetUrl: string;
  expiresIn: ShortLinkExpiration;
}

// "never" is intentionally left out — it's only reachable by calling the API
// directly with a URL_SHORTENER_ADMIN_TOKEN header, never as a UI toggle.
export const EXPIRATION_OPTIONS: { value: ShortLinkExpiration; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "1d", label: "1 day" },
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
];

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function createShortLink(input: CreateShortLinkInput): Promise<CreateShortLinkResponse> {
  const res = await fetch("/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<CreateShortLinkResponse>(res);
}

export async function fetchShortLink(code: string): Promise<ShortLink | null> {
  const res = await fetch(`/api/shorten/${code}`);
  if (res.status === 404) return null;
  return parseJsonOrThrow<ShortLink>(res);
}

export async function deleteShortLink(code: string, deleteToken: string): Promise<boolean> {
  const res = await fetch(`/api/shorten/${code}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleteToken }),
  });
  if (res.status === 403 || res.status === 404) return false;
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return true;
}

// Spells out the month (dateStyle: "medium") instead of using digits, so
// the date reads unambiguously regardless of whether the browser's locale
// orders day/month as DD/MM or MM/DD — same convention as pastebin's and
// jwt-debugger's date formatters.
export function formatExpiry(expiresAt: string | null, now: number = Date.now()): string {
  if (expiresAt === null) return "Never expires";
  const date = new Date(expiresAt);
  if (date.getTime() <= now) return "Expired";
  return `Expires ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)}`;
}
