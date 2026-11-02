// Verifikasi PWA terhadap build produksi (service worker hanya terdaftar di production).
// Pakai: BASE=http://localhost:3101 node scripts/verify-pwa.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.BASE ?? "http://localhost:3101";
const ok = (n, p, x = "") => console.log(`${p ? "PASS" : "FAIL"} ${n}${x ? " :: " + x : ""}`);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.addInitScript(() => localStorage.setItem("am-loc", JSON.stringify({ source: "campus", campusId: "kampus-3" })));
await page.route("**/api/places/search*", (r) => r.fulfill({ json: { mode: "explore", places: [], nextPageToken: null, truncated: false } }));

await page.goto(BASE, { waitUntil: "networkidle" });

// manifest
const mres = await page.request.get(`${BASE}/manifest.webmanifest`);
const m = await mres.json();
ok("manifest: nama, display standalone, start_url", m.name === "Ayo Makan" && m.display === "standalone" && m.start_url === "/");
ok("manifest: warna sesuai PRD", m.theme_color === "#B3261E" && m.background_color === "#FFF7E8");
ok("manifest: ikon 192, 512, maskable", ["192x192", "512x512"].every((s) => m.icons.some((i) => i.sizes === s)) && m.icons.some((i) => i.purpose === "maskable"));
for (const i of m.icons) ok(`ikon ${i.src} bisa diambil`, (await page.request.get(BASE + i.src)).ok());

// service worker
await page.evaluate(() => navigator.serviceWorker.ready);
const swScope = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope);
ok("service worker terdaftar", swScope === `${BASE}/`, String(swScope));
await page.reload({ waitUntil: "networkidle" });
const cached = await page.evaluate(async () => {
  const keys = await caches.keys();
  const urls = [];
  for (const k of keys) for (const r of await (await caches.open(k)).keys()) urls.push(new URL(r.url).pathname);
  return urls;
});
ok("cache berisi /offline + aset statis", cached.includes("/offline") && cached.some((u) => u.startsWith("/_next/static/")), `${cached.length} entri`);
ok("cache TIDAK berisi /api/* (konten Google tidak boleh di-cache)", !cached.some((u) => u.startsWith("/api/")));

// installability lewat CDP
const cdp = await ctx.newCDPSession(page);
const inst = await cdp.send("Page.getInstallabilityErrors");
ok("installable (tanpa error installability)", inst.installabilityErrors.length === 0, JSON.stringify(inst.installabilityErrors.map((e) => e.errorId)));

// offline
await ctx.setOffline(true);
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" }).catch(() => {});
ok("offline: navigasi menampilkan halaman offline", await page.getByText(/Kamu sedang offline/).isVisible().catch(() => false));
await page.screenshot({ path: `${process.env.OUT ?? "."}/offline-390.png` });
await ctx.setOffline(false);

// banner pasang
await page.evaluate(() => {
  localStorage.setItem("am-visits", "2");
  localStorage.removeItem("am-install-dismissed");
});
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => {
  const e = new Event("beforeinstallprompt");
  e.prompt = async () => {};
  e.userChoice = Promise.resolve({ outcome: "dismissed" });
  window.dispatchEvent(e);
});
const banner = page.getByRole("region", { name: "Pasang Ayo Makan" });
ok("banner pasang muncul di kunjungan ke-2+", await banner.isVisible().catch(() => false));
await page.getByRole("button", { name: "Tutup ajakan pasang" }).click();
ok("banner bisa ditutup", !(await banner.isVisible().catch(() => false)));
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => {
  const e = new Event("beforeinstallprompt");
  e.prompt = async () => {};
  e.userChoice = Promise.resolve({ outcome: "dismissed" });
  window.dispatchEvent(e);
});
ok("banner tidak muncul lagi setelah ditutup (14 hari)", !(await banner.isVisible().catch(() => false)));

// #17 service worker berversi per build
const sw = await page.request.get(`${BASE}/sw.js`);
const swText = await sw.text();
ok("sw.js: dilayani sebagai JavaScript tanpa cache HTTP", /javascript/.test(sw.headers()["content-type"] ?? "") && /no-store|no-cache/.test(sw.headers()["cache-control"] ?? ""), `${sw.headers()["content-type"]} | ${sw.headers()["cache-control"]}`);
const ver = swText.match(/const VERSION = "(am-shell-[^"]+)"/)?.[1];
ok("sw.js: nama cache memuat versi build (bukan konstanta v1)", !!ver && ver !== "am-shell-v1", String(ver));
const names = await page.evaluate(async () => caches.keys());
ok("cache aktif bernama sesuai versi build", names.includes(ver), JSON.stringify(names));
// cache lama dari versi sebelumnya dipangkas saat SW baru aktif (konteks baru: cache usang ada SEBELUM SW terpasang)
{
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await ctx2.newPage();
  await p2.addInitScript(() => { caches.open("am-shell-stale-lama"); });
  await p2.route("**/api/places/search*", (r) => r.fulfill({ json: { mode: "explore", places: [], nextPageToken: null, truncated: false } }));
  await p2.goto(BASE, { waitUntil: "networkidle" });
  await p2.evaluate(() => navigator.serviceWorker.ready);
  await p2.waitForTimeout(1500);
  const names2 = await p2.evaluate(async () => caches.keys());
  ok("cache versi lama dihapus saat SW baru aktif", !names2.includes("am-shell-stale-lama") && names2.includes(ver), JSON.stringify(names2));
  await ctx2.close();
}

await browser.close();
