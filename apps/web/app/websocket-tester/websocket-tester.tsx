"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  buildWsUrl,
  describeSystemEvent,
  generateRoomId,
  parseSystemEvent,
  type LogEntry,
} from "./lib";

type Status = "idle" | "connecting" | "open" | "closed" | "error";

const STATUS_LABEL: Record<Status, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  open: "Connected",
  closed: "Disconnected",
  error: "Connection error",
};

const STATUS_COLOR: Record<Status, string> = {
  idle: "var(--muted-foreground)",
  connecting: "var(--accent-amber)",
  open: "var(--primary)",
  closed: "var(--muted-foreground)",
  error: "var(--accent-rose)",
};

function newEntry(direction: LogEntry["direction"], text: string, isBinary = false): LogEntry {
  return { id: crypto.randomUUID(), direction, text, isBinary, timestamp: new Date().toISOString() };
}

export function WebSocketTester() {
  const [room, setRoom] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const wsUrl = buildWsUrl(origin, room);

  const connect = useCallback(() => {
    setStatus("connecting");
    setLog([]);
    const ws = new WebSocket(buildWsUrl(window.location.origin, room));
    wsRef.current = ws;

    ws.onopen = () => setStatus("open");
    ws.onclose = () => setStatus((s) => (s === "error" ? s : "closed"));
    ws.onerror = () => setStatus("error");
    ws.onmessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data !== "string") {
        setLog((prev) => [...prev, newEntry("received", "(binary frame)", true)]);
        return;
      }
      const sysEvent = parseSystemEvent(event.data);
      setLog((prev) => [
        ...prev,
        sysEvent
          ? newEntry("system", describeSystemEvent(sysEvent))
          : newEntry("received", event.data as string),
      ]);
    };
  }, [room]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [log]);

  const handleSend = () => {
    if (!message.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(message);
    setLog((prev) => [...prev, newEntry("sent", message)]);
    setMessage("");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(wsUrl);
    setCopied(true);
  };

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const connected = status === "open";
  const busy = status === "connecting";

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          WebSocket Tester
        </h1>
        <p className="mt-2 text-muted-foreground">
          Connect to a raw WebSocket echo/relay. Leave the room blank for echo mode, or set a
          room id and share the URL with another device to test relay.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Requires the self-host deployment — persistent WebSockets don&apos;t work on a Vercel
          preview.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              disabled={connected || busy}
              placeholder="Room (optional — blank = echo mode)"
              className="min-w-0 flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setRoom(generateRoomId())}
              disabled={connected || busy}
              className="shrink-0 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
            >
              Generate
            </button>
          </div>

          <div className="mt-3 flex items-start gap-2">
            <output
              aria-label="WebSocket URL"
              className="min-w-0 flex-1 break-all rounded-md border border-border bg-secondary px-3 py-2 font-mono text-xs text-secondary-foreground"
            >
              {wsUrl}
            </output>
            <button
              type="button"
              onClick={() => void handleCopy()}
              title="Copy WebSocket URL"
              aria-label="Copy WebSocket URL"
              className="shrink-0 rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[status] }}
                aria-hidden="true"
              />
              <span style={{ color: STATUS_COLOR[status] }}>{STATUS_LABEL[status]}</span>
            </div>
            {connected ? (
              <button
                type="button"
                onClick={disconnect}
                className="rounded-md border border-border px-4 py-1.5 text-sm text-card-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={connect}
                disabled={busy}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
              >
                Connect
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card/70 backdrop-blur-sm">
          <div className="max-h-96 space-y-2 overflow-y-auto p-4">
            {log.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                {connected ? "Connected — send a message below." : "Connect to start."}
              </p>
            ) : (
              log.map((entry) => <LogRow key={entry.id} entry={entry} />)
            )}
            <div ref={logEndRef} />
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={!connected}
              placeholder="Type a message…"
              className="min-w-0 flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!connected || !message.trim()}
              className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// No backdrop-blur here — this renders once per log entry in a scrolling
// list; see the two static cards above for where that effect is affordable.
function LogRow({ entry }: { entry: LogEntry }) {
  if (entry.direction === "system") {
    return (
      <p className="text-center text-xs text-muted-foreground">{entry.text}</p>
    );
  }

  const isSent = entry.direction === "sent";
  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg border px-3 py-2 text-sm break-words ${
          isSent
            ? "border-primary/30 bg-primary/10 text-card-foreground"
            : "border-border bg-secondary text-secondary-foreground"
        }`}
      >
        <p className="font-mono">{entry.text}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {isSent ? "sent" : "received"} ·{" "}
          {new Date(entry.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
