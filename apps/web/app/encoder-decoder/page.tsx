import type { Metadata } from "next";
import { EncoderDecoder } from "./encoder-decoder";

export const metadata: Metadata = {
  title: "Encoder/Decoder — Tools",
  description: "Encode or decode text as Base64, URL, or HTML entities — entirely in your browser.",
};

export default function EncoderDecoderPage() {
  return <EncoderDecoder />;
}
