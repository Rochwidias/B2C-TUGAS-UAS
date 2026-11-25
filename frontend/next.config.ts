import type { NextConfig } from "next";

// Header keamanan dipasang global di sini supaya berlaku untuk halaman, rute API,
// dan aset statis sekaligus. CSP sengaja tidak dipasang: script tema pre-paint dan
// style Tailwind berjalan inline, jadi tanpa nonce CSP justru merusak halaman.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Semua rute: header dasar keamanan.
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Back-office & API tidak boleh di-cache bersama.
        source: "/:path(admin|api)/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        // Aset build Next berhash, jadi aman di-cache lama.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/katalog',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;