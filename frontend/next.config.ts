import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin dev requests dari preview environment (Emergent, ngrok, dll).
  // Di Vercel production, host = origin secara default, jadi tidak perlu konfigurasi tambahan.
  allowedDevOrigins: [
    "*.preview.emergentagent.com",
    "*.preview.emergentcf.cloud",
    "*.cluster-12.preview.emergentcf.cloud",
  ],
  experimental: {
    serverActions: {
      // Whitelist origin untuk Server Actions. Emergent preview pakai dual-domain
      // (preview.emergentagent.com & cluster-12.preview.emergentcf.cloud).
      // Vercel production: app domain otomatis di-allow.
      allowedOrigins: [
        "*.preview.emergentagent.com",
        "*.preview.emergentcf.cloud",
        "*.cluster-12.preview.emergentcf.cloud",
        "*.vercel.app",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
