export interface Paste {
  id: string;
  title: string | null;
  content: string;
  language: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface CreatePasteResponse extends Paste {
  deleteToken: string;
}

export type PasteExpiration = "1h" | "1d" | "1w" | "1m";

export interface CreatePasteInput {
  content: string;
  title?: string;
  language?: string;
  expiresIn: PasteExpiration;
}

// "never" is intentionally left out — it's only reachable by calling the API
// directly with a PASTE_ADMIN_TOKEN header, never as a UI toggle.
export const EXPIRATION_OPTIONS: { value: PasteExpiration; label: string }[] = [
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

export async function createPaste(input: CreatePasteInput): Promise<CreatePasteResponse> {
  const res = await fetch("/api/paste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<CreatePasteResponse>(res);
}

export async function fetchPaste(id: string): Promise<Paste | null> {
  const res = await fetch(`/api/paste/${id}`);
  if (res.status === 404) return null;
  return parseJsonOrThrow<Paste>(res);
}

export async function deletePaste(id: string, deleteToken: string): Promise<boolean> {
  const res = await fetch(`/api/paste/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleteToken }),
  });
  if (res.status === 403 || res.status === 404) return false;
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return true;
}

export function formatExpiry(expiresAt: string | null, now: number = Date.now()): string {
  if (expiresAt === null) return "Never expires";
  const deltaMs = new Date(expiresAt).getTime() - now;
  if (deltaMs <= 0) return "Expired";

  const minutes = Math.round(deltaMs / 60_000);
  if (minutes < 60) return `Expires in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Expires in ${hours}h`;
  const days = Math.round(hours / 24);
  return `Expires in ${days}d`;
}
