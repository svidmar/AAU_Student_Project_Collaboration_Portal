/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export for Azure Static Web Apps
  images: {
    unoptimized: true, // Required for static export
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Enable experimental features if needed
  experimental: {},
};

module.exports = nextConfig;
