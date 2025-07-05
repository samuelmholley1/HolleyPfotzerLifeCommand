/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Enhanced React Native Web aliasing
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    
    // Prioritize web extensions
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...config.resolve.extensions,
    ];
    
    // Ensure React Native modules are properly resolved
    config.resolve.mainFields = ['browser', 'module', 'main'];
    
    return config;
  },
  
  // Transpile react-native-web
  transpilePackages: ['react-native-web'],
  
  // Experimental features for better compatibility
  experimental: {
    forceSwcTransforms: true,
  },
};

export default nextConfig;
