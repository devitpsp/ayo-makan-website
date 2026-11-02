import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const isDev = process.env.NODE_ENV !== "production";

// CSP statis. Script inline dibutuhkan Next (hydration) dan skrip tema anti-flicker,
// jadi 'unsafe-inline' dipakai. CSP berbasis nonce butuh render dinamis di semua halaman
// dan masuk daftar pengerasan lanjutan (bukan v1).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  // Foto Google dialihkan (302) ke host googleusercontent.
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.ggpht.com",
  "font-src 'self' data:",
  `connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com${isDev ? " ws: wss:" : ""}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

// Versi build untuk nama cache service worker: berubah tiap build/deploy, supaya SW terpasang ulang dan cache lama dipangkas.
const SW_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? Date.now().toString(36);

const nextConfig: NextConfig = {
  env: { SW_VERSION },
  // Cache Components sengaja mati: PRD melarang cache konten Google Places,
  // semua route handler harus jalan per permintaan.
  poweredByHeader: false,
  turbopack: {
    // Folder induk punya package-lock.json lain; kunci root ke proyek ini.
    root: dirname(fileURLToPath(import.meta.url)),
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
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(self)" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // Foto hero dan logo milik Ayo Makan (bukan konten Google, boleh di-cache).
      // Tanpa ini max-age=0 membuat <img> mengunduh ulang foto yang sudah di-preload dan menunda LCP.
      ...["/hero/:path*", "/brand/:path*"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      })),
    ];
  },
};

export default nextConfig;
