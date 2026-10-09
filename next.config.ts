import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporary compatibility sample: serve the original standalone document,
  // without the site's React layout, styles, navigation or client runtime.
  async rewrites() {
    return [{ source: "/zolith-test", destination: "/zolith-test.html" }];
  },
  async headers() {
    return ["/zolith-test", "/zolith-test.html"].map((source) => ({
      source,
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        { key: "Cache-Control", value: "no-store" },
      ],
    }));
  },
};

export default nextConfig;
