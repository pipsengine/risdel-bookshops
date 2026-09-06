import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["googleapis", "mssql"],
  // googleapis is enormous; load it from the app node_modules at runtime via NODE_PATH
  outputFileTracingExcludes: {
    "*": [
      "node_modules/googleapis/**/*",
      "node_modules/googleapis-common/**/*",
      "node_modules/google-auth-library/**/*",
      "node_modules/gcp-metadata/**/*",
      "node_modules/gtoken/**/*"
    ]
  },
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
      ]
    }];
  }
};
export default nextConfig;
