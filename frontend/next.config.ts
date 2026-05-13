import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Emergent preview URLs (cross-origin dev requests)
  allowedDevOrigins: [
    "*.preview.emergentagent.com",
    "*.preview.emergentcf.cloud",
    "*.cluster-12.preview.emergentcf.cloud",
    "3af38edc-cee1-436f-8ec3-13f7f0086c70.preview.emergentagent.com",
    "3af38edc-cee1-436f-8ec3-13f7f0086c70.cluster-12.preview.emergentcf.cloud",
    "finish-app-18.cluster-12.preview.emergentcf.cloud",
  ],
  experimental: {
    serverActions: {
      // Emergent pakai 2 domain: preview.emergentagent.com (external) dan
      // cluster-12.preview.emergentcf.cloud (internal). Server Actions check origin vs host.
      allowedOrigins: [
        "3af38edc-cee1-436f-8ec3-13f7f0086c70.preview.emergentagent.com",
        "3af38edc-cee1-436f-8ec3-13f7f0086c70.cluster-12.preview.emergentcf.cloud",
        "*.preview.emergentagent.com",
        "*.preview.emergentcf.cloud",
        "*.cluster-12.preview.emergentcf.cloud",
        "finish-app-18.cluster-12.preview.emergentcf.cloud",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
