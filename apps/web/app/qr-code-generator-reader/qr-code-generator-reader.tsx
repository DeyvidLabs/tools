"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  decodeQrFromImageData,
  generateQrDataUrl,
  generateQrSvg,
  payloadToText,
  type QrErrorCorrection,
  type QrPayload,
} from "./lib";

const TABS = ["Generate", "Read"] as const;
type Tab = (typeof TABS)[number];

const ERROR_LEVELS: QrErrorCorrection[] = ["L", "M", "Q", "H"];

function fieldClass() {
  return "w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground placeholder:text-muted-foreground";
}

export function QrCodeGeneratorReader() {
  const [tab, setTab] = useState<Tab>("Generate");

  // --- Generate state ---
  const [payloadKind, setPayloadKind] = useState<QrPayload["kind"]>("text");
  const [text, setText] = useState("https://example.com");
  const [ssid, setSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [encryption, setEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [hidden, setHidden] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<QrErrorCorrection>("M");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const payload: QrPayload = useMemo(() => {
    if (payloadKind === "wifi") return { kind: "wifi", ssid, password: wifiPassword, encryption, hidden };
    if (payloadKind === "vcard") return { kind: "vcard", name, phone, email, org };
    return { kind: "text", text };
  }, [payloadKind, text, ssid, wifiPassword, encryption, hidden, name, phone, email, org]);

  const payloadText = useMemo(() => payloadToText(payload), [payload]);

  useEffect(() => {
    let cancelled = false;
    if (!payloadText.trim()) return;
    generateQrDataUrl(payloadText, { errorCorrectionLevel, margin: 2, width: 320 })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setGenError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setDataUrl(null);
          setGenError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payloadText, errorCorrectionLevel]);

  const hasPayload = payloadText.trim().length > 0;
  const effectiveDataUrl = hasPayload ? dataUrl : null;
  const effectiveGenError = hasPayload ? genError : null;

  const handleDownloadPng = () => {
    if (!effectiveDataUrl) return;
    const a = document.createElement("a");
    a.href = effectiveDataUrl;
    a.download = "qr-code.png";
    a.click();
  };

  const handleDownloadSvg = async () => {
    if (!payloadText.trim()) return;
    const svg = await generateQrSvg(payloadText, { errorCorrectionLevel, margin: 2, width: 320 });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Read state ---
  const [decoded, setDecoded] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const decodeFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setDecoded(null);
      setReadError("That's not an image file.");
      return;
    }

    setDecoded(null);
    setReadError(null);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const result = decodeQrFromImageData(imageData.data, imageData.width, imageData.height);
      if (result) setDecoded(result);
      else setReadError("No QR code found in this image.");
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setReadError("Couldn't load that image file.");
    img.src = URL.createObjectURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) decodeFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) decodeFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleCopyDecoded = async () => {
    if (!decoded) return;
    await navigator.clipboard.writeText(decoded);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">QR Code Generator / Reader</h1>
        <p className="mt-2 text-muted-foreground">
          Generate QR codes for text, URLs, WiFi networks, and contact cards, or decode one from an image.
          Everything runs in your browser, nothing is uploaded anywhere.
        </p>

        <div className="mt-6 flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Generate" ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex gap-1">
              {(["text", "wifi", "vcard"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setPayloadKind(kind)}
                  className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                    payloadKind === kind
                      ? "border-primary/50 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {kind === "text" ? "Text / URL" : kind === "wifi" ? "WiFi" : "Contact"}
                </button>
              ))}
            </div>

            {payloadKind === "text" && (
              <textarea
                rows={4}
                className={fieldClass()}
                placeholder="Text or URL to encode…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}

            {payloadKind === "wifi" && (
              <div className="flex flex-col gap-2">
                <input className={fieldClass()} placeholder="Network name (SSID)" value={ssid} onChange={(e) => setSsid(e.target.value)} />
                <select className={fieldClass()} value={encryption} onChange={(e) => setEncryption(e.target.value as typeof encryption)}>
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">No password</option>
                </select>
                {encryption !== "nopass" && (
                  <input
                    className={fieldClass()}
                    placeholder="Password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                  />
                )}
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
                  Hidden network
                </label>
              </div>
            )}

            {payloadKind === "vcard" && (
              <div className="flex flex-col gap-2">
                <input className={fieldClass()} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <input className={fieldClass()} placeholder="Organization (optional)" value={org} onChange={(e) => setOrg(e.target.value)} />
                <input className={fieldClass()} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <input className={fieldClass()} placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Error correction</label>
              <select
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                value={errorCorrectionLevel}
                onChange={(e) => setErrorCorrectionLevel(e.target.value as QrErrorCorrection)}
              >
                {ERROR_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-md border border-border p-6">
              {effectiveGenError && <p className="text-sm text-destructive">{effectiveGenError}</p>}
              {effectiveDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data: URL, not a static asset
                <img src={effectiveDataUrl} alt="Generated QR code" className="h-64 w-64" />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center text-sm text-muted-foreground">
                  Fill in the fields above to generate a QR code.
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!effectiveDataUrl}
                  className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  disabled={!payloadText.trim()}
                  className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                >
                  Download SVG
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-4">
            <label
              htmlFor="qr-file"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm transition-colors ${
                isDraggingOver
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
              }`}
            >
              {isDraggingOver ? "Drop to decode" : "Click to upload, or drag and drop a QR code image"}
              <input id="qr-file" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
            <canvas ref={canvasRef} className="hidden" />

            {readError && <p className="text-sm text-destructive">{readError}</p>}

            {decoded && (
              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Decoded content</span>
                  <button
                    type="button"
                    onClick={handleCopyDecoded}
                    className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border bg-secondary p-3 font-mono text-sm text-secondary-foreground">
                  {decoded}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
