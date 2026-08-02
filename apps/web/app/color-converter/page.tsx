import type { Metadata } from "next";
import { ColorConverter } from "./color-converter";

export const metadata: Metadata = {
  title: "Color Converter — Tools",
  description:
    "Convert between HEX, RGB, HSL, and OKLCH, and generate derived palettes — entirely in your browser.",
};

export default function ColorConverterPage() {
  return <ColorConverter />;
}
