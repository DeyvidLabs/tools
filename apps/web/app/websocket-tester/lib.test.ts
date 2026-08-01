import { describe, expect, it } from "vitest";
import {
  buildWsUrl,
  describeSystemEvent,
  generateRoomId,
  parseSystemEvent,
} from "./lib";

describe("buildWsUrl", () => {
  it("converts https to wss and appends the gateway path", () => {
    expect(buildWsUrl("https://tools.example", "")).toBe(
      "wss://tools.example/api/ws-tester",
    );
  });

  it("converts http to ws", () => {
    expect(buildWsUrl("http://localhost:8090", "")).toBe(
      "ws://localhost:8090/api/ws-tester",
    );
  });

  it("appends an encoded room query param when a room is given", () => {
    expect(buildWsUrl("https://tools.example", "my room")).toBe(
      "wss://tools.example/api/ws-tester?room=my%20room",
    );
  });

  it("treats a whitespace-only room the same as no room", () => {
    expect(buildWsUrl("https://tools.example", "   ")).toBe(
      "wss://tools.example/api/ws-tester",
    );
  });
});

describe("parseSystemEvent", () => {
  it("recognizes a real system envelope", () => {
    const raw = JSON.stringify({
      __type: "system",
      event: "joined",
      room: "abc",
      participants: 2,
    });
    expect(parseSystemEvent(raw)).toEqual({
      __type: "system",
      event: "joined",
      room: "abc",
      participants: 2,
    });
  });

  it("returns null for JSON that isn't a system envelope", () => {
    expect(parseSystemEvent('{"hello":"world"}')).toBeNull();
  });

  it("returns null for non-JSON text", () => {
    expect(parseSystemEvent("just some text")).toBeNull();
  });

  it("returns null for a JSON array", () => {
    expect(parseSystemEvent("[1,2,3]")).toBeNull();
  });
});

describe("describeSystemEvent", () => {
  it("describes a join in a named room", () => {
    const text = describeSystemEvent({
      __type: "system",
      event: "joined",
      room: "demo",
      participants: 3,
    });
    expect(text).toContain("joined");
    expect(text).toContain('room "demo"');
    expect(text).toContain("3 connected now");
  });

  it("describes echo mode when there is no room", () => {
    const text = describeSystemEvent({
      __type: "system",
      event: "joined",
      room: null,
      participants: 1,
    });
    expect(text).toContain("echo mode");
  });

  it("describes a departure", () => {
    const text = describeSystemEvent({
      __type: "system",
      event: "left",
      room: "demo",
      participants: 1,
    });
    expect(text).toContain("left");
  });
});

describe("generateRoomId", () => {
  it("returns a short non-empty id", () => {
    const id = generateRoomId();
    expect(id.length).toBeGreaterThan(0);
    expect(id.length).toBeLessThanOrEqual(8);
  });

  it("returns different ids across calls", () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateRoomId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});
