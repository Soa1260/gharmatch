import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.google.com https://maps.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Maintenance mode (docs/MAINTENANCE.md). Off by default, and then this adds nothing at all. When MAINTENANCE_MODE=1
  // at build time, every address is answered by the maintenance page, except Next's own files, the icons,
  // robots.txt, the health check and the daily job.
  async rewrites() {
    if (process.env.MAINTENANCE_MODE !== "1") return [];
    return {
      beforeFiles: [
        { source: "/", destination: "/maintenance" },
        { source: "/api/:path((?!health$|cron/daily$).*)", destination: "/maintenance/json" },
        { source: "/:path((?!_next/|api/|maintenance|icon\\.svg$|apple-icon\\.png$|favicon\\.ico$|robots\\.txt$).*)", destination: "/maintenance" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // The old address sends everyone, with the same path, to the real domain. The daily cron path is left alone.
  async redirects() {
    return [
      {
        source: "/:path((?!api/cron).*)",
        has: [{ type: "host", value: "gharmatch.vercel.app" }],
        destination: "https://gharmatch.space/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
