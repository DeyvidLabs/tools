export interface SystemEvent {
  __type: "system";
  event: "joined" | "left";
  room: string | null;
  participants: number;
}

export interface LogEntry {
  id: string;
  direction: "sent" | "received" | "system";
  text: string;
  isBinary: boolean;
  timestamp: string;
}

const WS_PATH = "/api/ws-tester";

export function buildWsUrl(origin: string, room: string): string {
  const wsOrigin = origin.replace(/^http/, "ws");
  const trimmedRoom = room.trim();
  return trimmedRoom
    ? `${wsOrigin}${WS_PATH}?room=${encodeURIComponent(trimmedRoom)}`
    : `${wsOrigin}${WS_PATH}`;
}

// Distinguishes a real ws-tester system envelope from an ordinary message
// that just happens to parse as JSON (e.g. a room-mate testing their own
// JSON payloads) — only a genuine `__type: "system"` match counts.
export function parseSystemEvent(raw: string): SystemEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    (parsed as { __type?: unknown }).__type === "system"
  ) {
    return parsed as SystemEvent;
  }
  return null;
}

export function describeSystemEvent(event: SystemEvent): string {
  const who = event.event === "joined" ? "joined" : "left";
  const where = event.room ? `room "${event.room}"` : "echo mode";
  return `A participant ${who} ${where} — ${event.participants} connected now.`;
}

export function generateRoomId(): string {
  return crypto.randomUUID().slice(0, 8);
}
