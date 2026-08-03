import type { Metadata } from "next";
import { HttpRequestBuilder } from "./http-request-builder";

export const metadata: Metadata = {
  title: "HTTP Request Builder — Tools",
  description:
    "Build a request and get a ready curl / fetch() / HTTPie command, live — entirely in your browser.",
};

export default function HttpRequestBuilderPage() {
  return <HttpRequestBuilder />;
}
