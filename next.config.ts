import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Never log action arguments (passwords) or partner-link URLs (tokens).
  logging: {
    serverFunctions: false,
    incomingRequests: { ignore: [/^\/p\//] },
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
