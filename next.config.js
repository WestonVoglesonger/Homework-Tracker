/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  async headers() {
    const headers = [];

    // Only set HSTS in production - all other security headers are handled by middleware
    if (process.env.NODE_ENV === "production") {
      headers.push({
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      });
    }

    return headers;
  },
};

module.exports = nextConfig;


