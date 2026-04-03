import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
      return [
          {
              source: "/(.*)",
              headers: [
                  {
                      key: "Cross-Origin-Opener-Policy",
                      value: "unsafe-none", // Changed from same-origin-allow-popups for Google OAuth iframe compatibility
                  },
              ],
          },
      ];
  },
};

export default nextConfig;
