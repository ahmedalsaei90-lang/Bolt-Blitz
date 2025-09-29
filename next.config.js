/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for Phaser in Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    // Handle phaser3spectorjs module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      'phaser3spectorjs': require.resolve('phaser3spectorjs'),
    };
    
    return config;
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
