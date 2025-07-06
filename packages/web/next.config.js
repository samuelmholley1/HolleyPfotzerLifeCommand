/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  env: {
    NEXT_PUBLIC_PW_E2E: process.env.NEXT_PUBLIC_PW_E2E || '',
  },
};

module.exports = nextConfig;
