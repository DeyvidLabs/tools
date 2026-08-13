import type { Metadata } from "next";
import { CsvJsonYamlConverter } from "./csv-json-yaml-converter";

export const metadata: Metadata = {
  title: "CSV / JSON / YAML Converter — Tools",
  description: "Convert data between CSV, JSON, and YAML in your browser, with delimiter and header options for CSV.",
};

export default function CsvJsonYamlConverterPage() {
  return <CsvJsonYamlConverter />;
}
