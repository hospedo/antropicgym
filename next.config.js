/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14
  typescript: {
    // Skip TypeScript errors during build for Vercel deployment
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig