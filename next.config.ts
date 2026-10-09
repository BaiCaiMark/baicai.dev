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
        // Prevent the domain's existing Cloudflare proxy from injecting its
        // analytics beacon into this exact offline/HTTPS comparison document.
        { key: "Cache-Control", value: "no-store, no-transform" },
      ],
    }));
  },
};

export default nextConfig;
