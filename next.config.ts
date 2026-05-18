import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // archiver is a CommonJS-only Node package; keep it external from the bundler.
  serverExternalPackages: ["archiver"],
};

export default nextConfig;
