/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'pngjs', 'pixelmatch', '@sparticuz/chromium', 'puppeteer-core'],
  },
}

module.exports = nextConfig
