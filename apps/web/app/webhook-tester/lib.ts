export interface WebhookBin {
  id: string;
  expiresAt: string;
  createdAt: string;
}

export interface CapturedRequest {
  id: string;
  method: string;
  headers: Record<string, string | string[]>;
  query: Record<string, unknown>;
  contentType: string | null;
  body: string | null;
  bodyEncoding: "utf8" | "base64";
  sourceIp: string | null;
  receivedAt: string;
}

export const LOCAL_STORAGE_BIN_KEY = "webhook-tester:binId";
export const POLL_INTERVAL_MS = 3000;

export function buildCaptureUrl(origin: string, binId: string): string {
  return `${origin}/api/webhook/capture/${binId}`;
}

// Decoded/pretty-printed body for display. Base64 bodies are flagged rather
// than decoded to text (they're binary — showing raw bytes wouldn't help).
export function displayBody(request: CapturedRequest): {
  text: string;
  isBinary: boolean;
} {
  if (request.body === null) return { text: "(no body)", isBinary: false };
  if (request.bodyEncoding === "base64") {
    return { text: "(binary body, base64-encoded)", isBinary: true };
  }
  if (request.contentType?.includes("json")) {
    try {
      return { text: JSON.stringify(JSON.parse(request.body), null, 2), isBinary: false };
    } catch {
      // Not actually valid JSON despite the content-type — fall through to raw text.
    }
  }
  return { text: request.body, isBinary: false };
}

// Requests are append-only/trim-only (never edited in place), so comparing
// ids is enough to detect "nothing new" — lets the poller skip a re-render
// (and re-parsing every body/header blob) when a tick brings back the same list.
export function sameRequestIds(a: CapturedRequest[], b: CapturedRequest[]): boolean {
  return a.length === b.length && a.every((r, i) => r.id === b[i]?.id);
}

// Spells out the month (dateStyle: "medium") instead of using digits, so
// the date reads unambiguously regardless of whether the browser's locale
// orders day/month as DD/MM or MM/DD.
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(
    new Date(iso),
  );
}

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const deltaMs = now - new Date(iso).getTime();
  const seconds = Math.round(deltaMs / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function createBin(): Promise<WebhookBin> {
  const res = await fetch("/api/webhook/bins", { method: "POST" });
  return parseJsonOrThrow<WebhookBin>(res);
}

export async function fetchBin(id: string): Promise<WebhookBin | null> {
  const res = await fetch(`/api/webhook/bins/${id}`);
  if (res.status === 404) return null;
  return parseJsonOrThrow<WebhookBin>(res);
}

export async function fetchRequests(id: string): Promise<CapturedRequest[]> {
  const res = await fetch(`/api/webhook/bins/${id}/requests`);
  return parseJsonOrThrow<CapturedRequest[]>(res);
}
