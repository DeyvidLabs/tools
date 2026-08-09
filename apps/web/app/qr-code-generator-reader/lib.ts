import QRCode from "qrcode";
import jsQR from "jsqr";

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

export type QrPayload =
  | { kind: "text"; text: string }
  | { kind: "wifi"; ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass"; hidden: boolean }
  | { kind: "vcard"; name: string; phone: string; email: string; org: string };

// WiFi/vCard QR payloads use ';', ',', ':', and '\' as field separators, so
// literal occurrences in user-entered values must be backslash-escaped or
// the resulting QR would be parsed as extra fields by scanning apps.
function escapeQrField(value: string): string {
  return value.replace(/([\\;,:])/g, "\\$1");
}

export function buildWifiPayload({ ssid, password, encryption, hidden }: Extract<QrPayload, { kind: "wifi" }>): string {
  const parts = [
    `T:${encryption}`,
    `S:${escapeQrField(ssid)}`,
    encryption === "nopass" ? "" : `P:${escapeQrField(password)}`,
    hidden ? "H:true" : "",
  ].filter(Boolean);
  return `WIFI:${parts.join(";")};;`;
}

export function buildVCardPayload({ name, phone, email, org }: Extract<QrPayload, { kind: "vcard" }>): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    org ? `ORG:${org}` : "",
    phone ? `TEL:${phone}` : "",
    email ? `EMAIL:${email}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

export function payloadToText(payload: QrPayload): string {
  switch (payload.kind) {
    case "text":
      return payload.text;
    case "wifi":
      return buildWifiPayload(payload);
    case "vcard":
      return buildVCardPayload(payload);
  }
}

export interface QrGenerateOptions {
  errorCorrectionLevel: QrErrorCorrection;
  margin: number;
  width: number;
}

export async function generateQrDataUrl(text: string, options: QrGenerateOptions): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin,
    width: options.width,
  });
}

export async function generateQrSvg(text: string, options: QrGenerateOptions): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin,
    width: options.width,
  });
}

export function decodeQrFromImageData(data: Uint8ClampedArray, width: number, height: number): string | null {
  const result = jsQR(data, width, height);
  return result ? result.data : null;
}
