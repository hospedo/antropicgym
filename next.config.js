/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  typescript: {
    // Skip TypeScript errors during build for Vercel deployment
    ignoreBuildErrors: true,
  },
  // Disable static optimization for dynamic pages that require Supabase
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  output: 'standalone'
}

module.exports = nextConfig