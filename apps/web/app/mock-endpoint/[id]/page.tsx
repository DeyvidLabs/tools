import type { Metadata } from "next";
import { MockEndpointView } from "./mock-endpoint-view";

export const metadata: Metadata = {
  title: "Mock endpoint — Tools",
  description: "View a mock endpoint's configuration.",
};

export default async function MockEndpointViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MockEndpointView id={id} />;
}
