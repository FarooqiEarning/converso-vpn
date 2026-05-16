require('dotenv/config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3002',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig