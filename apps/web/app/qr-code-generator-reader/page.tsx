import type { Metadata } from "next";
import { QrCodeGeneratorReader } from "./qr-code-generator-reader";

export const metadata: Metadata = {
  title: "QR Code Generator / Reader — Tools",
  description: "Generate QR codes for text, URLs, WiFi networks, and contacts, or decode a QR code from an image — all in your browser.",
};

export default function QrCodeGeneratorReaderPage() {
  return <QrCodeGeneratorReader />;
}
