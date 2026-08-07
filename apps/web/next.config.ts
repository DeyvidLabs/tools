import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { resolve } from "path";

// Single .env at the monorepo root — shared with apps/api, not per-app.
loadEnvConfig(resolve(process.cwd(), "../.."));

const nextConfig: NextConfig = {
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:5000";
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/health", destination: `${apiOrigin}/health` },
      { source: "/docs", destination: `${apiOrigin}/docs` },
      { source: "/docs/:path*", destination: `${apiOrigin}/docs/:path*` },
      // Short-link redirects (url-shortener): served by the API's
      // GET /api/s/:code, but exposed to visitors at the shorter /s/:code.
      { source: "/s/:code", destination: `${apiOrigin}/api/s/:code` },
    ];
  },
};

export default nextConfig;
