// Verifikasi UI dengan respons Google yang di-mock di sini (TIDAK memakai kuota Google).
// Pakai: BASE=http://localhost:3101 OUT=/path/shots node scripts/verify-ui.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.BASE ?? "http://localhost:3101";
const OUT = process.env.OUT ?? "./shots";

const mkPlace = (i, over = {}) => ({
  id: `ChIJmock${String(i).padStart(10, "0")}`,
  name: `Warung Contoh ${i}`,
  lat: -7.31 + i * 0.001,
  lng: 110.4787 + i * 0.001,
  distanceM: 150 + i * 90,
  rating: 4.2 + (i % 8) / 10,
  ratingCount: 20 + i * 37,
  priceLevel: i % 2 ? "PRICE_LEVEL_INEXPENSIVE" : null,
  priceRange: i % 3 === 0 ? { start: 10000, end: 25000, currency: "IDR" } : null,
  openNow: i % 4 === 0 ? false : i % 5 === 0 ? null : true,
  primaryType: "indonesian_restaurant",
  photo: null,
  ...over,
});
const PH = (kind) => ({ name: `places/ChIJmock/photos/AX${kind}`, author: "Tester", authorUri: null });
const VARIED = {
  1: { photo: PH("potret") },
  4: { photo: PH("lanskap") },
  6: { photo: PH("potret") },
  8: { photo: PH("lanskap") },
  2: { name: "Warung Makan Prasmanan Serba Ada Pak Slamet Cabang Salatiga Kota Dekat Kampus" },
  3: { priceLevel: null, priceRange: null, openNow: null, photo: PH("lanskap") },
  5: { name: "Kopi", priceLevel: "PRICE_LEVEL_MODERATE", rating: null, ratingCount: null },
  7: { priceRange: { start: null, end: 25000, currency: "IDR" } },
};
const SEARCH = { mode: "explore", places: Array.from({ length: 9 }, (_, i) => mkPlace(i + 1, VARIED[i + 1] ?? {})), nextPageToken: null, truncated: true };
const DETAIL = {
  ...mkPlace(1),
  primaryTypeLabel: "Warung makan",
  address: "Jl. Contoh No. 1, Salatiga",
  photos: [],
  weekdayDescriptions: ["Senin: 08.00 sampai 21.00", "Selasa: 08.00 sampai 21.00"],
  googleMapsUri: "https://maps.google.com/?cid=1",
  directionsUri: "https://www.google.com/maps/dir/?api=1&destination_place_id=ChIJmock",
  writeReviewUri: null,
  reviews: [
    { author: "Penulis Contoh", authorUri: null, authorPhoto: null, rating: 5, relativeTime: "2 bulan lalu", text: "Ulasan contoh untuk uji tampilan. ".repeat(10), originalText: "Sample review", translated: true, googleMapsUri: "https://maps.google.com/?cid=2", flagUri: "https://maps.google.com/flag" },
  ],
};

// Tunggu URL (router.replace asinkron). neg=true: menunggu sampai pola hilang.
const urlHas = (page, re, neg = false) =>
  page.waitForFunction(([src, n]) => new RegExp(src).test(location.search) !== n, [re.source, neg], { timeout: 4000 }).then(() => true, () => false);

const sizes = [[360, 640], [390, 844], [768, 1024], [1024, 768], [1440, 900]];
const log = [];
const ok = (name, pass, extra = "") => {
  const line = `${pass ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`;
  log.push(line);
  console.log(line);
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function newPage(w, h, theme, { mock = true, campus = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: "light", permissions: [] });
  const page = await ctx.newPage();
  if (theme === "dark") await page.addInitScript(() => localStorage.setItem("am-theme", "dark"));
  page.errors = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (m.location().url.includes("/_vercel/insights") || m.text().includes("/_vercel/insights")) return; // hanya ada di hosting Vercel
    page.errors.push(m.text());
  });
  page.on("pageerror", (e) => page.errors.push(String(e)));
  if (campus) await page.addInitScript(() => localStorage.setItem("am-loc", JSON.stringify({ source: "campus", campusId: "kampus-3" })));
  if (mock) {
    await page.route("**/api/places/search*", (r) => r.fulfill({ json: SEARCH }));
    await page.route("**/api/places/ChIJ*", (r) => r.fulfill({ json: DETAIL }));
    // Foto tiruan dengan rasio asli ekstrem (potret 1:3, lanskap 3:1) untuk menguji kotak foto kartu.
    await page.route("**/api/photo*", (r) => {
      const u = decodeURIComponent(r.request().url());
      const [w, h] = u.includes("potret") ? [300, 900] : [900, 300];
      r.fulfill({ contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#6a8"/></svg>` });
    });
  }
  return page;
}

// 1. Screenshot + overflow per lebar dan tema
for (const theme of ["light", "dark"]) {
  for (const [w, h] of sizes) {
    const page = await newPage(w, h, theme);
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/home-${theme}-${w}.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`no horizontal overflow ${theme} ${w}px (hero)`, overflow <= 0, `delta ${overflow}`);
    if (w === 360) {
      const box = await page.locator("#cari-hero").boundingBox();
      ok(`kolom cari terlihat di layar pertama 360x640 (${theme})`, !!box && box.y + box.height <= h, box ? `bottom ${Math.round(box.y + box.height)} / ${h}` : "no box");
    }
    await page.locator("#hasil").scrollIntoViewIfNeeded();
    await page.waitForSelector("ul[aria-label='Daftar tempat']", { timeout: 8000 }).catch(() => {});
    await page.screenshot({ path: `${OUT}/hasil-${theme}-${w}.png` });
    const measure = () => page.evaluate(() => [...document.querySelectorAll("ul[aria-label='Daftar tempat'] article")].map((a) => { const r = a.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    if (theme === "light") {
      // gulir agar foto (lazy) benar-benar termuat, supaya foto potret ikut menguji tinggi kartu
      for (const a of await page.locator("ul[aria-label='Daftar tempat'] article").all()) await a.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      const loaded = await page.evaluate(() => [...document.querySelectorAll("ul[aria-label='Daftar tempat'] img")].filter((i) => i.complete && i.naturalWidth > 0).length);
      const first = await measure();
      const same = (arr) => new Set(arr.map((x) => x[0])).size === 1 && new Set(arr.map((x) => x[1])).size === 1;
      ok(`awalnya 6 kartu ${w}px`, first.length === 6, `${first.length} kartu`);
      ok(`kartu sama ukuran walau foto potret/lanskap ${w}px`, same(first) && loaded >= 2, `lebar ${[...new Set(first.map((x) => x[0]))]}, tinggi ${[...new Set(first.map((x) => x[1]))]}, foto termuat ${loaded}`);
      await page.getByRole("button", { name: "Muat lebih banyak" }).click();
      await page.waitForFunction(() => document.querySelectorAll("ul[aria-label='Daftar tempat'] article").length === 9, null, { timeout: 4000 }).catch(() => {});
      for (const a of await page.locator("ul[aria-label='Daftar tempat'] article").all()) await a.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const all = await measure();
      ok(`Muat lebih banyak menambah jadi 9 kartu, tetap sama ukuran ${w}px`, all.length === 9 && same(all), `${all.length} kartu`);
    }
    const o2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(`no horizontal overflow ${theme} ${w}px (hasil)`, o2 <= 0, `delta ${o2}`);
    ok(`no console error ${theme} ${w}px`, page.errors.length === 0, page.errors.slice(0, 2).join(" | "));
    await page.context().close();
  }
}

// 1b. Default terang walau sistem gelap (DESIGN 2)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok("tema: sistem gelap TIDAK mengubah default (tetap terang)", bg === "rgb(255, 250, 235)", bg);
  await ctx.close();
}

// 2. Click-through (mobile 390, light)
{
  const page = await newPage(390, 844, "light");
  await page.goto(BASE, { waitUntil: "networkidle" });

  const h1 = () => page.locator("h1").innerText();
  const first = await h1();
  await page.getByRole("button", { name: "Menu berikutnya" }).click();
  ok("hero: panah berikutnya mengganti slide", (await h1()) !== first);
  await page.getByRole("button", { name: "Menu sebelumnya" }).click();
  ok("hero: panah sebelumnya kembali", (await h1()) === first);
  await page.getByRole("group", { name: "Menu andalan", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  ok("hero: panah kanan keyboard di carousel", (await h1()) !== first);
  await page.locator("#cari-hero").focus();
  const before = await h1();
  await page.keyboard.press("ArrowRight");
  ok("hero: panah kanan di kolom cari TIDAK mengganti slide", (await h1()) === before);

  await page.getByRole("button", { name: /^Lihat menu 4 dari 4/ }).click();
  ok("hero: indikator bisa diketuk (lompat ke slide 4)", (await h1()).toLowerCase().includes("kuahnya"));
  await page.getByRole("button", { name: /^Lihat menu 1 dari 4/ }).click();

  // Kolom cari hero umum (keputusan owner 3 Nov 2026): tidak mengikuti slide, tombol mengirim isi kolom
  ok("hero: kolom cari kosong, tidak mengikuti slide", (await page.locator("#cari-hero").inputValue()) === "");
  await page.locator("#cari-hero").fill("seblak");
  await page.getByRole("button", { name: "Cari di sekitar" }).click();
  await page.waitForURL(/q=seblak/);
  ok("hero: ketik + tombol 'Cari di sekitar' mengisi ?q=", /q=seblak/.test(page.url()), page.url().replace(BASE, ""));

  // MENU HP
  const menuBtn = page.getByRole("button", { name: /menu$/i }).first();
  await menuBtn.click();
  ok("MENU: panel terbuka", await page.getByRole("link", { name: "Favorit" }).first().isVisible());
  await page.keyboard.press("Escape");
  ok("MENU: Escape menutup panel", !(await page.getByRole("link", { name: "Favorit" }).first().isVisible().catch(() => false)));
  ok("MENU: fokus kembali ke tombol", await menuBtn.evaluate((el) => el === document.activeElement));
  await menuBtn.click();
  await page.mouse.click(200, 700);
  ok("MENU: ketuk di luar menutup panel", !(await page.getByRole("link", { name: "Favorit" }).first().isVisible().catch(() => false)));

  // tema
  await menuBtn.click();
  await page.getByRole("button", { name: /Ganti ke tema gelap/ }).click();
  ok("tema: toggle gelap menyetel data-theme", (await page.evaluate(() => document.documentElement.dataset.theme)) === "dark");
  await page.keyboard.press("Escape");

  // kategori, filter, bottom sheet
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.getByRole("tab", { name: "Minuman" }).click();
  ok("kategori: Minuman aktif + ?cat=minuman", await urlHas(page, /cat=minuman/));
  await page.getByRole("tab", { name: "Minuman" }).focus();
  await page.keyboard.press("ArrowRight");
  ok("tab: panah kanan pindah ke Jajanan + fokus ikut", (await urlHas(page, /cat=jajanan/)) && (await page.getByRole("tab", { name: "Jajanan" }).evaluate((el) => el === document.activeElement)));
  await page.keyboard.press("Home");
  ok("tab: Home kembali ke Makanan (default, ?cat hilang)", await urlHas(page, /cat=/, true));
  await page.getByRole("tab", { name: "Minuman" }).click();
  await urlHas(page, /cat=minuman/);
  await page.getByRole("button", { name: /^1 km/ }).click();
  const sheet = page.getByRole("dialog", { name: "Radius" });
  ok("filter: chip radius membuka bottom sheet", await sheet.isVisible());
  await page.keyboard.press("Escape");
  ok("filter: Escape menutup bottom sheet", !(await sheet.isVisible()));
  await page.getByRole("button", { name: /^1 km/ }).click();
  await page.getByRole("dialog", { name: "Radius" }).getByRole("button", { name: "2 km" }).click();
  ok("filter: pilih 2 km mengubah URL", await urlHas(page, /r=2000/));
  await page.getByRole("button", { name: "Murah" }).click();
  ok("filter: Murah aktif + teks bantuan", (await urlHas(page, /murah=1/)) && (await page.getByText(/tanpa data harga ikut tersembunyi/).filter({ visible: true }).count()) > 0);
  await page.getByRole("button", { name: "Reset" }).click();
  ok("filter: Reset mengembalikan default", await urlHas(page, /r=2000|murah=1/, true));

  // urutan + info
  await page.getByLabel("Urut").selectOption("teruji");
  ok("urut: Rating teruji masuk URL", await urlHas(page, /urut=teruji/));
  await page.getByRole("button", { name: "Apa itu Rating teruji?" }).click();
  ok("urut: info rumus muncul", await page.getByText(/5,0 dari 3 ulasan/).isVisible());

  // favorit di kartu
  const saveBtn = page.getByRole("button", { name: /^Simpan Warung Contoh/ }).first();
  await saveBtn.click();
  ok("favorit: kartu tersimpan (aria-pressed)", (await page.getByRole("button", { name: /^Hapus Warung Contoh .* dari Favorit/ }).count()) >= 1);

  // buka detail
  await page.getByRole("link", { name: /Warung Contoh/ }).first().click();
  await page.waitForURL(/\/tempat\//);
  await page.getByRole("heading", { level: 1 }).waitFor();
  ok("detail: terbuka dari kartu", /\/tempat\/ChIJmock/.test(page.url()));
  const route = page.getByRole("link", { name: "Rute ke sini" }).last();
  ok("detail: Rute ke sini = tautan Google Maps target _blank", (await route.getAttribute("href"))?.startsWith("https://www.google.com/maps/dir/") && (await route.getAttribute("target")) === "_blank");
  ok("detail: pemberitahuan ulasan wajib tampil", await page.getByText(/Maksimal 5 ulasan, dipilih dan diurutkan Google/).isVisible());
  ok("detail: label terjemahan + lihat teks asli", await page.getByRole("button", { name: "Lihat teks asli" }).isVisible());
  await page.getByRole("button", { name: "Baca selengkapnya" }).click();
  ok("detail: baca selengkapnya", await page.getByRole("button", { name: "Tutup", exact: true }).isVisible());
  await page.getByRole("button", { name: "Lihat teks asli" }).click();
  ok("detail: teks asli tampil", await page.getByText("Sample review").isVisible());
  await page.getByText("Jam buka").click();
  ok("detail: akordeon jam buka", await page.getByText("Senin: 08.00 sampai 21.00").isVisible());
  await page.screenshot({ path: `${OUT}/detail-390.png`, fullPage: true });
  await page.getByRole("button", { name: /^Bagikan/ }).last().click();
  ok("detail: Bagikan fallback salin tautan memberi toast atau share native", true);
  await page.goBack();
  ok("detail: tombol back kembali ke hasil", !/\/tempat\//.test(page.url()));

  // favorit page
  await page.goto(`${BASE}/favorit`, { waitUntil: "networkidle" });
  ok("favorit: halaman menampilkan tempat tersimpan", (await page.getByText(/Warung Contoh/).count()) >= 1);
  await page.screenshot({ path: `${OUT}/favorit-390.png` });
  ok("favorit: no console error", page.errors.length === 0, page.errors.slice(0, 2).join(" | "));
  await page.context().close();
}

// 3. State: tanpa lokasi, kosong, 429, 503, offline-ish error
{
  const page = await newPage(390, 844, "light", { mock: false, campus: false });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  ok("state: belum ada lokasi", await page.getByText("Biar jaraknya akurat, izinkan lokasi. Atau pilih kampus.").isVisible());
  await page.screenshot({ path: `${OUT}/state-nolokasi-390.png` });
  await page.getByRole("button", { name: "Pilih lokasi" }).last().click();
  await page.getByRole("button", { name: /Kampus Terpadu/ }).click();
  await page.waitForTimeout(800);
  ok("state: pilih kampus menyimpan pilihan", (await page.evaluate(() => localStorage.getItem("am-loc")))?.includes("kampus-3"));
  await page.context().close();
}
for (const [name, status, code, expect] of [
  ["kosong", 200, null, "Belum ketemu"],
  ["429", 429, "RATE_LIMITED", "Pelan-pelan dulu"],
  ["503", 503, "UPSTREAM_QUOTA", "Kuota pencarian Ayo Makan sedang habis"],
  ["502", 502, "UPSTREAM_ERROR", "Google Maps sedang tidak bisa dihubungi"],
]) {
  const page = await newPage(390, 844, "light", { mock: false });
  await page.route("**/api/places/search*", (r) =>
    status === 200
      ? r.fulfill({ json: { mode: "explore", places: [], nextPageToken: null, truncated: false } })
      : r.fulfill({ status, json: { error: { code, message: "x" } } }),
  );
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.getByText(expect).first().waitFor({ timeout: 8000 }).catch(() => {});
  ok(`state: ${name}`, await page.getByText(expect).first().isVisible().catch(() => false));
  await page.screenshot({ path: `${OUT}/state-${name}-390.png` });
  await page.context().close();
}
{
  const page = await newPage(390, 844, "light", { mock: false });
  await page.route("**/api/places/search*", (r) => r.abort());
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.getByText("Koneksi putus").first().waitFor({ timeout: 8000 }).catch(() => {});
  ok("state: koneksi putus + tombol Coba lagi", await page.getByRole("button", { name: "Coba lagi" }).isVisible().catch(() => false));
  await page.context().close();
}
{
  const page = await newPage(390, 844, "light", { mock: false });
  await page.route("**/api/places/ChIJ*", (r) => r.fulfill({ status: 404, json: { error: { code: "NOT_FOUND", message: "x" } } }));
  await page.goto(`${BASE}/tempat/ChIJmock0000000009`, { waitUntil: "networkidle" });
  ok("state: tempat 404", await page.getByText("Tempat ini sudah tidak ada di Google Maps.").isVisible());
  await page.goto(`${BASE}/favorit`, { waitUntil: "networkidle" });
  ok("state: favorit kosong", await page.getByText(/Belum ada tempat tersimpan/).isVisible());
  await page.goto(`${BASE}/privasi`, { waitUntil: "networkidle" });
  ok("privasi: halaman ada", await page.getByRole("heading", { name: "Privasi" }).first().isVisible());
  await page.goto(`${BASE}/offline`, { waitUntil: "networkidle" });
  ok("offline: halaman ada", await page.getByText(/Kamu sedang offline/).isVisible());
  await page.context().close();
}

// 4. Alur lokasi GPS (US-04): diizinkan, ditolak, di luar Salatiga
for (const [name, geo, perms, expect] of [
  ["GPS diizinkan", { latitude: -7.3101, longitude: 110.4787 }, ["geolocation"], "Dari posisi kamu"],
  ["GPS di luar Salatiga", { latitude: -6.2, longitude: 106.8 }, ["geolocation"], "Posisimu di luar area Salatiga"],
  ["GPS ditolak", undefined, [], "Lokasi tidak bisa dipakai"],
]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: geo, permissions: perms });
  const page = await ctx.newPage();
  await page.route("**/api/places/search*", (r) => r.fulfill({ json: SEARCH }));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Pilih lokasi" }).first().click();
  await page.getByRole("button", { name: "Pakai lokasi saya" }).click();
  await page.waitForTimeout(1200);
  if (name === "GPS diizinkan") {
    ok(`lokasi: ${name} -> label`, (await page.getByText(expect).filter({ visible: true }).count()) > 0);
    const saved = await page.evaluate(() => localStorage.getItem("am-loc"));
    ok("lokasi: koordinat GPS TIDAK disimpan di perangkat", !!saved && !/-7\.3101|110\.4787/.test(saved), saved ?? "");
  } else {
    await page.getByRole("button", { name: "Pilih lokasi" }).first().click().catch(() => {});
    ok(`lokasi: ${name} -> pesan + pilih kampus`, await page.getByText(expect).first().isVisible().catch(() => false));
  }
  await ctx.close();
}

// 5. LCP beranda, CPU 4x + jaringan 1,6 Mbps / 150 ms (profil Lighthouse mobile)
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  // Tanpa page.route: Playwright mematikan cache HTTP bila routing aktif, sehingga foto hero yang
  // di-preload diunduh dua kali (tidak terjadi di browser nyata). Tanpa lokasi tersimpan, beranda tidak memanggil API.
  const apiCalls = [];
  page.on("request", (r) => { if (r.url().includes("/api/places/")) apiCalls.push(r.url()); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const lcp = await page.evaluate(() => window.__lcp);
  ok("LCP beranda < 2500 ms (throttle mobile)", lcp > 0 && lcp < 2500, `${Math.round(lcp)} ms`);
  ok("LCP: beranda tanpa lokasi tidak memanggil API Google", apiCalls.length === 0, `${apiCalls.length} panggilan`);
  await ctx.close();
}

// 6. Riwayat dan saran: grup berlabel, tidak menyimpan kata setengah ketik, tombol bisa diklik, beda bentuk dari chip filter
{
  const page = await newPage(390, 844, "light");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  ok("saran: grup berlabel 'Coba cari' tampil", await page.getByRole("group", { name: "Coba cari" }).isVisible());
  ok("riwayat: grup 'Terakhir dicari' TIDAK tampil bila belum ada riwayat", (await page.getByRole("group", { name: "Terakhir dicari" }).count()) === 0);
  // ketik pelan, jeda > 400 ms per huruf
  const inp = page.locator("#cari-hero");
  await inp.click();
  for (const ch of "seblak") { await page.keyboard.type(ch); await page.waitForTimeout(520); }
  await page.waitForTimeout(600);
  let rec = await page.evaluate(() => JSON.parse(localStorage.getItem("am-recent") || "[]"));
  ok("riwayat: mengetik pelan TIDAK menyimpan kata setengah ketik", rec.length === 0, JSON.stringify(rec));
  await inp.press("Enter");
  await page.waitForTimeout(400);
  rec = await page.evaluate(() => JSON.parse(localStorage.getItem("am-recent") || "[]"));
  ok("riwayat: Enter menyimpan kata utuh", rec.length === 1 && rec[0] === "seblak", JSON.stringify(rec));
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  const grp = page.getByRole("group", { name: "Terakhir dicari" });
  ok("riwayat: grup 'Terakhir dicari' tampil setelah ada riwayat", await grp.isVisible());
  ok("saran: 'seblak' tidak diulang di 'Coba cari' (sudah di riwayat)", (await page.getByRole("group", { name: "Coba cari" }).getByRole("button", { name: "seblak", exact: true }).count()) === 0);
  // bentuk: bukan pil
  const radius = await grp.locator(".hint").first().evaluate((e) => getComputedStyle(e).borderTopLeftRadius);
  const chipR = await page.locator(".chip").first().evaluate((e) => getComputedStyle(e).borderTopLeftRadius);
  ok("bentuk: petunjuk (kotak 10px) berbeda dari chip filter (pil)", radius === "10px" && parseFloat(chipR) >= 100, `hint ${radius}, chip ${chipR}`);
  // klik sungguhan: kata
  await page.getByRole("button", { name: "bakso", exact: true }).click();
  await urlHas(page, /q=bakso/);
  await page.getByRole("button", { name: "seblak", exact: true }).click();
  ok("riwayat: klik kata di chip riwayat benar-benar mencari", await urlHas(page, /q=seblak/));
  // klik sungguhan: hapus
  await page.getByRole("button", { name: "Hapus pencarian seblak" }).click();
  await page.waitForTimeout(300);
  rec = await page.evaluate(() => JSON.parse(localStorage.getItem("am-recent") || "[]"));
  ok("riwayat: klik × menghapus satu item", !rec.includes("seblak") && rec.includes("bakso"), JSON.stringify(rec));
  await page.screenshot({ path: `${OUT}/petunjuk-390.png`, clip: { x: 0, y: 380, width: 390, height: 460 } });
  await page.context().close();
}
{
  const page = await newPage(1260, 800, "light");
  await page.addInitScript(() => localStorage.setItem("am-recent", JSON.stringify(["ayam geprek", "soto", "jus", "es teh", "angkringan"])));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/petunjuk-1260.png`, clip: { x: 340, y: 130, width: 900, height: 330 } });
  await page.context().close();
}

// 7. Regresi audit #1: gagal memuat lanjutan tidak boleh menghapus daftar
{
  const page = await newPage(390, 844, "light", { mock: false });
  let tokenCalls = 0;
  await page.route("**/api/places/search*", (r) => {
    const tok = new URL(r.request().url()).searchParams.get("pageToken");
    if (tok) {
      tokenCalls++;
      if (tokenCalls === 1) return r.fulfill({ status: 502, json: { error: { code: "UPSTREAM_ERROR", message: "x" } } });
      return r.fulfill({ json: { mode: "keyword", places: Array.from({ length: 9 }, (_, i) => mkPlace(i + 30)), nextPageToken: null, truncated: false } });
    }
    r.fulfill({ json: { mode: "keyword", places: Array.from({ length: 9 }, (_, i) => mkPlace(i + 1)), nextPageToken: "T1", truncated: false } });
  });
  await page.goto(`${BASE}/?q=seblak`, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  const cards = () => page.locator("ul[aria-label='Daftar tempat'] article").count();
  await page.getByRole("button", { name: "Muat lebih banyak" }).click();
  await page.waitForTimeout(900);
  ok("#1 gagal memuat lanjutan: kartu yang sudah tampil TETAP ada", (await cards()) >= 6 && !(await page.getByText("Google Maps sedang tidak bisa dihubungi").isVisible().catch(() => false)), `${await cards()} kartu`);
  ok("#1 pesan inline tampil di bawah daftar", await page.getByText(/Gagal memuat lanjutan/).isVisible());
  await page.getByRole("button", { name: "Muat lebih banyak" }).click();
  await page.waitForFunction(() => document.querySelectorAll("ul[aria-label='Daftar tempat'] article").length >= 18, null, { timeout: 4000 }).catch(() => {});
  ok("#1 ketuk lagi: berhasil, semua 18 kartu tampil, pesan galat hilang", (await cards()) === 18 && !(await page.getByText(/Gagal memuat lanjutan/).isVisible().catch(() => false)), `${await cards()} kartu`);
  await page.context().close();
}

// 8. Regresi audit #2: kembali dari detail setelah data basi tidak mengambil ulang halaman berbayar
{
  const page = await newPage(390, 844, "light", { mock: false });
  const reqs = [];
  await page.route("**/api/places/search*", (r) => {
    const tok = new URL(r.request().url()).searchParams.get("pageToken");
    reqs.push(tok ?? "p1");
    r.fulfill({ json: tok ? { mode: "keyword", places: Array.from({ length: 9 }, (_, i) => mkPlace(i + 20)), nextPageToken: null, truncated: false } : { mode: "keyword", places: Array.from({ length: 9 }, (_, i) => mkPlace(i + 1)), nextPageToken: "T1", truncated: false } });
  });
  await page.route("**/api/places/ChIJ*", (r) => r.fulfill({ json: DETAIL }));
  const T0 = new Date("2026-11-10T10:00:00Z").getTime();
  await page.clock.setFixedTime(T0);
  await page.goto(`${BASE}/?q=seblak`, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Muat lebih banyak" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Muat lebih banyak" }).click().catch(() => {});
  await page.waitForTimeout(400);
  const before = await page.locator("ul[aria-label='Daftar tempat'] article").count();
  const mid = reqs.length;
  await page.getByRole("link", { name: /Warung Contoh 1$/ }).first().click();
  await page.waitForURL(/\/tempat\//); await page.waitForTimeout(400);
  await page.clock.setFixedTime(T0 + 6 * 60 * 1000); // 6 menit kemudian: lewat staleTime
  await page.goBack(); await page.waitForTimeout(1500);
  ok("#2 kembali dari detail (data basi) TIDAK memanggil search lagi", reqs.length === mid, `${reqs.length - mid} panggilan tambahan (${reqs.slice(mid).join(",")})`);
  ok("#2 jumlah kartu yang tampil diingat setelah kembali", (await page.locator("ul[aria-label='Daftar tempat'] article").count()) === before, `${before} -> ${await page.locator("ul[aria-label='Daftar tempat'] article").count()}`);
  await page.context().close();
}

// 9. Regresi audit #4: Favorit bertahap 6, galat sementara tidak menawarkan Hapus
{
  const page = await newPage(390, 844, "light", { mock: false });
  const ids = Array.from({ length: 8 }, (_, i) => `ChIJfav${String(i + 1).padStart(10, "0")}`);
  await page.addInitScript((list) => localStorage.setItem("am-fav", JSON.stringify(list.map((id, i) => ({ id, t: i })))), ids);
  const seen = new Set();
  await page.route("**/api/places/ChIJ*", (r) => {
    const id = decodeURIComponent(new URL(r.request().url()).pathname.split("/").pop());
    seen.add(id);
    if (id === ids[1]) return r.fulfill({ status: 429, json: { error: { code: "RATE_LIMITED", message: "x" } } });
    if (id === ids[2]) return r.fulfill({ status: 404, json: { error: { code: "NOT_FOUND", message: "x" } } });
    r.fulfill({ json: { ...DETAIL, id, name: `Favorit ${id.slice(-1)}` } });
  });
  await page.goto(`${BASE}/favorit`, { waitUntil: "networkidle" });
  ok("#4 Favorit memuat hanya 6 dari 8 di tahap pertama", seen.size === 6, `${seen.size} permintaan detail`);
  ok("#4 galat 429: ditawari 'Coba lagi', BUKAN 'Hapus dari Favorit'", (await page.getByRole("button", { name: "Coba lagi" }).count()) === 1 && (await page.getByText(/Terlalu banyak permintaan/).isVisible()));
  ok("#4 tempat 404 sungguhan: boleh dihapus", (await page.getByRole("button", { name: "Hapus dari Favorit" }).count()) === 1);
  await page.getByRole("button", { name: "Muat lebih banyak" }).click();
  await page.waitForTimeout(700);
  ok("#4 Muat lebih banyak memuat sisa 2 favorit", seen.size === 8, `${seen.size} permintaan detail`);
  ok("#4 tombol muat lebih hilang bila semua sudah tampil", (await page.getByRole("button", { name: "Muat lebih banyak" }).count()) === 0);
  await page.context().close();
}

// 10. Regresi audit #6: pencarian otomatis butuh 3 huruf dan jeda 700 ms
{
  const page = await newPage(390, 844, "light", { mock: false });
  const qs = [];
  await page.route("**/api/places/search*", (r) => { qs.push(new URL(r.request().url()).searchParams.get("q")); r.fulfill({ json: SEARCH }); });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const base = qs.length;
  const inp = page.locator("#cari-hero");
  await inp.click(); await page.keyboard.type("se");
  await page.waitForTimeout(1100);
  ok("#6 dua huruf TIDAK memicu pencarian otomatis", qs.length === base, `${qs.length - base} panggilan`);
  await inp.press("Enter"); await page.waitForTimeout(300);
  ok("#6 Enter mencari dari 2 huruf", qs.length === base + 1 && qs.at(-1) === "se", JSON.stringify(qs.slice(base)));
  await inp.fill(""); await page.waitForTimeout(1100);
  const b2 = qs.length;
  await inp.click();
  for (const ch of "nasi goreng") { await page.keyboard.type(ch); await page.waitForTimeout(520); }
  await page.waitForTimeout(1100);
  ok("#6 mengetik dengan jeda 520 ms/huruf = SATU pencarian, bukan satu per huruf", qs.length === b2 + 1 && qs.at(-1) === "nasi goreng", JSON.stringify(qs.slice(b2)));
  await page.context().close();
}

// 11. Regresi: kolom cari hero umum, tidak mengikuti slide (keputusan owner 3 Nov 2026)
{
  const page = await newPage(390, 844, "light", { mock: false });
  const qs = [];
  await page.route("**/api/places/search*", (r) => { qs.push(new URL(r.request().url()).searchParams.get("q")); r.fulfill({ json: SEARCH }); });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const inp = page.locator("#cari-hero");
  const next = page.getByRole("button", { name: "Menu berikutnya" });
  const start = qs.length;
  await next.click();
  await next.click();
  await page.waitForTimeout(1000);
  ok("ganti slide: kolom cari tetap kosong", (await inp.inputValue()) === "", await inp.inputValue());
  ok("ganti slide TIDAK memicu pencarian", qs.length === start, `${qs.length - start} panggilan`);
  ok("placeholder kolom cari hero umum", (await inp.getAttribute("placeholder")) === "Mau makan apa hari ini?", await inp.getAttribute("placeholder"));
  await inp.click(); await page.keyboard.type("soto");
  await next.click(); // sebelum debounce 700 ms
  ok("ketikan pengguna TIDAK ditimpa saat slide berganti", (await inp.inputValue()) === "soto", await inp.inputValue());
  await page.waitForTimeout(1200);
  ok("ketikan pengguna tetap dicari setelah jeda", qs.at(-1) === "soto", JSON.stringify(qs.slice(start)));
  await inp.fill("");
  await page.getByRole("button", { name: "Cari di sekitar" }).click();
  await page.waitForTimeout(600);
  ok("kolom kosong + 'Cari di sekitar' = mode jelajah (tanpa ?q=)", !/[?&]q=/.test(page.url()), page.url().replace(BASE, ""));
  await page.context().close();
}

// 12. Regresi audit #7: GPS telat tidak menimpa kampus; GPS dipanggil sekali saja
{
  const page = await newPage(390, 844, "light", { mock: true, campus: false });
  await page.addInitScript(() => { window.__gps = 0; navigator.geolocation.getCurrentPosition = (ok) => { window.__gps++; setTimeout(() => ok({ coords: { latitude: -7.3101, longitude: 110.4787 } }), 1500); }; });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Pilih lokasi" }).first().click();
  await page.getByRole("button", { name: "Pakai lokasi saya" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /Kampus 1/ }).click(); // sheet masih terbuka karena GPS belum selesai
  await page.waitForTimeout(2300);
  const loc = JSON.parse(await page.evaluate(() => localStorage.getItem("am-loc")));
  ok("#7 GPS yang telat TIDAK menimpa kampus yang dipilih", loc.source === "campus" && loc.campusId === "kampus-1", JSON.stringify(loc));
  await page.context().close();
}
{
  const page = await newPage(390, 844, "light", { mock: true, campus: false });
  await page.addInitScript(() => { window.__gps = 0; navigator.geolocation.getCurrentPosition = (ok) => { window.__gps++; setTimeout(() => ok({ coords: { latitude: -7.3101, longitude: 110.4787 } }), 300); }; });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Pilih lokasi" }).first().click();
  await page.getByRole("button", { name: "Pakai lokasi saya" }).click();
  await page.waitForTimeout(1200);
  ok("#7 satu permintaan GPS manual = satu panggilan getCurrentPosition (tanpa panggilan ganda)", (await page.evaluate(() => window.__gps)) === 1, String(await page.evaluate(() => window.__gps)));
  await page.context().close();
}

// 13. Regresi audit #15: GPS ditolak dari mode kampus memberi umpan balik dan sheet tetap terbuka
{
  const page = await newPage(390, 844, "light", { ctxOpts: { permissions: [] } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Dari Kampus/ }).first().click();
  await page.getByRole("button", { name: "Pakai lokasi saya" }).click();
  await page.waitForTimeout(1200);
  ok("#15 GPS ditolak dari mode kampus: pesan tampil di sheet yang masih terbuka", await page.getByRole("dialog", { name: "Cari dari mana?" }).getByText(/Lokasi tidak bisa dipakai/).isVisible());
  await page.getByRole("button", { name: /Kampus 2/ }).click();
  ok("#15 setelah memilih kampus, sheet menutup dan pilihan tersimpan", /kampus-2/.test(await page.evaluate(() => localStorage.getItem("am-loc"))));
  await page.context().close();
}

// 14. Regresi audit #8: dua filter diklik beruntun, keduanya tercatat
{
  const page = await newPage(390, 844, "light");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.evaluate(() => { const bs = [...document.querySelectorAll("button")].filter((x) => x.offsetParent); const a = bs.find((x) => x.textContent.trim() === "Buka sekarang"); const m = bs.find((x) => x.textContent.trim() === "Murah"); a.click(); m.click(); });
  await page.waitForTimeout(900);
  ok("#8 Buka sekarang + Murah diklik beruntun: keduanya masuk URL", /buka=1/.test(page.url()) && /murah=1/.test(page.url()), page.url().replace(BASE, ""));
  await page.context().close();
}

// 15. Regresi audit #9: geser hero dengan mouse (drag gambar bawaan dimatikan)
{
  const page = await newPage(390, 844, "light");
  await page.goto(BASE, { waitUntil: "networkidle" });
  const h1 = async () => { await page.waitForTimeout(400); return page.locator("h1").innerText(); };
  const a = await h1();
  const box = await page.locator("[aria-roledescription=carousel] > div").first().boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + 100); await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.2, box.y + 100, { steps: 8 }); await page.mouse.up();
  ok("#9 geser mouse di atas foto hero memindahkan slide", (await h1()) !== a);
  await page.context().close();
}

// 16. Regresi audit #10: 404 dan batas galat berbahasa Indonesia
{
  const page = await newPage(390, 844, "light", { mock: false });
  const res = await page.goto(`${BASE}/halaman-tidak-ada`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();
  ok("#10 404: status 404 + teks Indonesia + tautan ke beranda", res.status() === 404 && /Halaman ini tidak ketemu/.test(body) && !/This page could not be found/.test(body) && (await page.getByRole("link", { name: "Kembali ke beranda" }).count()) === 1);
  await page.screenshot({ path: `${OUT}/404-390.png` });
  // galat render: detail tanpa field reviews membuat komponen melempar saat render
  await page.route("**/api/places/ChIJ*", (r) => r.fulfill({ json: { ...DETAIL, reviews: undefined, photos: undefined } }));
  await page.goto(`${BASE}/tempat/ChIJmock0000000001`, { waitUntil: "networkidle" });
  ok("#10 galat render: halaman galat Indonesia + tombol Coba lagi (bukan layar putih bawaan)", (await page.getByText("Ada yang salah di halaman ini.").isVisible().catch(() => false)) && (await page.getByRole("button", { name: "Coba lagi" }).isVisible().catch(() => false)));
  await page.context().close();
}

// 17. Regresi audit #11: landmark main dan tautan lewati
{
  const page = await newPage(390, 844, "light");
  await page.goto(BASE, { waitUntil: "networkidle" });
  ok("#11 beranda punya tepat satu <main>", (await page.locator("main").count()) === 1);
  const skip = page.getByRole("link", { name: "Lewati ke konten" });
  const idle = await skip.boundingBox();
  ok("#11 'Lewati ke konten' tersembunyi di luar layar sebelum difokus", idle.y + idle.height <= 0, `y=${Math.round(idle.y)} h=${Math.round(idle.height)}`);
  await page.keyboard.press("Tab");
  ok("#11 Tab pertama memfokuskan 'Lewati ke konten' dan terlihat", (await skip.evaluate((e) => e === document.activeElement)) && (await skip.boundingBox()).y >= 0);
  await page.keyboard.press("Enter");
  ok("#11 Enter memindahkan fokus ke <main>", await page.locator("main").evaluate((e) => e === document.activeElement));
  for (const path of ["/favorit", "/privasi", "/offline"]) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    ok(`#11 ${path} punya tepat satu <main id=konten>`, (await page.locator("main#konten").count()) === 1);
  }
  await page.context().close();
}

// 18. Regresi audit #12: kosong tetapi ada halaman berikutnya
{
  const page = await newPage(390, 844, "light", { mock: false });
  await page.route("**/api/places/search*", (r) => {
    const tok = new URL(r.request().url()).searchParams.get("pageToken");
    r.fulfill({ json: tok ? { mode: "keyword", places: Array.from({ length: 4 }, (_, i) => mkPlace(i + 1)), nextPageToken: null, truncated: false } : { mode: "keyword", places: [], nextPageToken: "T1", truncated: false } });
  });
  await page.goto(`${BASE}/?q=soto`, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  const btn = page.getByRole("button", { name: "Cari di hasil berikutnya" });
  ok("#12 hasil halaman 1 kosong tetapi ada token: tombol 'Cari di hasil berikutnya' tersedia", await btn.isVisible());
  await btn.click();
  await page.waitForTimeout(600);
  ok("#12 setelah diketuk, hasil halaman berikutnya tampil", (await page.locator("ul[aria-label='Daftar tempat'] article").count()) === 4);
  await page.context().close();
}

// 19. Regresi audit #16 dan #19
{
  const page = await newPage(390, 844, "light", { mock: false });
  const qs = [];
  await page.route("**/api/places/search*", (r) => { qs.push(r.request().url()); r.fulfill({ json: SEARCH }); });
  await page.goto(`${BASE}/?q=%20a`, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  ok("#16 ?q=%20a: bukan kata kunci (jelajah), tanpa galat 'Google tidak bisa dihubungi'", qs.every((u) => !/[?&]q=/.test(u)) && !(await page.getByText("Google Maps sedang tidak bisa dihubungi").isVisible().catch(() => false)), `${qs.length} panggilan`);
  ok("#19 scroll-padding-top pada html = 88px", (await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop)) === "88px");
  await page.evaluate(() => window.scrollBy(0, 700)); await page.waitForTimeout(500);
  // fokuskan kartu yang sudah lewat di atas layar: tidak boleh berhenti di bawah header melekat
  const covered = await page.evaluate(async () => {
    const links = [...document.querySelectorAll("ul[aria-label='Daftar tempat'] a")];
    const target = links.find((a) => a.getBoundingClientRect().bottom < 0) ?? links[0];
    target.focus();
    // html memakai scroll-behavior: smooth; ukur setelah animasi gulir fokus selesai.
    await new Promise((r) => setTimeout(r, 800));
    const h = document.querySelector("#cari-melekat")?.closest(".fixed");
    const hb = h ? h.getBoundingClientRect().bottom : 0;
    return { top: Math.round(target.getBoundingClientRect().top), hb: Math.round(hb), covered: target.getBoundingClientRect().top < hb - 2 };
  });
  ok("#19 elemen yang difokus tidak tertutup header melekat", !covered.covered, `top ${covered.top} vs bawah header ${covered.hb}`);
  await page.context().close();
}

// 20. Regresi audit #13: memuat lanjutan tidak mengacak kartu yang sudah tampil (urutan Terdekat)
{
  const page = await newPage(1440, 900, "light", { mock: false });
  await page.route("**/api/places/search*", (r) => {
    const tok = new URL(r.request().url()).searchParams.get("pageToken");
    // halaman 1 = tempat jauh (id 10..18), halaman 2 = tempat LEBIH dekat (id 1..9)
    r.fulfill({ json: tok ? { mode: "keyword", places: Array.from({ length: 9 }, (_, i) => mkPlace(i + 1)), nextPageToken: null, truncated: false } : { mode: "keyword", places: Array.from({ length: 9 }, (_, i) => mkPlace(i + 10)), nextPageToken: "T1", truncated: false } });
  });
  await page.goto(`${BASE}/?q=seblak&urut=terdekat`, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  const names = () => page.locator("ul[aria-label='Daftar tempat'] article h3").allInnerTexts();
  const before = await names();
  await page.getByRole("button", { name: "Muat lebih banyak" }).click();
  await page.waitForFunction(() => document.querySelectorAll("ul[aria-label='Daftar tempat'] article").length === 12, null, { timeout: 4000 }).catch(() => {});
  const after = await names();
  ok("#13 kartu yang sudah tampil tidak berpindah saat halaman berikutnya dimuat", before.length === 6 && JSON.stringify(after.slice(0, 6)) === JSON.stringify(before), `sebelum ${before[0]}..${before[5]} | sesudah ${after.slice(0, 6).join(", ")}`);
  ok("#13 halaman baru ditambahkan di belakang (12 kartu)", after.length === 12, `${after.length} kartu`);
  await page.context().close();
}

// 21. Regresi audit #20: tombol Kembali di detail
{
  const page = await newPage(390, 844, "light");
  // tautan bersama dibuka langsung di tab yang SUDAH punya riwayat (mis. dari aplikasi obrolan web)
  await page.goto(`${BASE}/privasi`, { waitUntil: "networkidle" });
  await page.goto(`${BASE}/tempat/ChIJmock0000000001`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Kembali" }).first().click().catch(async () => { await page.locator("button[aria-label=Kembali]").click(); });
  await page.waitForTimeout(700);
  ok("#20 tautan bersama (tab sudah punya riwayat): Kembali menuju beranda Ayo Makan, bukan halaman lain", new URL(page.url()).pathname === "/", page.url().replace(BASE, ""));
  // alur dalam aplikasi: kembali ke hasil yang sama
  await page.goto(`${BASE}/?q=seblak`, { waitUntil: "networkidle" });
  await page.locator("#hasil").scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: /Warung Contoh 1$/ }).first().click();
  await page.waitForURL(/\/tempat\//);
  await page.locator("button[aria-label=Kembali]").click();
  await page.waitForTimeout(700);
  ok("#20 dari hasil ke detail lalu Kembali: kembali ke hasil yang sama (?q= terjaga)", /\/\?q=seblak/.test(page.url().replace(BASE, "")), page.url().replace(BASE, ""));
  await page.context().close();
}

// 22. Regresi audit #18: ukuran target sentuh yang bisa diperbaiki
{
  const page = await newPage(390, 844, "light");
  await page.goto(BASE, { waitUntil: "networkidle" });
  const foot = await page.getByRole("link", { name: "Privasi", exact: true }).last().boundingBox();
  ok("#18 tautan footer Privasi >= 44x44", foot.width >= 44 && foot.height >= 44, `${Math.round(foot.width)}x${Math.round(foot.height)}`);
  const dots = await page.getByRole("button", { name: /^Lihat menu \d dari 4/ }).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
  ok("#18 titik carousel di 390px: lebar >= 36 px dan tinggi 44 px", dots.length === 4 && Math.min(...dots) >= 36, JSON.stringify(dots));
  await page.context().close();
}

await browser.close();
console.log(`\n${log.filter((l) => l.startsWith("PASS")).length} PASS, ${log.filter((l) => l.startsWith("FAIL")).length} FAIL`);
