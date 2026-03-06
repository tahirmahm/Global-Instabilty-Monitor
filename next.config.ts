import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow fetching from external GeoJSON CDN and World Bank APIs
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
        ],
      },
    ];
  },
  // Optimize bundle for client-side analytics
  experimental: {
    optimizePackageImports: ['echarts', 'd3'],
  },
};

export default nextConfig;
