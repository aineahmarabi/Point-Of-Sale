import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/assets", "@repo/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "**.convex.site",
      },
    ],
  },
};

export default nextConfig;
