export interface MockEndpoint {
  id: string;
  createdAt: string;
  expiresAt: string;
  statusCode: number;
  responseBody: unknown;
  responseHeaders: Record<string, string>;
  delayMs: number;
}

export interface CreateMockEndpointInput {
  statusCode: number;
  responseBody?: unknown;
  responseHeaders: Record<string, string>;
  delayMs: number;
}

export interface CreateMockEndpointResponse extends MockEndpoint {
  deleteToken: string;
}

export interface HeaderRow {
  key: string;
  value: string;
}

export const MIN_STATUS_CODE = 100;
export const MAX_STATUS_CODE = 599;
export const MAX_DELAY_MS = 30_000;

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function createMockEndpoint(
  input: CreateMockEndpointInput,
): Promise<CreateMockEndpointResponse> {
  const res = await fetch("/api/mock/endpoints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<CreateMockEndpointResponse>(res);
}

export async function fetchMockEndpoint(id: string): Promise<MockEndpoint | null> {
  const res = await fetch(`/api/mock/endpoints/${id}`);
  if (res.status === 404) return null;
  return parseJsonOrThrow<MockEndpoint>(res);
}

export async function deleteMockEndpoint(id: string, deleteToken: string): Promise<boolean> {
  const res = await fetch(`/api/mock/endpoints/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleteToken }),
  });
  if (res.status === 403 || res.status === 404) return false;
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return true;
}

// Blank key rows are dropped rather than rejected — the form always keeps a
// trailing empty row open for the next entry (see addHeaderRow), so most
// submits carry at least one.
export function headerRowsToRecord(rows: HeaderRow[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { key, value } of rows) {
    const trimmedKey = key.trim();
    if (trimmedKey === "") continue;
    result[trimmedKey] = value;
  }
  return result;
}

// Empty input means "no body" (undefined, distinct from JSON null). Invalid
// JSON throws SyntaxError — callers catch it and surface a form error.
export function parseResponseBody(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  return JSON.parse(trimmed);
}

// Spells out the month (dateStyle: "medium") instead of using digits, so
// the date reads unambiguously regardless of whether the browser's locale
// orders day/month as DD/MM or MM/DD — same convention as pastebin's and
// url-shortener's date formatters.
export function formatExpiry(expiresAt: string, now: number = Date.now()): string {
  const date = new Date(expiresAt);
  if (date.getTime() <= now) return "Expired";
  return `Expires ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)}`;
}
