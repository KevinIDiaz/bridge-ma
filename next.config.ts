import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root so a stray lockfile in a parent folder is never used.
  turbopack: { root: __dirname },
  // Locale lives in the URL (/en, /es). The bare root goes to the default locale.
  async redirects() {
    return [{ source: "/", destination: "/en", permanent: false }];
  },
};

export default nextConfig;
