import { describe, expect, it } from "vitest";
import { buildVCardPayload, buildWifiPayload, payloadToText } from "./lib";

describe("buildWifiPayload", () => {
  it("builds a WPA network payload", () => {
    expect(buildWifiPayload({ kind: "wifi", ssid: "MyNetwork", password: "secret123", encryption: "WPA", hidden: false })).toBe(
      "WIFI:T:WPA;S:MyNetwork;P:secret123;;",
    );
  });

  it("omits the password field for open networks", () => {
    expect(buildWifiPayload({ kind: "wifi", ssid: "OpenNet", password: "", encryption: "nopass", hidden: false })).toBe(
      "WIFI:T:nopass;S:OpenNet;;",
    );
  });

  it("adds H:true for hidden networks", () => {
    expect(buildWifiPayload({ kind: "wifi", ssid: "Hidden", password: "pw", encryption: "WEP", hidden: true })).toBe(
      "WIFI:T:WEP;S:Hidden;P:pw;H:true;;",
    );
  });

  it("escapes special characters in SSID and password", () => {
    expect(
      buildWifiPayload({ kind: "wifi", ssid: "a;b,c:d\\e", password: "p;w", encryption: "WPA", hidden: false }),
    ).toBe("WIFI:T:WPA;S:a\\;b\\,c\\:d\\\\e;P:p\\;w;;");
  });
});

describe("buildVCardPayload", () => {
  it("builds a minimal vCard with just a name", () => {
    expect(buildVCardPayload({ kind: "vcard", name: "Jane Doe", phone: "", email: "", org: "" })).toBe(
      "BEGIN:VCARD\nVERSION:3.0\nFN:Jane Doe\nEND:VCARD",
    );
  });

  it("includes optional fields only when present", () => {
    expect(
      buildVCardPayload({ kind: "vcard", name: "Jane Doe", phone: "+1 555 0100", email: "jane@example.com", org: "Acme" }),
    ).toBe("BEGIN:VCARD\nVERSION:3.0\nFN:Jane Doe\nORG:Acme\nTEL:+1 555 0100\nEMAIL:jane@example.com\nEND:VCARD");
  });
});

describe("payloadToText", () => {
  it("passes plain text through unchanged", () => {
    expect(payloadToText({ kind: "text", text: "https://example.com" })).toBe("https://example.com");
  });

  it("dispatches to buildWifiPayload for wifi payloads", () => {
    expect(payloadToText({ kind: "wifi", ssid: "Net", password: "pw", encryption: "WPA", hidden: false })).toBe(
      "WIFI:T:WPA;S:Net;P:pw;;",
    );
  });

  it("dispatches to buildVCardPayload for vcard payloads", () => {
    expect(payloadToText({ kind: "vcard", name: "A", phone: "", email: "", org: "" })).toBe(
      "BEGIN:VCARD\nVERSION:3.0\nFN:A\nEND:VCARD",
    );
  });
});
