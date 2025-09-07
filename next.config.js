/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false
  },
  // Silence dev cross-origin warnings for 0.0.0.0
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: [
    "0.0.0.0",
    "localhost",
  ],
  async redirects() {
    return [
      { source: "/data", destination: "/settings#data", permanent: true },
    ];
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


