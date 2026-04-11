import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',

  serverExternalPackages: ["jspdf", "fflate"],

  images: {
    unoptimized: true,   // 🔥 MUST ADD
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'godavari-specials.firebasestorage.app' }
    ]
  },
};

export default nextConfig;
