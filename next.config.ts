import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 去掉 X-Powered-By 响应头（安全 + 少量字节）
  poweredByHeader: false,
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
