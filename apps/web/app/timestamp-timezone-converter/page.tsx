import type { Metadata } from "next";
import { TimestampTimezoneConverter } from "./timestamp-timezone-converter";

export const metadata: Metadata = {
  title: "Timestamp / Timezone Converter — Tools",
  description:
    "Convert between Unix timestamps, ISO 8601, and human-readable dates in any timezone. Batch mode for pasting log timestamp columns.",
};

export default function TimestampTimezoneConverterPage() {
  return <TimestampTimezoneConverter />;
}
