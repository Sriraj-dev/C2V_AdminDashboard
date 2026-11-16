import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Never log action arguments (passwords) or partner-link URLs (tokens).
  logging: {
    serverFunctions: false,
    incomingRequests: { ignore: [/^\/p\//] },
  },
  // The token is in the URL: keep it out of referrers, caches and search indexes.
  async headers() {
    return [
      {
        source: "/p/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
