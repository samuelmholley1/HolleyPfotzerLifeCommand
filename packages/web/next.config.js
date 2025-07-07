// Load environment variables from .env.local
require('dotenv').config({ path: './.env.local' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_PW_E2E: process.env.NEXT_PUBLIC_PW_E2E,
    NEXT_PUBLIC_USE_MOCK_AUTH: process.env.NEXT_PUBLIC_USE_MOCK_AUTH,
  },
};

console.log(
  '⚙️ E2E ENV:',
  'PW_E2E=', process.env.NEXT_PUBLIC_PW_E2E,
  'USE_MOCK_AUTH=', process.env.NEXT_PUBLIC_USE_MOCK_AUTH
);

module.exports = nextConfig;
