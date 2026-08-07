import type { Metadata } from "next";
import { MockEndpointTool } from "./mock-endpoint";

export const metadata: Metadata = {
  title: "API Mock / Sandbox Endpoint — Tools",
  description:
    "Get a URL that responds with a configurable status code, JSON body, headers, and delay — for testing error/timeout handling without a real backend.",
};

export default function MockEndpointPage() {
  return <MockEndpointTool />;
}
