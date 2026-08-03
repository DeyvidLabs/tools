import type { Metadata } from "next";
import { FakeDataGenerator } from "./fake-data-generator";

export const metadata: Metadata = {
  title: "Fake Data Generator — Tools",
  description:
    "Generate batches of fake names, emails, addresses, lorem ipsum, and dates — entirely in your browser.",
};

export default function FakeDataGeneratorPage() {
  return <FakeDataGenerator />;
}
