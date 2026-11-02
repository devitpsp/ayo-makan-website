import { swSource } from "@/lib/sw-source";

// Versi build ditanam saat build (next.config.ts env.SW_VERSION).
const VERSION = process.env.SW_VERSION ?? "dev";

export function GET() {
  return new Response(swSource(VERSION), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // SW harus selalu diambil ulang agar pembaruan tidak tertahan di cache HTTP.
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
