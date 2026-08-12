import type { Metadata } from "next";
import { CssShapeGenerator } from "./css-shape-generator";

export const metadata: Metadata = {
  title: "CSS Gradient / Box-Shadow / Clip-Path Generator — Tools",
  description: "Build CSS gradients, box-shadows, and clip-path shapes with a live preview, then copy the generated CSS.",
};

export default function CssShapeGeneratorPage() {
  return <CssShapeGenerator />;
}
