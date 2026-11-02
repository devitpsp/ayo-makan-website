/**
 * Sumber service worker (PRD F-13), disajikan oleh app/sw.js/route.ts dengan versi build di nama cache.
 * Dulu berupa public/sw.js dengan VERSION tetap: SW tidak pernah berubah antar deploy, jadi tidak pernah
 * dipasang ulang, halaman /offline membeku di versi pertama, dan aset _next/static menumpuk tanpa pangkas.
 */
export function swSource(version: string): string {
  return String.raw`/*
 * Service worker Ayo Makan (PRD F-13).
 * - Shell (halaman offline + aset /_next/static) di-cache.
 * - Nama cache memuat versi build, jadi tiap deploy memasang SW baru dan activate menghapus cache lama.
 * - /api/* dan foto Google: network-only. Konten Google Places tidak boleh di-cache (kebijakan Places API).
 */
const VERSION = ${JSON.stringify("am-shell-" + version)};
const OFFLINE_URL = "/offline";
const PRECACHE = ["/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      // Halaman offline + semua CSS/JS/font yang dipakainya, supaya tampil utuh tanpa jaringan.
      const res = await fetch(OFFLINE_URL, { cache: "reload" });
      const html = await res.clone().text();
      await cache.put(OFFLINE_URL, res);
      const assets = [...html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
      await cache.addAll([...new Set([...assets, ...PRECACHE])]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Lintas origin (foto Google) dan API: biarkan browser langsung ke jaringan.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()),
    );
    return;
  }

  // Aset statis ber-hash dan ikon: cache dulu, lalu jaringan.
  if (url.pathname.startsWith("/_next/static/") || /^\/icon-.*\.png$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
`;
}
