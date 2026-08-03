import { describe, expect, it } from "vitest";
import {
  buildCurlCommand,
  buildFetchSnippet,
  buildHttpieCommand,
  parseCurlCommand,
  type RequestConfig,
} from "./lib";

const baseGet: RequestConfig = {
  method: "GET",
  url: "https://example.com/api",
  headers: [],
  body: "",
  auth: { type: "none" },
};

const jsonPost: RequestConfig = {
  method: "POST",
  url: "https://example.com/api",
  headers: [{ key: "Content-Type", value: "application/json" }],
  body: '{"foo":"bar"}',
  auth: { type: "none" },
};

describe("buildCurlCommand", () => {
  it("builds a plain GET without -X or -d", () => {
    const cmd = buildCurlCommand(baseGet);
    expect(cmd).toBe("curl 'https://example.com/api'");
  });

  it("builds a POST with header and body", () => {
    const cmd = buildCurlCommand(jsonPost);
    expect(cmd).toContain("curl -X POST 'https://example.com/api'");
    expect(cmd).toContain("-H 'Content-Type: application/json'");
    expect(cmd).toContain(`-d '{"foo":"bar"}'`);
  });

  it("adds an Authorization header for bearer auth", () => {
    const cmd = buildCurlCommand({ ...baseGet, auth: { type: "bearer", token: "abc123" } });
    expect(cmd).toContain("-H 'Authorization: Bearer abc123'");
  });

  it("adds a -u flag for basic auth", () => {
    const cmd = buildCurlCommand({ ...baseGet, auth: { type: "basic", username: "bob", password: "secret" } });
    expect(cmd).toContain("-u 'bob:secret'");
  });

  it("escapes single quotes in values", () => {
    const cmd = buildCurlCommand({ ...baseGet, url: "https://example.com/it's-a-test" });
    expect(cmd).toBe(`curl 'https://example.com/it'\\''s-a-test'`);
  });

  it("omits -d for GET even if a body is set", () => {
    const cmd = buildCurlCommand({ ...baseGet, body: "should-be-ignored" });
    expect(cmd).not.toContain("-d");
  });

  it("quotes with double quotes and uses ^ continuation for cmd.exe", () => {
    const cmd = buildCurlCommand(jsonPost, "cmd");
    expect(cmd).toContain(`curl -X POST "https://example.com/api" ^`);
    expect(cmd).toContain(`-H "Content-Type: application/json" ^`);
    expect(cmd).toContain(`-d "{\\"foo\\":\\"bar\\"}"`);
    expect(cmd).not.toContain("'");
  });

  it("escapes embedded double quotes for cmd.exe", () => {
    const cmd = buildCurlCommand({ ...baseGet, url: `https://example.com/say-"hi"` }, "cmd");
    expect(cmd).toBe(`curl "https://example.com/say-\\"hi\\""`);
  });

  it("uses single quotes and a backtick continuation for PowerShell", () => {
    const cmd = buildCurlCommand(jsonPost, "powershell");
    expect(cmd).toContain("curl -X POST 'https://example.com/api' `");
    expect(cmd).toContain("-H 'Content-Type: application/json' `");
  });

  it("doubles embedded single quotes for PowerShell", () => {
    const cmd = buildCurlCommand({ ...baseGet, url: "https://example.com/it's-a-test" }, "powershell");
    expect(cmd).toBe(`curl 'https://example.com/it''s-a-test'`);
  });
});

describe("buildFetchSnippet", () => {
  it("includes method, headers, and body", () => {
    const snippet = buildFetchSnippet(jsonPost);
    expect(snippet).toContain(`fetch("https://example.com/api", {`);
    expect(snippet).toContain(`method: "POST"`);
    expect(snippet).toContain(`"Content-Type": "application/json"`);
    expect(snippet).toContain(`body: "{\\"foo\\":\\"bar\\"}"`);
  });

  it("adds a Bearer Authorization header", () => {
    const snippet = buildFetchSnippet({ ...baseGet, auth: { type: "bearer", token: "abc123" } });
    expect(snippet).toContain(`"Authorization": "Bearer abc123"`);
  });

  it("omits the headers block when there are none", () => {
    const snippet = buildFetchSnippet(baseGet);
    expect(snippet).not.toContain("headers:");
  });
});

describe("buildHttpieCommand", () => {
  it("builds a POST with headers and a raw body", () => {
    const cmd = buildHttpieCommand(jsonPost);
    expect(cmd).toContain("http POST 'https://example.com/api'");
    expect(cmd).toContain("Content-Type:'application/json'");
    expect(cmd).toContain(`--raw='{"foo":"bar"}'`);
  });

  it("omits the method token for GET", () => {
    const cmd = buildHttpieCommand(baseGet);
    expect(cmd).toBe("http 'https://example.com/api'");
  });

  it("adds a -a flag for basic auth", () => {
    const cmd = buildHttpieCommand({ ...baseGet, auth: { type: "basic", username: "bob", password: "secret" } });
    expect(cmd).toContain("-a 'bob:secret'");
  });

  it("quotes with double quotes for cmd.exe", () => {
    const cmd = buildHttpieCommand(jsonPost, "cmd");
    expect(cmd).toContain(`http POST "https://example.com/api" ^`);
    expect(cmd).not.toContain("'");
  });
});

describe("parseCurlCommand", () => {
  it("parses method, url, headers, and body", () => {
    const parsed = parseCurlCommand(
      `curl -X POST 'https://example.com/api' -H 'Content-Type: application/json' -d '{"foo":"bar"}'`,
    );
    expect(parsed).toEqual({
      method: "POST",
      url: "https://example.com/api",
      headers: [{ key: "Content-Type", value: "application/json" }],
      body: '{"foo":"bar"}',
      auth: { type: "none" },
    });
  });

  it("infers POST when -d is present without -X", () => {
    const parsed = parseCurlCommand(`curl 'https://example.com/api' -d 'a=1'`);
    expect(parsed?.method).toBe("POST");
  });

  it("defaults to GET with no body or method flag", () => {
    const parsed = parseCurlCommand(`curl 'https://example.com/api'`);
    expect(parsed?.method).toBe("GET");
  });

  it("extracts basic auth from -u", () => {
    const parsed = parseCurlCommand(`curl -u 'bob:secret' 'https://example.com/api'`);
    expect(parsed?.auth).toEqual({ type: "basic", username: "bob", password: "secret" });
  });

  it("extracts bearer auth from an Authorization header", () => {
    const parsed = parseCurlCommand(
      `curl 'https://example.com/api' -H 'Authorization: Bearer abc123'`,
    );
    expect(parsed?.auth).toEqual({ type: "bearer", token: "abc123" });
    expect(parsed?.headers).toEqual([]);
  });

  it("ignores unrecognized zero-arg flags without corrupting the URL", () => {
    const parsed = parseCurlCommand(`curl -sSL --compressed 'https://example.com/api'`);
    expect(parsed?.url).toBe("https://example.com/api");
  });

  it("returns null when no URL can be found", () => {
    expect(parseCurlCommand("curl -X POST")).toBeNull();
    expect(parseCurlCommand("")).toBeNull();
  });

  it("round-trips a config built into curl and parsed back", () => {
    const cmd = buildCurlCommand(jsonPost);
    const parsed = parseCurlCommand(cmd);
    expect(parsed).toEqual(jsonPost);
  });
});
